'use client';

import { ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { useEffect, useMemo, useRef } from 'react';
import type { Page } from '@/app/lib/types';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { getPageHref } from '@/app/lib/siteContent';
import { TiptapRenderer } from '@/app/components/ui/TiptapRenderer';
import { cn } from '@/app/lib/utils';
import { tiptapToText } from '@/app/lib/seo';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import type { ThemeColors } from '@/app/hooks/useTheme';

gsap.registerPlugin(ScrollTrigger);

interface WhyChooseUsSectionProps {
  whyChooseUsSection?: Page['whyChooseUsSection'];
  className?: string;
}

type WhyChooseUsSectionInput = NonNullable<Page['whyChooseUsSection']> & {
  heading?: unknown;
  subtitle?: unknown;
};

type HighlightItem = {
  name: string;
  description: string;
  icon?: string;
  titleContent?: unknown;
  descriptionContent?: unknown;
};

const FALLBACK_ITEMS: HighlightItem[] = [
  {
    name: 'Professional Packing & Safe Transportation',
    description:
      'Every item is packed with industry-grade materials to ensure maximum protection during transit.',
    icon: 'packing',
  },
  {
    name: 'Real-Time Tracking',
    description: 'Monitor your shipment throughout the entire move with live status updates.',
    icon: 'track',
  },
  {
    name: 'Experienced Moving Team',
    description: 'Professionally trained staff handle every move with care and efficiency.',
    icon: 'team',
  },
  {
    name: 'On-Time Delivery',
    description: 'Reliable scheduling and timely transportation you can count on.',
    icon: 'delivery',
  },
];

const CARD_MIN_W = 300;
const CARD_GAP = 24;

function pickSectionField(
  section: WhyChooseUsSectionInput | undefined,
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

function getCategoryLabel(item: HighlightItem, index: number): string {
  if (item.icon) return item.icon.replace(/[-_\s]/g, ' ').toUpperCase();
  const defaults = ['PACKING', 'TRACKING', 'TEAM', 'DELIVERY'];
  return defaults[index % defaults.length];
}

function getCtaLabel(item: HighlightItem): string {
  const key = (item.icon ?? '').toLowerCase();
  const map: Record<string, string> = {
    packing: 'Explore packing',
    track: 'Track your move',
    team: 'Meet our team',
    delivery: 'Schedule delivery',
  };
  if (map[key]) return map[key];
  const short = item.name.split(/\s+/).slice(0, 2).join(' ');
  return short ? `Explore ${short.toLowerCase()}` : 'Learn more';
}

const CARD_TEXT = '#ffffff';

function getCardSurface(index: number, colors: ThemeColors): React.CSSProperties {
  const accent = index % 2 === 0 ? colors.primaryButton : colors.hoverActive;

  return {
    background: `linear-gradient(145deg, color-mix(in srgb, ${accent} 92%, ${colors.mainText}) 0%, color-mix(in srgb, ${accent} 70%, ${colors.mainText}) 100%)`,
  };
}

function FeatureCard({
  item,
  index,
  href,
  external,
  colors,
  fonts,
}: {
  item: HighlightItem;
  index: number;
  href: string;
  external?: boolean;
  colors: ThemeColors;
  fonts: { heading: string; body: string };
}) {
  const category = getCategoryLabel(item, index);
  const ctaLabel = getCtaLabel(item);

  const pillClass =
    'wcu-card-btn mt-auto inline-flex w-fit items-center gap-2 rounded-full border-2 px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-all duration-300';

  const pillStyle = {
    borderColor: CARD_TEXT,
    color: CARD_TEXT,
    backgroundColor: 'transparent',
    fontFamily: fonts.body,
  };

  const button = external ? (
    <a href={href} className={pillClass} style={pillStyle}>
      {ctaLabel}
      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
    </a>
  ) : (
    <Link href={href} className={cn(pillClass, 'no-underline group-hover/btn:!text-[var(--wcu-btn-fg)]')} style={pillStyle}>
      {ctaLabel}
      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
    </Link>
  );

  return (
    <article
      className="wcu-feature-card group/btn relative flex shrink-0 flex-col rounded-[20px] p-7 sm:min-h-[440px] sm:p-8 md:min-h-[480px] md:min-w-[320px] md:p-9"
      style={{
        ...getCardSurface(index, colors),
        minWidth: CARD_MIN_W,
        width: `max(${CARD_MIN_W}px, 28vw)`,
        maxWidth: 380,
        ['--wcu-btn-fg' as string]: colors.primaryButton,
      }}
    >
      <span
        className="inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]"
        style={{
          borderColor: `color-mix(in srgb, ${CARD_TEXT} 35%, transparent)`,
          backgroundColor: `color-mix(in srgb, ${CARD_TEXT} 12%, transparent)`,
          color: CARD_TEXT,
          fontFamily: fonts.body,
        }}
      >
        <span aria-hidden>*</span> {category}
      </span>

      <h3
        className="mt-8 text-2xl font-black uppercase leading-[1.08] tracking-tight sm:text-[1.65rem] md:text-[1.75rem]"
        style={{ color: CARD_TEXT, fontFamily: fonts.heading }}
      >
        {item.titleContent && typeof item.titleContent === 'object' ? (
          <TiptapRenderer content={item.titleContent} as="inline" />
        ) : (
          item.name
        )}
      </h3>

      {item.description ? (
        <p
          className="mt-5 max-w-[28ch] text-sm leading-relaxed sm:text-[0.95rem]"
          style={{ color: CARD_TEXT, fontFamily: fonts.body }}
        >
          {item.descriptionContent && typeof item.descriptionContent === 'object' ? (
            <TiptapRenderer content={item.descriptionContent} as="inline" />
          ) : (
            item.description
          )}
        </p>
      ) : null}

      <div
        className="mt-auto pt-10 [&_a:hover]:!border-[var(--wcu-hover-border)] [&_a:hover]:!bg-[var(--wcu-hover-bg)] [&_a:hover]:!text-[var(--wcu-hover-fg)]"
        style={
          {
            '--wcu-hover-border': CARD_TEXT,
            '--wcu-hover-bg': CARD_TEXT,
            '--wcu-hover-fg': colors.primaryButton,
          } as React.CSSProperties
        }
      >
        {button}
      </div>
    </article>
  );
}

export function WhyChooseUsSection({ whyChooseUsSection, className }: WhyChooseUsSectionProps) {
  const { pages } = useWebBuilder();
  const { colors, fonts, layout } = useSectionTheme();
  const sectionRef = useRef<HTMLElement>(null);
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const sectionInput = whyChooseUsSection as WhyChooseUsSectionInput | undefined;

  const items = useMemo<HighlightItem[]>(() => {
    const fromCms =
      whyChooseUsSection?.items
        ?.map((item) => {
          const record = item as { icon?: string };
          const name = tiptapToText(item.title).trim();
          const description = tiptapToText(item.description).trim();
          return {
            name,
            description,
            icon: typeof record.icon === 'string' ? record.icon : undefined,
            titleContent: item.title,
            descriptionContent: item.description,
          };
        })
        .filter((item) => item.name || item.description) ?? [];

    return fromCms.length > 0 ? fromCms : FALLBACK_ITEMS;
  }, [whyChooseUsSection?.items]);

  const titleText = useMemo(
    () => tiptapToText(pickSectionField(sectionInput, 'title')).trim() || 'Why Choose Us',
    [sectionInput]
  );

  const descriptionText = useMemo(
    () => tiptapToText(pickSectionField(sectionInput, 'description')).trim(),
    [sectionInput]
  );

  const titleContent = pickSectionField(sectionInput, 'title');
  const descriptionContent = pickSectionField(sectionInput, 'description');

  const defaultCtaHref = useMemo(() => {
    const contact = pages?.find((p) => p.pageType === 'contact');
    return contact ? getPageHref(contact) : '/contact-us';
  }, [pages]);

  useEffect(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    const scrollTrack = scrollTrackRef.current;
    const pin = pinRef.current;
    const progress = progressRef.current;

    if (!track || !viewport || !scrollTrack || !pin || items.length === 0) return;

    const getScrollDistance = () =>
      Math.max(0, track.scrollWidth - viewport.clientWidth + CARD_GAP);

    const ctx = gsap.context(() => {
      gsap.set(track, { x: 0 });

      const cards = gsap.utils.toArray<HTMLElement>('.wcu-feature-card', track);
      cards.forEach((card, i) => {
        gsap.set(card, { y: i % 2 === 0 ? 24 : 36, opacity: 0.92 });
      });

      if (items.length < 2 || getScrollDistance() < 40) {
        gsap.to(cards, {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: scrollTrack,
            start: 'top 82%',
          },
        });
        return;
      }

      const tween = gsap.to(track, {
        x: () => -getScrollDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: scrollTrack,
          start: 'top 80px',
          end: () => `+=${getScrollDistance()}`,
          pin,
          scrub: 0.85,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progress) gsap.set(progress, { scaleY: self.progress, transformOrigin: 'top center' });
          },
        },
      });

      cards.forEach((card, i) => {
        gsap.to(card, {
          y: 0,
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: card,
            containerAnimation: tween,
            start: 'left 88%',
            end: 'left 42%',
            scrub: true,
          },
        });

        gsap.fromTo(
          card,
          { scale: 0.97 },
          {
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: card,
              containerAnimation: tween,
              start: 'left 95%',
              end: 'left 55%',
              scrub: true,
            },
          }
        );

        gsap.to(card, {
          y: i % 2 === 0 ? -8 : -4,
          ease: 'none',
          scrollTrigger: {
            trigger: card,
            containerAnimation: tween,
            start: 'left 35%',
            end: 'left 8%',
            scrub: true,
          },
        });
      });
    }, sectionRef);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      ctx.revert();
    };
  }, [items]);

  if (!whyChooseUsSection?.enabled) return null;
  if (items.length === 0 && !titleText && !descriptionText) return null;

  return (
    <section
      ref={sectionRef}
      id="why-choose-us"
      className={cn('relative overflow-hidden', layout.sectionClass, className)}
      style={{ backgroundColor: colors.pageBackground, fontFamily: fonts.body }}
    >
      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="flex gap-5 sm:gap-8">
          {/* Timeline rail */}
          <div
            className="hidden shrink-0 flex-col items-center pt-1 sm:flex"
            style={{ width: 20 }}
            aria-hidden
          >
            <span
              className="text-sm font-light leading-none"
              style={{ color: colors.secondaryText }}
            >
              *
            </span>
            <div
              className="relative my-2 w-px flex-1 min-h-[120px]"
              style={{ backgroundColor: `color-mix(in srgb, ${colors.mainText} 18%, transparent)` }}
            >
              <div
                ref={progressRef}
                className="absolute left-0 top-0 w-full origin-top"
                style={{
                  height: '100%',
                  transform: 'scaleY(0)',
                  transformOrigin: 'top center',
                  backgroundColor: colors.primaryButton,
                }}
              />
            </div>
            <span
              className="text-sm font-light leading-none"
              style={{ color: colors.secondaryText }}
            >
              *
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <header className="mb-6 grid grid-cols-1 items-end gap-4 md:grid-cols-12 md:gap-6">
              <div className="md:col-span-7 lg:col-span-8">
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
              </div>
              {descriptionText ? (
                <div className="md:col-span-5 lg:col-span-4">
                  <p
                    className={layout.descriptionClass}
                    style={{ ...layout.description, fontFamily: fonts.body }}
                  >
                    {descriptionContent && typeof descriptionContent === 'object' ? (
                      <TiptapRenderer content={descriptionContent} as="inline" />
                    ) : (
                      descriptionText
                    )}
                  </p>
                </div>
              ) : null}
            </header>

            <div ref={scrollTrackRef} className="relative">
              <div ref={pinRef}>
                <div ref={viewportRef} className="overflow-hidden">
                  <div
                    ref={trackRef}
                    className="flex w-max items-stretch gap-6 pb-2 pr-6"
                    style={{ gap: CARD_GAP }}
                  >
                    {items.map((item, index) => (
                      <FeatureCard
                        key={`wcu-card-${index}-${item.name}`}
                        item={item}
                        index={index}
                        href={normalizeHref(defaultCtaHref)}
                        colors={colors}
                        fonts={fonts}
                        external={
                          defaultCtaHref.startsWith('http') ||
                          defaultCtaHref.startsWith('mailto:') ||
                          defaultCtaHref.startsWith('tel:')
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhyChooseUsSection;
