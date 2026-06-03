'use client';

import { Star } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import type { Page } from '@/app/lib/types';
import { tiptapToText } from '@/app/lib/seo';
import { cn, getImageSrc } from '@/app/lib/utils';
import { TiptapRenderer } from '@/app/components/ui/TiptapRenderer';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import type { ThemeColors } from '@/app/hooks/useTheme';

gsap.registerPlugin(ScrollTrigger);

interface TestimonialsSectionProps {
  testimonialsSection?: Page['testimonialsSection'];
  className?: string;
}

type DisplayTestimonial = {
  name: string;
  role: string;
  content: string;
  rating?: number;
  avatar?: string;
  dateLabel?: string;
};

function formatRole(role?: string, company?: string): string {
  const r = role?.trim() ?? '';
  const c = company?.trim() ?? '';
  if (r && c) return `${r}, ${c}`;
  return r || c;
}

function formatDateLabel(raw: unknown): string | undefined {
  if (raw == null || raw === '') return undefined;
  const text = String(raw).trim();
  if (!text) return undefined;
  const parsed = Date.parse(text);
  if (Number.isNaN(parsed)) return text;
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(parsed));
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function normalizeTestimonialItem(item: Record<string, unknown>): DisplayTestimonial | null {
  const content = tiptapToText(
    item.text ?? item.content ?? item.quote ?? item.message ?? item.body
  ).trim();
  const name =
    (typeof item.name === 'string' ? item.name : '')?.trim() ||
    (typeof item.author === 'string' ? item.author : '')?.trim() ||
    '';
  const role = formatRole(
    typeof item.role === 'string' ? item.role : undefined,
    typeof item.company === 'string' ? item.company : undefined
  );
  const rating =
    typeof item.rating === 'number' && !Number.isNaN(item.rating) ? item.rating : undefined;
  const avatar =
    typeof item.avatar === 'string' && item.avatar.trim() ? item.avatar.trim() : undefined;
  const dateLabel = formatDateLabel(
    item.date ?? item.reviewDate ?? item.publishedAt ?? item.createdAt
  );

  if (!content) return null;
  return { name, role, content, rating, avatar, dateLabel };
}

function getWrappedOffset(itemIndex: number, activeIndex: number, count: number): number {
  if (count < 1) return 0;
  let diff = itemIndex - activeIndex;
  if (diff > count / 2) diff -= count;
  if (diff < -count / 2) diff += count;
  return diff;
}

function testimonialKey(item: DisplayTestimonial, index: number): string {
  return `${index}-${item.name}-${item.content.slice(0, 24)}`;
}

function splitDropCap(text: string): { letter: string; rest: string } {
  const trimmed = text.trim();
  if (!trimmed) return { letter: '', rest: '' };
  const letter = trimmed.charAt(0);
  const rest = trimmed.slice(1).trimStart();
  return { letter, rest };
}

function ReviewerAvatar({
  item,
  active,
  colors,
}: {
  item: DisplayTestimonial;
  active: boolean;
  colors: ThemeColors;
}) {
  const size = active ? 72 : 52;

  if (item.avatar) {
    return (
      <img
        src={getImageSrc(item.avatar)}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{
          width: size,
          height: size,
          boxShadow: active
            ? `0 12px 28px color-mix(in srgb, ${colors.mainText} 18%, transparent)`
            : 'none',
        }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full font-bold uppercase"
      style={{
        width: size,
        height: size,
        fontSize: active ? '1.1rem' : '0.85rem',
        color: colors.pageBackground,
        background: `linear-gradient(135deg, ${colors.primaryButton}, ${colors.hoverActive})`,
        boxShadow: active
          ? `0 12px 28px color-mix(in srgb, ${colors.primaryButton} 35%, transparent)`
          : 'none',
      }}
      aria-hidden
    >
      {getInitials(item.name || '?')}
    </div>
  );
}

function ArcReviewerItem({
  item,
  offset,
  active,
  onSelect,
  colors,
  fonts,
}: {
  item: DisplayTestimonial;
  offset: number;
  active: boolean;
  onSelect: () => void;
  colors: ThemeColors;
  fonts: { heading: string; body: string };
}) {
  const slot =
    offset === -1
      ? { top: '5%', left: '4%' }
      : offset === 0
        ? { top: '38%', left: '24%' }
        : offset === 1
          ? { top: '71%', left: '4%' }
          : null;

  if (!slot) return null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'tst-arc-item absolute z-10 flex w-full max-w-[240px] items-center gap-4 text-left transition-all duration-300',
        active ? 'opacity-100' : 'opacity-40 hover:opacity-70'
      )}
      style={slot}
      aria-current={active ? 'true' : undefined}
    >
      <div className="shrink-0">
        <ReviewerAvatar item={item} active={active} colors={colors} />
      </div>
      <div className="min-w-0 pr-4">
        {item.name ? (
          <p
            className={cn('truncate font-bold leading-tight', active ? 'text-base' : 'text-sm')}
            style={{ color: colors.mainText, fontFamily: fonts.heading }}
          >
            {item.name}
          </p>
        ) : null}
        {(item.rating != null || item.dateLabel) ? (
          <div
            className="mt-1 flex flex-wrap items-center gap-1.5 text-xs"
            style={{ color: colors.secondaryText, fontFamily: fonts.body }}
          >
            {item.rating != null ? (
              <div className="flex items-center gap-1">
                <Star
                  className="h-3 w-3 shrink-0"
                  style={{ color: colors.primaryButton, fill: colors.primaryButton }}
                  aria-hidden
                />
                <span className="font-semibold" style={{ color: colors.mainText }}>
                  {item.rating.toFixed(1)}
                </span>
              </div>
            ) : null}
            {item.dateLabel ? (
              <span className="opacity-70">
                {item.dateLabel}
              </span>
            ) : null}
          </div>
        ) : item.role ? (
          <p className="mt-0.5 truncate text-[11px] uppercase tracking-wider opacity-70" style={{ color: colors.secondaryText }}>
            {item.role}
          </p>
        ) : null}
      </div>
    </button>
  );
}

