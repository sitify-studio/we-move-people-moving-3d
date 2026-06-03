'use client';

import React, { useRef, useEffect, useLayoutEffect, useMemo, useState, Suspense, memo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, RoundedBox } from '@react-three/drei';
import { useIntersectionObserver } from '@/app/lib/lazy-load';
import { HeroAmbientParticles } from '@/app/components/sections/HeroMantisScene';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Page } from '@/app/lib/types';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { getHeroTitleText } from '@/app/lib/siteContent';
import { tiptapToText, tiptapToLines } from '@/app/lib/seo';
import { resolvePrimaryCta } from '@/app/components/ui/made';
import { cn } from '@/app/lib/utils';
import { parseEditorialHeroLines } from '@/app/components/sections/EditorialHeroTypography';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import type { ThemeColors } from '@/app/hooks/useTheme';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

// --- 3D CARGO COMPONENTS ---

const WHEEL_POSITIONS: [number, number, number][] = [
  [-1.8, -0.52, 1.05],
  [1.2, -0.52, 1.05],
  [-1.8, -0.52, -1.05],
  [1.2, -0.52, -1.05],
];

const CORRUGATION_COUNT = 6;

const wheelTireGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.34, 12);
const wheelRimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.36, 12);

function Wheel({
  position,
  onRef,
}: {
  position: [number, number, number];
  onRef: (group: THREE.Group | null) => void;
}) {
  return (
    <group ref={onRef} position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]} geometry={wheelTireGeo}>
        <meshStandardMaterial color="#1a1a1a" roughness={0.92} metalness={0.05} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} geometry={wheelRimGeo}>
        <meshStandardMaterial color="#6b7280" roughness={0.35} metalness={0.85} />
      </mesh>
    </group>
  );
}

function CorrugatedPanels({
  side,
  bodyColor,
}: {
  side: 1 | -1;
  bodyColor: string;
}) {
  const z = side * 1.03;
  return (
    <>
      {Array.from({ length: CORRUGATION_COUNT }, (_, i) => (
        <mesh
          key={`${side}-${i}`}
          position={[-2.1 + i * 0.72, 0.85, z]}
        >
          <boxGeometry args={[0.06, 1.55, 0.04]} />
          <meshStandardMaterial
            color={bodyColor}
            roughness={0.45}
            metalness={0.5}
          />
        </mesh>
      ))}
    </>
  );
}

function CardboardBox({
  position,
  color,
  tapeColor = '#c4a574',
}: {
  position: [number, number, number];
  color: string;
  tapeColor?: string;
}) {
  return (
    <group position={position}>
      <RoundedBox args={[0.88, 0.88, 0.88]} radius={0.04} smoothness={2}>
        <meshStandardMaterial color={color} roughness={0.85} metalness={0} />
      </RoundedBox>
      <mesh position={[0, 0, 0.445]}>
        <boxGeometry args={[0.9, 0.12, 0.02]} />
        <meshStandardMaterial color={tapeColor} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.445, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.9, 0.12, 0.02]} />
        <meshStandardMaterial color={tapeColor} roughness={0.7} />
      </mesh>
    </group>
  );
}

const ROAD_LENGTH = 22;
const DASH_COUNT = 20;
const DASH_SPACING = 1.35;
const SCENE_SCALE = 1.05;
/** Steady highway speed in scene units per second */
const DRIVE_SPEED = 3.4;
const WHEEL_SPIN_FACTOR = 2.1;

function Road({ motionRef }: { motionRef: React.RefObject<THREE.Group | null> }) {
  return (
    <group position={[0, -0.58, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.4, ROAD_LENGTH]} />
        <meshStandardMaterial color="#3d4f5f" roughness={0.92} metalness={0.05} />
      </mesh>

      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 2.05, -0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.7, ROAD_LENGTH]} />
          <meshStandardMaterial color="#4a7c59" roughness={1} />
        </mesh>
      ))}

      {[-1.55, 1.55].map((x) => (
        <mesh key={x} position={[x, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.06, ROAD_LENGTH]} />
          <meshStandardMaterial color="#e5e7eb" roughness={0.6} />
        </mesh>
      ))}

      <group ref={motionRef}>
        {Array.from({ length: DASH_COUNT }, (_, i) => (
          <mesh
            key={i}
            position={[0, 0.02, i * DASH_SPACING - ROAD_LENGTH / 2]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[0.14, 0.95]} />
            <meshStandardMaterial
              color="#fde047"
              emissive="#facc15"
              emissiveIntensity={0.65}
              roughness={0.35}
            />
          </mesh>
        ))}

        {Array.from({ length: Math.floor(ROAD_LENGTH / 2.2) }, (_, i) => {
          const z = i * 2.2 - ROAD_LENGTH / 2 + 1.1;
          return [-1.62, 1.62].map((x) => (
            <mesh key={`${i}-${x}`} position={[x, 0.04, z]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshStandardMaterial
                color="#fef08a"
                emissive="#fbbf24"
                emissiveIntensity={0.9}
                roughness={0.2}
              />
            </mesh>
          ));
        }).flat()}
      </group>
    </group>
  );
}

