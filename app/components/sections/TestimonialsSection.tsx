'use client';

import { Calendar, CircleUser, Star } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import type { Page } from '@/app/lib/types';
import { tiptapToText } from '@/app/lib/seo';
import { cn, getImageSrc } from '@/app/lib/utils';
import { TiptapRenderer } from '@/app/components/ui/TiptapRenderer';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import type { ThemeColors } from '@/app/hooks/useTheme';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';

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
  if (Number.isNaN(parsed)) return text.startsWith('on ') ? text : `on ${text}`;
  const formatted = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(parsed));
  return `on ${formatted}`;
}

function resolveAvatarUrl(item: Record<string, unknown>): string | undefined {
  const direct =
    (typeof item.avatar === 'string' && item.avatar.trim()) ||
    (typeof item.photo === 'string' && item.photo.trim()) ||
    (typeof item.profileImage === 'string' && item.profileImage.trim()) ||
    (typeof item.imageUrl === 'string' && item.imageUrl.trim()) ||
    (typeof item.image === 'string' && item.image.trim());
  if (direct) return direct.trim();

  const image = item.image;
  if (image && typeof image === 'object' && image !== null) {
    const url = (image as { url?: string }).url;
    if (typeof url === 'string' && url.trim()) return url.trim();
  }

  const thumb =
    typeof item.videoThumbnailUrl === 'string' ? item.videoThumbnailUrl.trim() : undefined;
  return thumb || undefined;
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
  const avatar = resolveAvatarUrl(item);
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
        alt={item.name ? `${item.name} photo` : ''}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{
          width: size,
          height: size,
          boxShadow: active
            ? `0 12px 28px color-mix(in srgb, ${colors.mainText} 18%, transparent)`
            : 'none',
          ...(active
            ? {
                outline: `2px solid ${colors.primaryButton}`,
                outlineOffset: 3,
              }
            : {}),
        }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        color: colors.primaryButton,
        backgroundColor: `color-mix(in srgb, ${colors.primaryButton} 12%, ${colors.pageBackground})`,
        border: `1px solid color-mix(in srgb, ${colors.primaryButton} 35%, transparent)`,
        boxShadow: active
          ? `0 12px 28px color-mix(in srgb, ${colors.primaryButton} 25%, transparent)`
          : 'none',
        ...(active ? { outline: `2px solid ${colors.primaryButton}`, outlineOffset: 3 } : {}),
      }}
      aria-hidden
    >
      <CircleUser
        className={active ? 'h-8 w-8' : 'h-6 w-6'}
        strokeWidth={1.5}
        aria-hidden
      />
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
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: colors.primaryButton, fill: colors.primaryButton }}
                  aria-hidden
                />
                <span className="font-semibold tabular-nums" style={{ color: colors.mainText }}>
                  {item.rating.toFixed(1)}
                </span>
              </div>
            ) : null}
            {item.dateLabel ? (
              <span className="inline-flex items-center gap-1 opacity-70">
                <Calendar className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
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
  const { testimonials: apiTestimonials } = useWebBuilder();
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
    const fromPage =
      testimonialsSection?.testimonials
        ?.map((item) => normalizeTestimonialItem(item as Record<string, unknown>))
        .filter((item): item is DisplayTestimonial => Boolean(item)) ?? [];

    const fromApi =
      apiTestimonials?.testimonials
        ?.map((item) => normalizeTestimonialItem(item as Record<string, unknown>))
        .filter((item): item is DisplayTestimonial => Boolean(item)) ?? [];

    if (fromPage.length === 0) return fromApi;

    return fromPage.map((item, i) => {
      const match =
        fromApi.find(
          (api) =>
            item.name &&
            api.name &&
            api.name.trim().toLowerCase() === item.name.trim().toLowerCase()
        ) ?? fromApi[i];

      if (!match) return item;
      return {
        ...item,
        avatar: item.avatar ?? match.avatar,
        rating: item.rating ?? match.rating,
        dateLabel: item.dateLabel ?? match.dateLabel,
        role: item.role || match.role,
      };
    });
  }, [testimonialsSection?.testimonials, apiTestimonials?.testimonials]);

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
          <header data-scroll-reveal className={cn(layout.headerCenterClass, 'mb-10 lg:mb-12')}>
            <div
              className="mx-auto mb-4 h-1 w-12 rounded-full"
              style={{ backgroundColor: colors.primaryButton }}
              aria-hidden
            />
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
                className="pointer-events-none absolute -left-2 -top-6 select-none font-serif text-[5rem] leading-none sm:-left-4 sm:-top-8 sm:text-[6.5rem]"
                style={{ color: colors.mainText }}
                aria-hidden
              >
                &ldquo;
              </span>

              <blockquote className="relative z-10">
                <div
                  className="text-xl leading-relaxed sm:text-2xl md:text-[1.5rem] md:leading-[1.7]"
                  style={{ color: colors.mainText, fontFamily: fonts.heading }}
                >
                  {dropCap.letter ? (
                    <span
                      className="float-left mr-3 mt-1 text-[4rem] font-normal leading-[0.75] sm:mr-4 sm:text-[5rem]"
                      style={{ color: colors.mainText, fontFamily: fonts.heading }}
                    >
                      {dropCap.letter}
                    </span>
                  ) : null}
                  <p className="italic" style={{ fontFamily: fonts.heading }}>
                    {dropCap.rest || active.content}
                  </p>
                </div>

                {(active.name || active.rating != null || active.dateLabel || active.avatar) ? (
                  <footer className="mt-8 flex items-center gap-4 border-t pt-6" style={{ borderColor: `color-mix(in srgb, ${colors.mainText} 12%, transparent)` }}>
                    <ReviewerAvatar item={active} active colors={colors} />
                    <div className="min-w-0">
                      {active.name ? (
                        <p className="text-sm font-bold" style={{ color: colors.mainText, fontFamily: fonts.heading }}>
                          {active.name}
                        </p>
                      ) : null}
                      {(active.rating != null || active.dateLabel || active.role) ? (
                        <div
                          className="mt-1 flex flex-wrap items-center gap-2 text-xs"
                          style={{ color: colors.secondaryText, fontFamily: fonts.body }}
                        >
                          {active.rating != null ? (
                            <span className="inline-flex items-center gap-1">
                              <Star
                                className="h-3.5 w-3.5 shrink-0"
                                style={{ color: colors.primaryButton, fill: colors.primaryButton }}
                                aria-hidden
                              />
                              <span className="font-semibold tabular-nums" style={{ color: colors.mainText }}>
                                {active.rating.toFixed(1)}
                              </span>
                            </span>
                          ) : null}
                          {active.dateLabel ? (
                            <span className="inline-flex items-center gap-1 opacity-80">
                              <Calendar className="h-3 w-3 shrink-0" aria-hidden />
                              {active.dateLabel}
                            </span>
                          ) : null}
                          {active.role && !active.dateLabel ? (
                            <span className="opacity-80">{active.role}</span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </footer>
                ) : null}
              </blockquote>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;