'use client';

import { ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { useEffect, useMemo, useRef } from 'react';
import type { Page } from '@/app/lib/types';
import { tiptapToText } from '@/app/lib/seo';
import { cn, getImageSrc, TIPTAP_INHERIT } from '@/app/lib/utils';
import { TiptapRenderer } from '@/app/components/ui/TiptapRenderer';
import { parseEditorialHeroLines } from '@/app/components/sections/EditorialHeroTypography';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import type { ThemeColors } from '@/app/hooks/useTheme';

gsap.registerPlugin(ScrollTrigger);

interface CTASectionProps {
  ctaSection?: Page['ctaSection'] & { subtitle?: unknown };
  className?: string;
}

function normalizeHref(href: string): string {
  const t = href.trim();
  if (t.startsWith('http') || t.startsWith('mailto:') || t.startsWith('tel:')) return t;
  return t.startsWith('/') ? t : `/${t}`;
}

function CtaTitle({ content, colors }: { content: unknown; colors: ThemeColors }) {
  const lines = useMemo(() => parseEditorialHeroLines(content), [content]);
  const line = lines[0];

  if (line?.segments.length) {
    return (
      <>
        {line.segments.map((segment, index) => (
          <span
            key={index}
            className={cn(segment.kind === 'script' && 'italic')}
            style={{
              color: segment.kind === 'script' ? colors.primaryButton : colors.mainText,
            }}
          >
            {segment.text}
          </span>
        ))}
      </>
    );
  }

  const text = tiptapToText(content).trim();
  if (!text) return null;

  const words = text.split(/\s+/);
  if (words.length >= 2) {
    const last = words.pop();
    return (
      <>
        <span style={{ color: colors.mainText }}>{words.join(' ')} </span>
        <span className="italic" style={{ color: colors.primaryButton }}>
          {last}
        </span>
      </>
    );
  }

  return <span style={{ color: colors.mainText }}>{text}</span>;
}

export function CTASection({ ctaSection, className }: CTASectionProps) {
  const { colors, fonts, styles, layout } = useSectionTheme();

  const containerRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLDivElement>(null);

  const eyebrowText = useMemo(
    () => tiptapToText(ctaSection?.subtitle).trim(),
    [ctaSection?.subtitle]
  );

  const titleText = useMemo(() => tiptapToText(ctaSection?.title).trim(), [ctaSection?.title]);

  const descriptionText = useMemo(
    () => tiptapToText(ctaSection?.description).trim(),
    [ctaSection?.description]
  );

  const backgroundImage = useMemo(() => {
    const section = ctaSection as (typeof ctaSection) & {
      image?: { url?: string } | string;
      background?: unknown;
    };
    const raw = section?.backgroundImage ?? section?.image ?? section?.background;
    const url =
      typeof raw === 'string'
        ? raw
        : raw && typeof raw === 'object' && 'url' in raw
          ? (raw as { url?: string }).url
          : undefined;
    return url ? getImageSrc(url) : undefined;
  }, [ctaSection]);

  const sectionBackground = useMemo(() => {
    const fromCms = ctaSection?.backgroundColor?.trim();
    return fromCms || colors.pageBackground;
  }, [ctaSection?.backgroundColor, colors.pageBackground]);

  const primaryButton = useMemo(() => {
    const btn = ctaSection?.primaryButton;
    if (!btn?.label?.trim()) return null;
    return {
      label: btn.label.trim(),
      href: normalizeHref(btn.href?.trim() || '/'),
    };
  }, [ctaSection?.primaryButton]);

  const hasContent =
    Boolean(eyebrowText) ||
    Boolean(titleText) ||
    Boolean(descriptionText) ||
    Boolean(primaryButton?.label);

  useEffect(() => {
    if (!cardRef.current) return;

    const ctx = gsap.context(() => {
      if (bgImageRef.current) {
        gsap.fromTo(
          bgImageRef.current,
          { yPercent: -20, scale: 1.2 },
          {
            yPercent: 20,
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        );
      }

      gsap.from(cardRef.current, {
        opacity: 0,
        scale: 0.95,
        y: 50,
        duration: 1,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 90%',
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [backgroundImage]);

  if (ctaSection?.enabled === false) return null;
  if (ctaSection && !hasContent) return null;

  const titleContent = ctaSection?.title;
  const descriptionContent = ctaSection?.description;
  const subtitleContent = ctaSection?.subtitle;

  const ctaIsExternal =
    primaryButton?.href.startsWith('http') ||
    primaryButton?.href.startsWith('mailto:') ||
    primaryButton?.href.startsWith('tel:');

  return (
    <div className={cn('relative w-full overflow-hidden', className)}>
      <section
        ref={containerRef}
        id="cta"
        data-scroll-animated="self"
        className={cn('relative flex items-center justify-center', layout.sectionClass)}
        style={{ backgroundColor: sectionBackground, fontFamily: fonts.body }}
      >
        {backgroundImage ? (
          <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden>
            <div
              ref={bgImageRef}
              className="absolute inset-0 h-[140%] w-full bg-cover bg-center will-change-transform"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            />
            <div
              className="absolute inset-0 z-10"
              style={{
                background: `linear-gradient(to right, color-mix(in srgb, ${sectionBackground} 92%, transparent) 40%, transparent 100%)`,
              }}
            />
            <div
              className="absolute inset-0 z-10 opacity-60"
              style={{ backgroundColor: sectionBackground }}
            />
          </div>
        ) : null}

        <div className="container relative z-20 mx-auto px-6">
          <div
            ref={cardRef}
            className="group relative max-w-4xl rounded-[40px] border p-8 shadow-2xl backdrop-blur-md md:p-12 lg:p-16"
            style={{
              ...styles.cardSolid,
              backgroundColor: `color-mix(in srgb, ${colors.cardBackground} 80%, transparent)`,
              boxShadow: `0 24px 60px color-mix(in srgb, ${colors.mainText} 8%, transparent)`,
            }}
          >
            <div
              className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-20 blur-2xl"
              style={{ backgroundColor: colors.primaryButton }}
              aria-hidden
            />

            <div className="relative space-y-8">
              <div className="space-y-4">
                {eyebrowText ? (
                  <div className="flex items-center gap-3">
                    <div className="h-[2px] w-12" style={styles.dividerGradient} />
                    <span
                      className={layout.eyebrowClass}
                      style={{ ...layout.eyebrow, fontFamily: fonts.body }}
                    >
                      {subtitleContent && typeof subtitleContent === 'object' ? (
                        <TiptapRenderer content={subtitleContent} as="inline" className={TIPTAP_INHERIT} />
                      ) : (
                        eyebrowText
                      )}
                    </span>
                  </div>
                ) : null}

                {titleText ? (
                  <h2
                    className="text-4xl font-black leading-[1] tracking-tight sm:text-5xl md:text-6xl"
                    style={{ fontFamily: fonts.heading, color: colors.mainText }}
                  >
                    {titleContent && typeof titleContent === 'object' ? (
                      <TiptapRenderer content={titleContent} as="inline" className={TIPTAP_INHERIT} />
                    ) : (
                      <CtaTitle content={titleContent} colors={colors} />
                    )}
                  </h2>
                ) : null}

                {descriptionText ? (
                  <p
                    className={cn(layout.descriptionClass, 'max-w-xl')}
                    style={{ ...layout.description, fontFamily: fonts.body }}
                  >
                    {descriptionContent && typeof descriptionContent === 'object' ? (
                      <TiptapRenderer content={descriptionContent} as="inline" className={TIPTAP_INHERIT} />
                    ) : (
                      descriptionText
                    )}
                  </p>
                ) : null}
              </div>

              {primaryButton ? (
                <div className="pt-2">
                  {ctaIsExternal ? (
                    <a
                      href={primaryButton.href}
                      className="group inline-flex items-center gap-4 rounded-full px-10 py-5 text-lg font-black transition-all hover:scale-105 active:scale-95"
                      style={{ ...styles.primaryCta, fontFamily: fonts.body }}
                    >
                      {primaryButton.label}
                      <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" aria-hidden />
                    </a>
                  ) : (
                    <Link
                      href={primaryButton.href}
                      className="group inline-flex items-center gap-4 rounded-full px-10 py-5 text-lg font-black no-underline transition-all hover:scale-105 active:scale-95"
                      style={{ ...styles.primaryCta, fontFamily: fonts.body }}
                    >
                      {primaryButton.label}
                      <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" aria-hidden />
                    </Link>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CTASection;
