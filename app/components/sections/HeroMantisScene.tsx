'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows } from '@react-three/drei';
import { Suspense, useRef, useMemo, useState, type CSSProperties } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

function LightParticles({ hovered }: { hovered: boolean }) {
  const points = useRef<THREE.Points>(null);
  const particleCount = 30; // Reduced from 60 for better performance
  const positions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 4; // Reduced spread
      arr[i * 3 + 1] = (Math.random() - 0.5) * 4;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (points.current) {
      const time = state.clock.elapsedTime;
      // Simplified animation
      const speed = hovered ? 4 : 0.5;
      points.current.rotation.y += 0.001 * speed;
      points.current.position.y = Math.sin(time * 0.3) * 0.05; // Reduced movement
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#ADFF2F"
        transparent
        opacity={hovered ? 0.6 : 0.2}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function MantisMascot() {
  const meshRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);
  const bodyGroupRef = useRef<THREE.Group>(null);
  const leftAntennaRef = useRef<THREE.Group>(null);
  const rightAntennaRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const eyesRef = useRef<THREE.Group>(null);

  const [isHovered, setIsHovered] = useState(false);
  const hovered = useRef(false);
  const wingSpread = useRef(0.1);
  const animationParams = useRef({
    swaySpeed: 2,
    swayAmount: 0.05,
    flapSpeed: 4,
    flapStrength: 0.03,
    followIntensity: 0.1,
    zoom: 0,
  });

  useFrame((state) => {
    const { camera, mouse, clock } = state;
    const time = clock.elapsedTime;

    // Interpolate animation parameters for smooth state transitions
    const targetParams = hovered.current ? {
      swaySpeed: 14,
      swayAmount: 0.3,
      flapSpeed: 40,
      flapStrength: 0.25,
      followIntensity: 0.3,
      zoom: 1.5,
    } : {
      swaySpeed: 2,
      swayAmount: 0.06,
      flapSpeed: 4,
      flapStrength: 0.03,
      followIntensity: 0.1,
      zoom: 0,
    };

    const lerpSpeed = hovered.current ? 0.08 : 0.04;
    animationParams.current.swaySpeed = THREE.MathUtils.lerp(animationParams.current.swaySpeed, targetParams.swaySpeed, lerpSpeed);
    animationParams.current.swayAmount = THREE.MathUtils.lerp(animationParams.current.swayAmount, targetParams.swayAmount, lerpSpeed);
    animationParams.current.flapSpeed = THREE.MathUtils.lerp(animationParams.current.flapSpeed, targetParams.flapSpeed, lerpSpeed);
    animationParams.current.flapStrength = THREE.MathUtils.lerp(animationParams.current.flapStrength, targetParams.flapStrength, lerpSpeed);
    animationParams.current.followIntensity = THREE.MathUtils.lerp(animationParams.current.followIntensity, targetParams.followIntensity, lerpSpeed);
    animationParams.current.zoom = THREE.MathUtils.lerp(animationParams.current.zoom, targetParams.zoom, 0.05);

    // Camera Zoom Effect (subtle only â€” do not push mantis off screen)
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 6 - animationParams.current.zoom * 0.3, 0.05);

    if (meshRef.current) {
      // Gentle floating position
      const floatY = Math.sin(time * 0.8) * 0.2;
      meshRef.current.position.y = floatY;

      // Smoothly follow mouse with the body
      const targetRotX = -mouse.y * 0.15;
      const targetRotY = mouse.x * 0.25 + (Math.sin(time * 0.4) * 0.05);
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotX, 0.08);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotY, 0.08);

      // Subtle "breathing" scale
      const breath = 1 + Math.sin(time * 1.5) * 0.015;
      const baseScale = 1.55;
      meshRef.current.scale.set(baseScale * breath, baseScale * breath, baseScale * breath);
    }

    // Expressive head movement
    if (headRef.current) {
      const followX = mouse.y * 0.2 * animationParams.current.followIntensity;
      const followY = mouse.x * 0.3 * animationParams.current.followIntensity;

      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, Math.sin(time * 1.2) * 0.05 + followX, 0.1);
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, followY, 0.1);
      headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, Math.sin(time * 1.5) * 0.04, 0.1);
    }

    // Antennae "physics" bounce
    if (leftAntennaRef.current && rightAntennaRef.current) {
      const bounce = Math.sin(time * 4) * 0.05;
      const hoverBounce = hovered.current ? Math.sin(time * 15) * 0.1 : 0;
      leftAntennaRef.current.rotation.x = -0.2 + bounce + hoverBounce;
      rightAntennaRef.current.rotation.x = -0.2 + bounce + hoverBounce;
    }

    // Interactive Eyes
    if (eyesRef.current) {
      const eyeScaleY = hovered.current ? 0.8 : 1;
      eyesRef.current.scale.y = THREE.MathUtils.lerp(eyesRef.current.scale.y, eyeScaleY, 0.1);
    }

    // Dynamic arm swaying/cheering
    if (leftArmRef.current && rightArmRef.current) {
      const { swaySpeed, swayAmount } = animationParams.current;
      const lift = hovered.current ? 0.4 : 0;
      leftArmRef.current.rotation.z = -0.5 - lift + Math.sin(time * swaySpeed) * swayAmount;
      rightArmRef.current.rotation.z = 0.5 + lift - Math.sin(time * swaySpeed) * swayAmount;

      leftArmRef.current.rotation.x = Math.sin(time * 2) * 0.05;
      rightArmRef.current.rotation.x = Math.sin(time * 2) * 0.05;
    }

    // Simplified wing motion
    if (leftWingRef.current && rightWingRef.current) {
      const { flapSpeed, flapStrength } = animationParams.current;
      
      // Reduced animation complexity
      leftWingRef.current.rotation.z = wingSpread.current + Math.sin(time * flapSpeed * 0.5) * flapStrength * 0.7;
      rightWingRef.current.rotation.z = -wingSpread.current - Math.sin(time * flapSpeed * 0.5) * flapStrength * 0.7;

      const targetWingY = hovered.current ? 0.5 + Math.sin(time * 6) * 0.05 : 0;
      leftWingRef.current.rotation.y = THREE.MathUtils.lerp(leftWingRef.current.rotation.y, targetWingY, 0.05);
      rightWingRef.current.rotation.y = THREE.MathUtils.lerp(rightWingRef.current.rotation.y, -targetWingY, 0.05);
    }

    // Simplified glow
    if (glowRef.current) {
      glowRef.current.position.z = 1.5 + Math.sin(time * 1) * 0.1;
    }
  });

  
  const handleHover = (isHovering: boolean) => {
    hovered.current = isHovering;
    setIsHovered(isHovering);

    if (isHovering) {
      gsap.to(bodyGroupRef.current!.rotation, { x: -0.2, duration: 0.4, ease: "power2.out" });
      gsap.to(wingSpread, { current: Math.PI / 3, duration: 0.5, ease: "power2.out" });
      gsap.to([leftWingRef.current!.scale, rightWingRef.current!.scale], {
        x: 1.2, y: 1.2, z: 1.2,
        duration: 0.5,
        ease: "power2.out"
      });
      gsap.to(meshRef.current!.position, { z: 0.3, duration: 0.5, ease: "power2.out" });
      gsap.to(glowRef.current, { intensity: 8, duration: 0.3 });
    } else {
      gsap.to(bodyGroupRef.current!.rotation, { x: 0, duration: 0.4, ease: "power2.inOut" });
      gsap.to(wingSpread, { current: 0.1, duration: 0.4, ease: "power2.inOut" });
      gsap.to([leftWingRef.current!.scale, rightWingRef.current!.scale], {
        x: 1, y: 1, z: 1,
        duration: 0.4,
        ease: "power2.inOut"
      });
      gsap.to(meshRef.current!.position, { z: 0, duration: 0.4, ease: "power2.inOut" });
      gsap.to(glowRef.current, { intensity: 0, duration: 0.3 });
    }
  };

  return (
    <Float speed={0.8} rotationIntensity={0.2} floatIntensity={0.3}>
      <group
        ref={meshRef}
        onPointerOver={() => handleHover(true)}
        onPointerOut={() => handleHover(false)}
      >
        <LightParticles hovered={isHovered} />
        <pointLight ref={glowRef} intensity={0} distance={6} color="#ADFF2F" position={[0, 0, 1.5]} />

        <group ref={bodyGroupRef}>
          {/* Adorable Chubby Body */}
          <group position={[0, -0.2, 0]}>
            <mesh scale={[1, 1.2, 0.9]}>
              <sphereGeometry args={[0.5, 32, 32]} />
              <meshStandardMaterial color="#32CD32" roughness={0.3} metalness={0.1} />
            </mesh>
            <mesh position={[0, 0.6, 0]} scale={[0.8, 1, 0.7]}>
              <sphereGeometry args={[0.45, 32, 32]} />
              <meshStandardMaterial color="#32CD32" roughness={0.3} />
            </mesh>
          </group>

          {/* Friendly Head */}
          <group ref={headRef} position={[0, 0.9, 0.1]}>
            <mesh scale={[1.15, 0.95, 1]}>
              <sphereGeometry args={[0.35, 32, 32]} />
              <meshStandardMaterial color="#32CD32" />
            </mesh>
            {/* Big Expressive Eyes */}
            <group ref={eyesRef} position={[0, 0, 0]}>
              <mesh position={[0.22, 0.05, 0.2]} scale={[1, 1.2, 1]}>
                <sphereGeometry args={[0.14, 16, 16]} />
                <meshStandardMaterial color="#3C2A21" roughness={0.05} />
              </mesh>
              <mesh position={[-0.22, 0.05, 0.2]} scale={[1, 1.2, 1]}>
                <sphereGeometry args={[0.14, 16, 16]} />
                <meshStandardMaterial color="#3C2A21" roughness={0.05} />
              </mesh>
              {/* Pink Cheek Dots */}
              <mesh position={[0.28, -0.1, 0.25]}>
                <sphereGeometry args={[0.04, 16, 16]} />
                <meshStandardMaterial color="#FF69B4" transparent opacity={0.8} />
              </mesh>
              <mesh position={[-0.28, -0.1, 0.25]}>
                <sphereGeometry args={[0.04, 16, 16]} />
                <meshStandardMaterial color="#FF69B4" transparent opacity={0.8} />
              </mesh>
            </group>
            {/* Smile */}
            <mesh position={[0, -0.15, 0.3]} rotation={[Math.PI / 1.8, 0, 0]}>
              <torusGeometry args={[0.08, 0.015, 16, 32, Math.PI]} />
              <meshStandardMaterial color="#164332" />
            </mesh>
            {/* Antennae with secondary motion pivots */}
            <group position={[0, 0.35, -0.1]} rotation={[-0.2, 0, 0]}>
              <group ref={leftAntennaRef} position={[0.12, 0, 0]}>
                <mesh position={[0, 0.2, 0]}>
                  <cylinderGeometry args={[0.012, 0.008, 0.4]} />
                  <meshStandardMaterial color="#32CD32" />
                </mesh>
              </group>
              <group ref={rightAntennaRef} position={[-0.12, 0, 0]}>
                <mesh position={[0, 0.2, 0]}>
                  <cylinderGeometry args={[0.012, 0.008, 0.4]} />
                  <meshStandardMaterial color="#32CD32" />
                </mesh>
              </group>
            </group>
          </group>

          {/* Arms with Refined Hook Shape */}
          <group position={[0, 0.5, 0.15]}>
            <group ref={leftArmRef} position={[0.35, 0.1, 0]}>
              <mesh position={[0.1, 0.2, 0]} rotation={[0, 0, -0.6]}>
                <capsuleGeometry args={[0.07, 0.3, 4, 16]} />
                <meshStandardMaterial color="#32CD32" />
              </mesh>
              <mesh position={[0.35, 0.5, 0]} rotation={[0, 0, 0.5]}>
                <capsuleGeometry args={[0.06, 0.35, 4, 16]} />
                <meshStandardMaterial color="#32CD32" />
              </mesh>
            </group>
            <group ref={rightArmRef} position={[-0.35, 0.1, 0]}>
              <mesh position={[-0.1, 0.2, 0]} rotation={[0, 0, 0.6]}>
                <capsuleGeometry args={[0.07, 0.3, 4, 16]} />
                <meshStandardMaterial color="#32CD32" />
              </mesh>
              <mesh position={[-0.35, 0.5, 0]} rotation={[0, 0, -0.5]}>
                <capsuleGeometry args={[0.06, 0.35, 4, 16]} />
                <meshStandardMaterial color="#32CD32" />
              </mesh>
            </group>
          </group>

          {/* Chubby Legs */}
          {[0.5, -0.5].map((side, i) => (
            <group key={i} position={[side * 0.4, -0.3, 0]}>
              <mesh position={[side * 0.2, -0.3, 0]} rotation={[0, 0, side * 0.4]}>
                <capsuleGeometry args={[0.05, 0.6, 4, 16]} />
                <meshStandardMaterial color="#32CD32" />
              </mesh>
              <mesh position={[side * 0.45, -0.8, side * 0.05]} rotation={[0, 0, -side * 0.1]}>
                <capsuleGeometry args={[0.04, 0.7, 4, 16]} />
                <meshStandardMaterial color="#32CD32" />
              </mesh>
            </group>
          ))}

          {/* Wings with Specific Eye-Spot Pattern */}
          <group position={[0, 0.4, -0.25]}>
            <group ref={leftWingRef} scale={isHovered ? [1.4, 1.4, 1.4] : [0.8, 0.8, 0.8]} position={[0.05, 0, 0]}>
              <mesh position={[0.45, -0.5, 0]} rotation={[0, 0, -0.2]} scale={[1, 0.5, 0.05]}>
                <sphereGeometry args={[0.8, 32, 32]} />
                <meshStandardMaterial color="#32CD32" transparent opacity={0.3} />
              </mesh>
              <mesh position={[0.4, -0.5, 0.01]} rotation={[0, 0, -0.15]} scale={[1, 0.4, 1]}>
                <sphereGeometry args={[0.6, 32, 32]} />
                <meshStandardMaterial color="#FFB6C1" transparent opacity={0.5} />
              </mesh>
              <mesh position={[0.6, -0.45, 0.02]} scale={[1, 1, 0.1]}>
                <circleGeometry args={[0.08]} />
                <meshStandardMaterial color="#3C2A21" />
              </mesh>
            </group>

            <group ref={rightWingRef} scale={isHovered ? [1.4, 1.4, 1.4] : [0.8, 0.8, 0.8]} position={[-0.05, 0, 0]}>
              <mesh position={[-0.45, -0.5, 0]} rotation={[0, 0, 0.2]} scale={[1, 0.5, 0.05]}>
                <sphereGeometry args={[0.8, 32, 32]} />
                <meshStandardMaterial color="#32CD32" transparent opacity={0.3} />
              </mesh>
              <mesh position={[-0.4, -0.5, 0.01]} rotation={[0, 0, 0.15]} scale={[1, 0.4, 1]}>
                <sphereGeometry args={[0.6, 32, 32]} />
                <meshStandardMaterial color="#FFB6C1" transparent opacity={0.5} />
              </mesh>
              <mesh position={[-0.6, -0.45, 0.02]} scale={[1, 1, 0.1]}>
                <circleGeometry args={[0.08]} />
                <meshStandardMaterial color="#3C2A21" />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </Float>
  );
}

