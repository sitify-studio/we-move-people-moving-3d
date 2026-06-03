'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Page } from '@/app/lib/types';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { getPageHref } from '@/app/lib/siteContent';
import { tiptapToText, tiptapToLines } from '@/app/lib/seo';
import { cn, getImageSrc } from '@/app/lib/utils';
import { TiptapRenderer } from '@/app/components/ui/TiptapRenderer';
import { OptimizedImage, IMAGE_SIZES } from '@/app/components/ui/OptimizedImage';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';

gsap.registerPlugin(ScrollTrigger);

interface AboutSectionProps {
  aboutSection?: Page['aboutSection'];
  page?: Page | null;
  className?: string;
}

type AboutSectionInput = NonNullable<Page['aboutSection']> & {
  heading?: unknown;
  subtitle?: unknown;
  primaryButton?: { label?: string; href?: string };
};

function pickSectionField(
  section: AboutSectionInput | undefined,
  primary: 'title' | 'description'
): unknown {
  if (!section) return undefined;
  const alt = primary === 'title' ? section.heading : section.subtitle;
  const value = section[primary] ?? alt;
  if (value == null || value === '') return undefined;
  return value;
}

function normalizeHref(href: string): string {
  const t = href.trim();
  if (t.startsWith('http') || t.startsWith('mailto:') || t.startsWith('tel:')) return t;
  return t.startsWith('/') ? t : `/${t}`;
}

const CARGO_BOX = {
  front: '#B88A5D',
  top: '#C9A06E',
  side: '#9A7348',
  lid: '#A67C52',
  tape: '#C4A574',
  shadow: 'rgba(74, 55, 35, 0.2)',
};

function CargoBoxShape({
  className,
  width = 140,
  height = 100,
  rotate = 0,
  flip = false,
  showStackedLid = true,
}: {
  className?: string;
  width?: number;
  height?: number;
  rotate?: number;
  flip?: boolean;
  showStackedLid?: boolean;
}) {
  const sideW = Math.round(width * 0.22);

  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute select-none', className)}
      style={{
        width,
        height: height + 28,
        transform: `rotate(${rotate}deg) scaleX(${flip ? -1 : 1})`,
      }}
    >
      <div
        className="absolute bottom-1 left-[6%] h-5 w-[88%] rounded-[50%] blur-lg opacity-70"
        style={{ backgroundColor: CARGO_BOX.shadow }}
      />

      <div className="relative" style={{ width, height: height + 20 }}>
        {showStackedLid ? (
          <div
            className="absolute left-[-4%] z-20"
            style={{
              width: width * 0.92,
              height: height * 0.22,
              background: `linear-gradient(180deg, ${CARGO_BOX.top} 0%, ${CARGO_BOX.lid} 100%)`,
              borderRadius: '4px 4px 0 0',
              transform: 'skewX(-3deg)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div
              className="absolute bottom-0 left-[4%] h-[45%] w-[92%]"
              style={{
                backgroundColor: CARGO_BOX.lid,
                borderRadius: '0 0 8px 8px',
              }}
            />
          </div>
        ) : null}

        <div
          className="absolute left-0"
          style={{
            top: showStackedLid ? height * 0.18 : 8,
            width,
            height,
          }}
        >
          {/* Side panel */}
          <div
            className="absolute right-0 top-[8%] z-10 h-[84%]"
            style={{
              width: sideW,
              background: `linear-gradient(90deg, ${CARGO_BOX.side} 0%, ${CARGO_BOX.front} 100%)`,
              borderRadius: '0 3px 6px 0',
              transform: 'skewY(4deg)',
            }}
          />

          {/* Front panel */}
          <div
            className="absolute left-0 top-[8%] z-[15] h-[84%] overflow-hidden"
            style={{
              width: width - sideW + 4,
              backgroundColor: CARGO_BOX.front,
              borderRadius: 3,
              boxShadow: 'inset -10px 0 16px rgba(0,0,0,0.07)',
            }}
          >
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, transparent 0, transparent 5px, rgba(0,0,0,0.035) 5px, rgba(0,0,0,0.035) 6px)',
              }}
            />
            {/* Handle cutout */}
            <div
              className="absolute left-1/2 top-[40%] z-20 h-[11%] w-[38%] -translate-x-1/2 rounded-[50%]"
              style={{
                backgroundColor: 'rgba(55, 38, 22, 0.22)',
                boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.2)',
                border: '1px solid rgba(60, 40, 20, 0.2)',
              }}
            />
            {/* Packing tape strip */}
            <div
              className="absolute left-0 top-[18%] z-10 h-[9%] w-full opacity-90"
              style={{ backgroundColor: CARGO_BOX.tape }}
            />
          </div>

          {/* Top face (visible edge) */}
          <div
            className="absolute left-0 top-0 z-[12] h-[12%]"
            style={{
              width: width - sideW,
              background: `linear-gradient(180deg, ${CARGO_BOX.top}, ${CARGO_BOX.front})`,
              borderRadius: '3px 3px 0 0',
              transform: 'skewX(-5deg)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function CargoBoxesBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <CargoBoxShape
        className="-bottom-10 -left-6 opacity-90 sm:-left-2"
        width={160}
        height={115}
        rotate={-6}
      />
      <CargoBoxShape
        className="bottom-8 left-24 hidden opacity-75 sm:block"
        width={100}
        height={72}
        rotate={8}
        showStackedLid={false}
      />
      <CargoBoxShape
        className="right-[6%] top-[18%] hidden opacity-85 lg:block"
        width={200}
        height={140}
        rotate={12}
        flip
      />
      <CargoBoxShape
        className="right-[14%] top-[42%] hidden opacity-70 lg:block"
        width={130}
        height={95}
        rotate={-8}
      />
      <CargoBoxShape
        className="right-4 top-1/2 opacity-80 lg:hidden"
        width={120}
        height={88}
        rotate={10}
        flip
      />
      <CargoBoxShape
        className="bottom-16 right-8 opacity-60 sm:opacity-75 lg:hidden"
        width={90}
        height={65}
        rotate={-14}
      />
    </div>
  );
}