function HeroSceneCamera() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  const frameScene = () => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    camera.position.set(0, 3.8, 11);
    camera.lookAt(0, 0.4, 0);
    camera.updateProjectionMatrix();
  };

  useLayoutEffect(frameScene, [camera, size.width, size.height]);

  return null;
}

function MovingCargo({ color, active }: { color: string; active: boolean }) {
  const rigRef = useRef<THREE.Group>(null);
  const truckRef = useRef<THREE.Group>(null);
  const roadMotionRef = useRef<THREE.Group>(null);
  const wheelGroups = useRef<(THREE.Group | null)[]>([]);
  const roadOffset = useRef(0);

  useFrame((state, delta) => {
    if (!active || !rigRef.current || !truckRef.current) return;

    const dt = Math.min(delta, 0.05);
    const t = state.clock.getElapsedTime();

    // Ease up to cruise speed over ~1.2s
    const speed = DRIVE_SPEED * Math.min(1, t / 1.2);
    roadOffset.current += speed * dt;

    // Road scrolls toward the truck (forward driving illusion)
    if (roadMotionRef.current) {
      roadMotionRef.current.position.z = roadOffset.current % DASH_SPACING;
    }

    // Truck stays centered — subtle suspension only
    truckRef.current.position.z = 0;
    truckRef.current.position.y = Math.sin(t * 14) * 0.01;
    truckRef.current.rotation.y = -Math.PI / 2 + Math.sin(t * 1.2) * 0.012;
    truckRef.current.rotation.x = Math.sin(t * 14) * 0.004;

    const wheelSpin = speed * dt * WHEEL_SPIN_FACTOR;
    wheelGroups.current.forEach((wheel) => {
      if (wheel) wheel.rotation.x -= wheelSpin;
    });
  });

  const trailerColor = color;
  const cabColor = '#1f2937';
  const chassisColor = '#374151';

  return (
    <group ref={rigRef} position={[0, 0.15, 0]} scale={SCENE_SCALE}>
      <Road motionRef={roadMotionRef} />
      <group ref={truckRef} scale={1.05} rotation={[0, -Math.PI / 2, 0]}>
      {/* Chassis frame */}
      <mesh position={[0.4, -0.35, 0]}>
        <boxGeometry args={[5.8, 0.18, 1.4]} />
        <meshStandardMaterial color={chassisColor} roughness={0.7} metalness={0.4} />
      </mesh>
      <mesh position={[0.4, -0.22, 0.72]}>
        <boxGeometry args={[5.6, 0.08, 0.12]} />
        <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0.4, -0.22, -0.72]}>
        <boxGeometry args={[5.6, 0.08, 0.12]} />
        <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Trailer body */}
      <group position={[-0.35, 0.82, 0]}>
        <RoundedBox args={[4.35, 1.92, 2.08]} radius={0.06} smoothness={2}>
          <meshStandardMaterial
            color={trailerColor}
            roughness={0.35}
            metalness={0.45}
          />
        </RoundedBox>
        <CorrugatedPanels side={1} bodyColor={trailerColor} />
        <CorrugatedPanels side={-1} bodyColor={trailerColor} />

        {/* Rear door seam + handles */}
        <mesh position={[-2.22, 0.82, 0]}>
          <boxGeometry args={[0.06, 1.75, 1.95]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[-2.24, 1.1, 0.55]}>
          <boxGeometry args={[0.04, 0.35, 0.08]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[-2.24, 1.1, -0.55]}>
          <boxGeometry args={[0.04, 0.35, 0.08]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.25} />
        </mesh>

        {/* Taillights */}
        {[-0.72, 0.72].map((z) => (
          <mesh key={z} position={[-2.2, 0.45, z]}>
            <boxGeometry args={[0.08, 0.22, 0.28]} />
            <meshStandardMaterial
              color="#ef4444"
              emissive="#dc2626"
              emissiveIntensity={0.8}
              roughness={0.3}
            />
          </mesh>
        ))}
      </group>

      {/* Fifth wheel / coupling */}
      <mesh position={[1.95, 0.15, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.12, 12]} />
        <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Cab */}
      <group position={[2.95, 0.55, 0]}>
        <RoundedBox args={[1.55, 1.35, 1.95]} radius={0.08} smoothness={2}>
          <meshStandardMaterial color={cabColor} roughness={0.3} metalness={0.6} />
        </RoundedBox>

        {/* Hood slope */}
        <mesh position={[0.55, -0.15, 0]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.9, 0.5, 1.85]} />
          <meshStandardMaterial color={cabColor} roughness={0.3} metalness={0.6} />
        </mesh>

        {/* Grille */}
        <mesh position={[0.82, -0.05, 0]}>
          <boxGeometry args={[0.08, 0.55, 1.35]} />
          <meshStandardMaterial color="#111827" metalness={0.5} roughness={0.6} />
        </mesh>
        {[-0.45, 0, 0.45].map((z) => (
          <mesh key={z} position={[0.86, -0.12, z]}>
            <boxGeometry args={[0.04, 0.35, 0.06]} />
            <meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}

        {/* Headlights */}
        {[-0.78, 0.78].map((z) => (
          <group key={z} position={[0.9, 0.05, z]}>
            <mesh>
              <boxGeometry args={[0.1, 0.2, 0.35]} />
              <meshStandardMaterial
                color="#fef9c3"
                emissive="#fde68a"
                emissiveIntensity={0.6}
                roughness={0.2}
              />
            </mesh>
          </group>
        ))}

        {/* Windshield */}
        <mesh position={[0.72, 0.35, 0]}>
          <boxGeometry args={[0.12, 0.65, 1.55]} />
          <meshStandardMaterial color="#93c5fd" transparent opacity={0.45} roughness={0.1} />
        </mesh>

        {/* Side windows */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[0.2, 0.45, side * 0.98]}>
            <boxGeometry args={[0.7, 0.45, 0.06]} />
            <meshStandardMaterial color="#7dd3fc" transparent opacity={0.4} roughness={0.15} />
          </mesh>
        ))}

        {/* Mirrors */}
        {[-1.05, 1.05].map((z) => (
          <group key={z} position={[0.35, 0.55, z]}>
            <mesh>
              <boxGeometry args={[0.25, 0.06, 0.06]} />
              <meshStandardMaterial color="#111827" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0.14, 0, 0]}>
              <boxGeometry args={[0.08, 0.18, 0.22]} />
              <meshStandardMaterial color="#1e3a5f" roughness={0.2} metalness={0.3} />
            </mesh>
          </group>
        ))}

        {/* Front bumper */}
        <mesh position={[0.95, -0.42, 0]}>
          <boxGeometry args={[0.12, 0.2, 2.05]} />
          <meshStandardMaterial color="#111827" metalness={0.7} roughness={0.35} />
        </mesh>

        {/* Exhaust stack */}
        <mesh position={[-0.35, 0.95, 0.85]}>
          <cylinderGeometry args={[0.06, 0.07, 0.55, 8]} />
          <meshStandardMaterial color="#4b5563" metalness={0.85} roughness={0.25} />
        </mesh>
      </group>

      {/* Wheels — dual axles on trailer, steer + drive on cab */}
      {WHEEL_POSITIONS.map((pos, i) => (
        <Wheel
          key={i}
          position={pos}
          onRef={(g) => {
            wheelGroups.current[i] = g;
          }}
        />
      ))}

      {/* Cargo on trailer roof */}
      <CardboardBox position={[-0.85, 1.95, 0]} color="#d97706" />
      <CardboardBox position={[0.35, 1.95, 0.15]} color="#b45309" />
      <CardboardBox position={[-0.2, 2.85, -0.1]} color="#92400e" />

      </group>
    </group>
  );
}