export function TestimonialsSection({
  testimonialsSection,
  className,
}: TestimonialsSectionProps) {
  const { colors, fonts, layout } = useSectionTheme();
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);

  const sectionTitle = useMemo(
    () => tiptapToText(testimonialsSection?.title).trim(),
    [testimonialsSection?.title]
  );

  const sectionDescription = useMemo(
    () => tiptapToText(testimonialsSection?.description).trim(),
    [testimonialsSection?.description]
  );

  const displayTestimonials = useMemo((): DisplayTestimonial[] => {
    return (
      testimonialsSection?.testimonials
        ?.map((item) => normalizeTestimonialItem(item as Record<string, unknown>))
        .filter((item): item is DisplayTestimonial => Boolean(item)) ?? []
    );
  }, [testimonialsSection?.testimonials]);

  const active = displayTestimonials[index] ?? displayTestimonials[0];
  const count = displayTestimonials.length;
  const dropCap = useMemo(() => (active ? splitDropCap(active.content) : { letter: '', rest: '' }), [active]);

  const goTo = useCallback((nextIndex: number) => {
    if (count < 1) return;
    setIndex(((nextIndex % count) + count) % count);
  }, [count]);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (!quoteRef.current) return;
    gsap.fromTo(
      quoteRef.current,
      { opacity: 0, x: 20 },
      { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' }
    );
  }, [index]);

  if (testimonialsSection?.enabled === false || count === 0 || !active) return null;

  const arcStroke = `color-mix(in srgb, ${colors.mainText} 10%, transparent)`;

  return (
    <section
      ref={containerRef}
      id="testimonials"
      className={cn('overflow-hidden', layout.sectionClass, className)}
      style={{ backgroundColor: colors.pageBackground, fontFamily: fonts.body }}
    >
      <div className="container mx-auto max-w-6xl px-6">
        {sectionTitle || sectionDescription ? (
          <header data-scroll-reveal className={layout.headerCenterClass}>
            {sectionTitle ? (
              <h2
                className={layout.titleClass}
                style={{ ...layout.title, fontFamily: fonts.heading }}
              >
                {testimonialsSection?.title && typeof testimonialsSection.title === 'object' ? (
                  <TiptapRenderer content={testimonialsSection.title} as="inline" />
                ) : (
                  sectionTitle
                )}
              </h2>
            ) : null}
            {sectionDescription ? (
              <p
                className={cn(layout.descriptionClass, 'mt-2')}
                style={{ ...layout.description, fontFamily: fonts.body }}
              >
                {testimonialsSection?.description &&
                typeof testimonialsSection.description === 'object' ? (
                  <TiptapRenderer content={testimonialsSection.description} as="inline" />
                ) : (
                  sectionDescription
                )}
              </p>
            ) : null}
          </header>
        ) : null}

        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left — Arc Navigation */}
          <div data-scroll-reveal className="order-2 lg:order-1 lg:col-span-5">
            <div className="relative mx-auto h-[440px] w-full max-w-[340px] lg:mx-0">
              <svg
                className="pointer-events-none absolute left-0 top-0 h-full w-[100px]"
                viewBox="0 0 100 440"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d="M50 10 C85 120, 85 320, 50 430"
                  stroke={arcStroke}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="4 6"
                />
              </svg>

              {displayTestimonials.map((item, i) => {
                const offset = getWrappedOffset(i, index, count);
                if (Math.abs(offset) > 1) return null;
                return (
                  <ArcReviewerItem
                    key={testimonialKey(item, i)}
                    item={item}
                    offset={offset}
                    active={offset === 0}
                    onSelect={() => goTo(i)}
                    colors={colors}
                    fonts={fonts}
                  />
                );
              })}
            </div>
          </div>

          {/* Right — Editorial Quote Content */}
          <div data-scroll-reveal className="order-1 lg:order-2 lg:col-span-7">
            <div ref={quoteRef} key={index} className="relative">
              <span
                className="pointer-events-none absolute -left-6 -top-10 select-none font-serif text-[8rem] leading-none opacity-10 sm:text-[10rem]"
                style={{ color: colors.mainText }}
                aria-hidden
              >
                &ldquo;
              </span>

              <blockquote className="relative z-10">
                <div className="text-xl leading-relaxed sm:text-2xl md:text-[1.5rem] md:leading-[1.7]" style={{ color: colors.mainText }}>
                  {dropCap.letter ? (
                    <span
                      className="float-left mr-4 mt-2 text-[4rem] font-bold leading-[0.8] sm:text-[5rem]"
                      style={{ color: colors.primaryButton, fontFamily: fonts.heading }}
                    >
                      {dropCap.letter}
                    </span>
                  ) : null}
                  <p className="italic">
                    {dropCap.rest || active.content}
                  </p>
                </div>
                
                <footer className="mt-8 flex items-center gap-4">
                  <div className="h-[1px] w-8 bg-current opacity-30" />
                  <p className="text-sm font-bold uppercase tracking-widest" style={{ color: colors.secondaryText }}>
                    Verified Success Story
                  </p>
                </footer>
              </blockquote>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;