function Particles({ active }: { active: boolean }) {
  const points = useRef<THREE.Points>(null);
  const particleCount = 180;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }

  useFrame((state) => {
    if (!active || !points.current) return;
    points.current.rotation.y = state.clock.elapsedTime * 0.01;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#4CAF50" transparent opacity={0.1} sizeAttenuation />
    </points>
  );
}

function ResponsiveMascot() {
  // Mantis is always centered at origin (0,0,0) in its own dedicated canvas column
  return (
    <group position={[0, -0.3, 0]} rotation={[0, -0.15, 0]}>
      <MantisMascot />
    </group>
  );
}
export function HeroAmbientParticles({ active = true }: { active?: boolean }) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.25]}
      gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <Particles active={active} />
    </Canvas>
  );
}

export function HeroMantisCanvas({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div className={className} style={style}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 6], fov: 50, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
      >
        <ambientLight intensity={0.6} />
        <spotLight
          position={[5, 8, 6]}
          angle={0.2}
          penumbra={1}
          intensity={1.5}
          color="#4CAF50"
          castShadow
        />
        <pointLight position={[-4, -3, -4]} color="#164332" intensity={2.5} />
        <pointLight position={[3, 5, 3]} color="#ADFF2F" intensity={0.8} />
        <ResponsiveMascot />
        <Suspense fallback={null}>
          <Environment preset="forest" />
        </Suspense>
        <ContactShadows position={[0, -2.2, 0]} opacity={0.25} scale={10} blur={2.5} far={3} />
      </Canvas>
    </div>
  );
}