function HeroCargoCanvas({
  accentColor,
  active,
}: {
  accentColor: string;
  active: boolean;
}) {
  return (
    <div className="absolute inset-0 min-h-[280px] w-full">
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={[1, 1.25]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'default',
          stencil: false,
          depth: true,
        }}
      >
        <PerspectiveCamera makeDefault fov={36} near={0.1} far={100} />
        <HeroSceneCamera />

        <hemisphereLight intensity={0.55} color="#f8fafc" groundColor="#94a3b8" />
        <directionalLight position={[5, 10, 7]} intensity={1.1} />
        <directionalLight position={[-4, 3, -3]} intensity={0.2} />

        <Suspense fallback={null}>
          <MovingCargo color={accentColor} active={active} />
        </Suspense>
      </Canvas>
    </div>
  );
}

const MemoHeroCargoCanvas = memo(HeroCargoCanvas);

// --- MAIN SECTION COMPONENT ---

export function HeroSection({ hero, page, className }: { hero?: Page['hero'], page?: Page | null, className?: string }) {
  const { site, pages } = useWebBuilder();
  const { colors, fonts } = useSectionTheme();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const title1Ref = useRef<HTMLSpanElement>(null);
  const title2Ref = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const heroVisible = useIntersectionObserver(
    containerRef as React.RefObject<Element>,
    {
    rootMargin: '120px 0px',
    threshold: 0.08,
    }
  );
  const [cargoMounted, setCargoMounted] = useState(false);

  useEffect(() => {
    if (heroVisible) setCargoMounted(true);
  }, [heroVisible]);

  const pageWithHero = useMemo(() => (page ? { ...page, hero: hero ?? page.hero } : null), [page, hero]);

  // Content Parsing
  const titleLines = useMemo(() => {
    const parsed = parseEditorialHeroLines(hero?.title);
    if (parsed.length >= 2) return parsed.slice(0, 2);
    const fallback = getHeroTitleText(hero, site).split(' ');
    return [
      { segments: [{ kind: 'script' as const, text: fallback.slice(0, Math.ceil(fallback.length/2)).join(' ') }] },
      { segments: [{ kind: 'sans' as const, text: fallback.slice(Math.ceil(fallback.length/2)).join(' ') }] }
    ];
  }, [hero, site]);

  const descriptionLines = useMemo(() => tiptapToLines(hero?.description, 4), [hero?.description]);
  const subtitleText = useMemo(() => tiptapToText(hero?.subtitle), [hero?.subtitle]);

  const primaryCta = useMemo(() => {
    return resolvePrimaryCta(pageWithHero, site, pages) ?? { label: 'Start Moving', href: '#contact' };
  }, [pageWithHero, site, pages]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from([title1Ref.current, title2Ref.current], {
        opacity: 0,
        y: 30,
        duration: 1.2,
        stagger: 0.2,
        ease: 'power4.out',
      });
    }, containerRef);
    return () => ctx.revert();
  }, [titleLines]);

  if (hero?.enabled === false) return null;

  return (
    <section
      ref={containerRef}
      className={cn(
        'relative overflow-x-hidden pt-0 pb-10 md:pb-14 lg:min-h-[calc(100dvh-4.75rem)] lg:flex lg:items-center',
        className
      )}
      style={{ backgroundColor: colors.pageBackground, fontFamily: fonts.body }}
    >
      <div className="absolute inset-0 z-0 pointer-events-none">
        <HeroAmbientParticles active={heroVisible} />
      </div>

      <div className="container relative z-10 mx-auto w-full max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          {/* Left: 3D cargo */}
          <div
            ref={canvasRef}
            className="relative order-1 flex min-h-[340px] w-full items-center justify-center sm:min-h-[400px] lg:order-1 lg:min-h-[480px] lg:h-[min(70vh,560px)] cursor-grab active:cursor-grabbing"
          >
            {cargoMounted ? (
              <MemoHeroCargoCanvas
                accentColor={colors.primaryButton}
                active={heroVisible}
              />
            ) : null}
          </div>

          {/* Right: content */}
          <div className="order-2 flex flex-col items-start text-left lg:order-2 lg:py-8">
            <h1
              className="w-full text-[clamp(2rem,4.5vw,3.75rem)] leading-[1.08] font-bold tracking-tight"
              style={{ fontFamily: fonts.heading }}
            >
              <span ref={title1Ref} className="block mb-2">
                {renderTitleLine(titleLines[0], 'primary', colors)}
              </span>
              {titleLines[1] && (
                <span ref={title2Ref} className="block relative pb-4">
                  {renderTitleLine(titleLines[1], 'secondary', colors)}
                  <div
                    className="absolute bottom-0 left-0 h-1 w-28 rounded-full md:w-32"
                    style={{ backgroundColor: colors.primaryButton }}
                  />
                </span>
              )}
            </h1>

            {subtitleText && (
              <div
                className="mt-5 text-sm font-bold uppercase tracking-[0.2em]"
                style={{ color: colors.primaryButton }}
              >
                {subtitleText}
              </div>
            )}

            {descriptionLines.length > 0 && (
              <div
                className="mt-4 max-w-xl text-base leading-relaxed opacity-80 md:text-lg"
                style={{ color: colors.mainText }}
              >
                {descriptionLines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}

            <div className="mt-8">
              <Link
                href={primaryCta.href}
                className="group inline-flex items-center gap-3 rounded-full px-10 py-5 font-bold shadow-2xl shadow-black/20 transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: colors.primaryButton, color: '#fff' }}
              >
                <span>{primaryCta.label}</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Helper for rendering line segments
function renderTitleLine(line: any, variant: string, colors: ThemeColors) {
  return line?.segments.map((seg: any, i: number) => (
    <span key={i} className={cn(seg.kind === 'script' && 'italic')} style={{ 
      color: seg.kind === 'script' ? colors.primaryButton : colors.mainText 
    }}>
      {seg.text}
    </span>
  ));
}

export default HeroSection;