export function AboutSection({ aboutSection, page: _page, className }: AboutSectionProps) {
  const { pages } = useWebBuilder();
  const { colors, fonts, styles, layout } = useSectionTheme();
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const sectionInput = aboutSection as AboutSectionInput | undefined;
  const titleContent = pickSectionField(sectionInput, 'title');
  const titleText = useMemo(() => tiptapToText(titleContent).trim(), [titleContent]);

  const descriptionLines = useMemo(
    () => tiptapToLines(pickSectionField(sectionInput, 'description'), 6),
    [sectionInput]
  );

  const subtitleText = useMemo(() => {
    const fromField = tiptapToText(sectionInput?.subtitle).trim();
    if (fromField) return fromField;
    if (descriptionLines.length > 1) return descriptionLines[0];
    const firstFeature = aboutSection?.features?.find((f) => f?.label?.trim());
    return firstFeature?.label?.trim() || '';
  }, [sectionInput?.subtitle, descriptionLines, aboutSection?.features]);

  const bodyParagraphs = useMemo(() => {
    if (descriptionLines.length > 1) return descriptionLines.slice(1);
    if (descriptionLines.length === 1) return descriptionLines;
    return [];
  }, [descriptionLines]);

  const descriptionContent = pickSectionField(sectionInput, 'description');

  const imageSrc = useMemo(() => {
    const url = aboutSection?.image?.url;
    return url ? getImageSrc(url) : undefined;
  }, [aboutSection?.image?.url]);

  const imageAlt =
    aboutSection?.image?.altText?.trim() ||
    titleText ||
    'About us';

  const cta = useMemo(() => {
    const btn = sectionInput?.primaryButton;
    if (btn?.label?.trim()) {
      return {
        label: btn.label.trim(),
        href: normalizeHref(btn.href?.trim() || '/about-us'),
      };
    }
    const aboutPage = pages?.find((p) => p.pageType === 'about' && p.status === 'published');
    if (aboutPage) {
      return {
        label: aboutPage.name?.trim() || 'Learn more',
        href: getPageHref(aboutPage),
      };
    }
    return { label: 'Learn more', href: '/about-us' };
  }, [sectionInput, pages]);

  const ctaIsExternal =
    cta.href.startsWith('http') ||
    cta.href.startsWith('mailto:') ||
    cta.href.startsWith('tel:');

  const hasContent =
    Boolean(titleText) ||
    Boolean(subtitleText) ||
    bodyParagraphs.some(Boolean) ||
    Boolean(imageSrc);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(textRef.current?.children || [], {
        opacity: 0,
        x: -32,
        stagger: 0.12,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 78%',
        },
      });

      if (imageRef.current) {
        gsap.from(imageRef.current, {
          opacity: 0,
          x: 32,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: imageRef.current,
            start: 'top 82%',
          },
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [imageSrc]);

  if (aboutSection?.enabled === false) return null;
  if (aboutSection && !hasContent) return null;

  const CtaButton = ctaIsExternal ? (
    <a
      href={cta.href}
      className="inline-flex items-center justify-center rounded-full px-10 py-3.5 text-xs font-bold uppercase tracking-[0.2em] transition-opacity hover:opacity-90 !text-white"
      style={{ backgroundColor: colors.primaryButton, fontFamily: fonts.body }}
    >
      {cta.label}
    </a>
  ) : (
    <Link
      href={cta.href}
      className="inline-flex items-center justify-center rounded-full px-10 py-3.5 text-xs font-bold uppercase tracking-[0.2em] transition-opacity hover:opacity-90 !text-white no-underline"
      style={{ backgroundColor: colors.primaryButton, fontFamily: fonts.body }}
    >
      {cta.label}
    </Link>
  );

  return (
    <section
      ref={containerRef}
      id="about"
      data-scroll-animated="self"
      className={cn('relative overflow-hidden', layout.sectionClass, className)}
      style={{ backgroundColor: colors.pageBackground, fontFamily: fonts.body }}
    >
      <CargoBoxesBackground />

      <div className="container relative z-10 mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
          <div ref={textRef} className="max-w-xl space-y-5">
            {titleText ? (
              <h2
                className={layout.titleClass}
                style={{ ...layout.title, fontFamily: fonts.heading }}
              >
                {titleContent && typeof titleContent === 'object' ? (
                  <TiptapRenderer content={titleContent} as="inline" />
                ) : (
                  titleText
                )}
              </h2>
            ) : null}

            {subtitleText ? (
              <p
                className={layout.descriptionClass}
                style={{ ...layout.description, fontFamily: fonts.body }}
              >
                {subtitleText}
              </p>
            ) : null}

            {bodyParagraphs.length > 0 ? (
              <div className="space-y-4 pt-1">
                {bodyParagraphs.map((paragraph, index) => (
                  <p
                    key={`about-body-${index}`}
                    className={layout.descriptionClass}
                    style={{ ...layout.description, fontFamily: fonts.body }}
                  >
                    {descriptionContent &&
                    typeof descriptionContent === 'object' &&
                    bodyParagraphs.length === 1 ? (
                      <TiptapRenderer content={descriptionContent} as="inline" />
                    ) : (
                      paragraph
                    )}
                  </p>
                ))}
              </div>
            ) : null}

            <div className="pt-4">{CtaButton}</div>
          </div>

          <div className="relative flex items-center justify-center lg:justify-end">
            <div
              ref={imageRef}
              className="relative z-10 w-full max-w-md lg:max-w-lg"
            >
              <div className="relative aspect-[4/3] sm:aspect-[5/4]">
                {imageSrc ? (
                  <OptimizedImage
                    src={imageSrc}
                    alt={imageAlt}
                    fill
                    sizes={IMAGE_SIZES.sectionHalf}
                    className="object-contain object-center"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 rounded-2xl" style={styles.imagePlaceholder} aria-hidden />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
