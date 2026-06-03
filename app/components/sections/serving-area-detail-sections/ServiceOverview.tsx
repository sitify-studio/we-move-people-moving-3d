'use client';

import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { OptimizedImage, IMAGE_SIZES } from '@/app/components/ui/OptimizedImage';
import { TiptapRenderer } from '@/app/components/ui/TiptapRenderer';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import { tiptapToText } from '@/app/lib/seo';
import { cn, getImageSrc, resolveMediaUrl } from '@/app/lib/utils';

gsap.registerPlugin(ScrollTrigger);

interface ServiceOverviewProps {
  overview: unknown;
  className?: string;
}

type OverviewService = {
  name: string;
  description: string;
  price?: string;
  imageUrl?: string;
  imageAlt?: string;
};

type OverviewData = {
  title?: unknown;
  subtitle?: unknown;
  description?: unknown;
  image?: { url: string; altText?: string };
  services: OverviewService[];
};

function normalizeSectionImage(raw: unknown): OverviewData['image'] | undefined {
  const url = resolveMediaUrl(raw);
  if (!url) return undefined;

  const altText =
    raw && typeof raw === 'object' && raw !== null && 'altText' in raw
      ? (raw as { altText?: string }).altText?.trim()
      : undefined;

  return { url: getImageSrc(url), altText };
}

function resolveOverviewItems(data: Record<string, unknown>): unknown[] {
  const candidates = [data.services, data.items, data.highlights, data.projects];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === 'object') {
      const nested = candidate as Record<string, unknown>;
      if (Array.isArray(nested.services)) return nested.services;
      if (Array.isArray(nested.items)) return nested.items;
    }
  }

  return [];
}

function normalizeServiceItem(item: unknown): OverviewService | null {
  if (!item || typeof item !== 'object') return null;
  const record = item as Record<string, unknown>;

  const name =
    tiptapToText(record.name).trim() ||
    tiptapToText(record.title).trim() ||
    (typeof record.name === 'string' ? record.name.trim() : '') ||
    (typeof record.title === 'string' ? record.title.trim() : '');

  if (!name) return null;

  const description =
    tiptapToText(record.description) ||
    tiptapToText(record.shortDescription) ||
    (typeof record.summary === 'string' ? record.summary.trim() : '');

  const price = typeof record.price === 'string' ? record.price.trim() : undefined;

  const imageRaw = record.image ?? record.imageUrl ?? record.media ?? record.thumbnail;
  const imageUrl = resolveMediaUrl(imageRaw);
  const rawAlt =
    imageRaw && typeof imageRaw === 'object' && 'altText' in imageRaw
      ? (imageRaw as { altText?: unknown }).altText
      : undefined;
  const imageAlt =
    typeof rawAlt === 'string' && rawAlt.trim() ? rawAlt.trim() : name;

  return {
    name,
    description,
    price,
    imageUrl: imageUrl ? getImageSrc(imageUrl) : undefined,
    imageAlt,
  };
}

function normalizeOverviewSection(overview: unknown): OverviewData | null {
  if (!overview || typeof overview !== 'object') return null;

  const data = overview as Record<string, unknown>;
  if (data.enabled === false) return null;

  const nestedServices = data.services;
  const nestedTitle =
    nestedServices &&
    typeof nestedServices === 'object' &&
    !Array.isArray(nestedServices)
      ? (nestedServices as Record<string, unknown>).title
      : undefined;

  const nestedDescription =
    nestedServices &&
    typeof nestedServices === 'object' &&
    !Array.isArray(nestedServices)
      ? (nestedServices as Record<string, unknown>).description ??
        (nestedServices as Record<string, unknown>).subtitle
      : undefined;

  const title = data.title ?? data.heading ?? nestedTitle;
  const subtitle = data.subtitle ?? data.label;
  const description = data.description ?? data.secondaryDescription ?? nestedDescription;
  const image = normalizeSectionImage(data.image);

  const services: OverviewService[] = [];
  for (const item of resolveOverviewItems(data)) {
    const normalized = normalizeServiceItem(item);
    if (normalized) services.push(normalized);
  }

  if (!title && !description && !image && services.length === 0) return null;

  return { title, subtitle, description, image, services };
}

function hasRichContent(content: unknown): boolean {
  if (content == null || content === '') return false;
  if (typeof content === 'object') return Boolean(tiptapToText(content));
  return Boolean(String(content).trim());
}

function OrganicBlob({ className, color }: { className?: string; color: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute rounded-[40%_60%_70%_30%/40%_50%_60%_50%]',
        className
      )}
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

export const ServiceOverview: React.FC<ServiceOverviewProps> = ({ overview, className }) => {
  const { colors, fonts } = useSectionTheme();
  const containerRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLUListElement>(null);

  const section = useMemo(() => normalizeOverviewSection(overview), [overview]);

  const titleText = useMemo(() => tiptapToText(section?.title).trim(), [section?.title]);
  const subtitleText = useMemo(() => tiptapToText(section?.subtitle).trim(), [section?.subtitle]);
  const descriptionText = useMemo(
    () => tiptapToText(section?.description).trim(),
    [section?.description]
  );

  const headerImage = section?.image?.url;
  const headerImageAlt =
    section?.image?.altText?.trim() || titleText || 'Service overview';

  const blobColor = `color-mix(in srgb, ${colors.primaryButton} 18%, transparent)`;
  const blobColorSoft = `color-mix(in srgb, ${colors.primaryButton} 10%, transparent)`;
  const cardBorder = `color-mix(in srgb, ${colors.mainText} 10%, transparent)`;

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (introRef.current) {
        gsap.from(introRef.current.children, {
          opacity: 0,
          y: 28,
          stagger: 0.1,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: introRef.current,
            start: 'top 82%',
            once: true,
          },
        });
      }

      const cards = cardsRef.current?.querySelectorAll('.overview-card');
      if (cards?.length) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.08,
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 85%',
              once: true,
            },
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [section?.services.length, headerImage, titleText]);

  if (!section) return null;

  const showTitle = hasRichContent(section.title) || Boolean(titleText);
  const showDescription = hasRichContent(section.description) || Boolean(descriptionText);
  const hasIntro = showTitle || showDescription || Boolean(headerImage);

  return (
    <section
      ref={containerRef}
      id="service-overview"
      className={cn('relative overflow-hidden py-8 lg:py-12', className)}
      style={{ backgroundColor: colors.pageBackground, fontFamily: fonts.body }}
    >
      <OrganicBlob className="-left-16 top-8 h-48 w-48 sm:h-64 sm:w-64" color={blobColorSoft} />
      <OrganicBlob
        className="-right-20 bottom-0 hidden h-72 w-72 lg:block"
        color={blobColor}
      />

      <div className="container relative z-10 mx-auto max-w-6xl px-6">
        {hasIntro ? (
          <div
            ref={introRef}
            className={cn(
              'mb-12 lg:mb-16',
              headerImage
                ? 'grid gap-8 lg:grid-cols-2 lg:items-stretch lg:gap-10'
                : 'max-w-xl'
            )}
          >
            <div className="flex flex-col justify-center space-y-3">
              {subtitleText ? (
                <div className="flex items-center gap-3">
                  <div className="h-px w-10" style={{ backgroundColor: colors.primaryButton }} />
                  <span
                    className="text-[10px] font-mono uppercase tracking-[0.3em]"
                    style={{ color: colors.primaryButton }}
                  >
                    {subtitleText}
                  </span>
                </div>
              ) : null}

              {showTitle ? (
                <h2
                  className="text-2xl font-bold leading-tight sm:text-3xl"
                  style={{
                    color: colors.mainText,
                    fontFamily: fonts.heading,
                  }}
                >
                  {hasRichContent(section.title) ? (
                    <TiptapRenderer content={section.title} as="inline" />
                  ) : (
                    titleText
                  )}
                </h2>
              ) : null}

              {showDescription ? (
                hasRichContent(section.description) ? (
                  <div
                    className="text-sm leading-relaxed"
                    style={{ color: colors.secondaryText }}
                  >
                    <TiptapRenderer content={section.description} as="inline" />
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed" style={{ color: colors.secondaryText }}>
                    {descriptionText}
                  </p>
                )
              ) : null}
            </div>

            {headerImage ? (
              <div className="relative min-h-[12rem] w-full overflow-hidden rounded-2xl sm:min-h-[14rem] lg:min-h-0 lg:h-full">
                <OptimizedImage
                  src={headerImage}
                  alt={headerImageAlt}
                  fill
                  sizes={IMAGE_SIZES.sectionHalf}
                  className="object-cover object-center"
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {section.services.length > 0 ? (
          <ul
            ref={cardsRef}
            className={cn(
              'grid gap-6',
              section.services.length === 1
                ? 'grid-cols-1 max-w-md'
                : section.services.length === 2
                  ? 'sm:grid-cols-2'
                  : 'sm:grid-cols-2 lg:grid-cols-3'
            )}
          >
            {section.services.map((service, index) => {
              const number = String(index + 1).padStart(2, '0');

              return (
                <li
                  key={`${service.name}-${index}`}
                  className="overview-card flex flex-col overflow-hidden rounded-2xl border transition-shadow hover:shadow-lg"
                  style={{
                    borderColor: cardBorder,
                    backgroundColor: colors.cardBackground,
                  }}
                >
                  {service.imageUrl ? (
                    <div className="relative aspect-[16/10] w-full overflow-hidden">
                      <OptimizedImage
                        src={service.imageUrl}
                        alt={service.imageAlt || service.name}
                        fill
                        sizes={IMAGE_SIZES.card}
                        className="object-cover transition-transform duration-500 hover:scale-[1.03]"
                      />
                    </div>
                  ) : null}

                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <span
                        className="text-3xl font-bold tabular-nums leading-none"
                        style={{ color: colors.primaryButton, fontFamily: fonts.heading }}
                      >
                        {number}
                      </span>
                      {service.price ? (
                        <span
                          className="shrink-0 text-xs font-semibold uppercase tracking-wider"
                          style={{ color: colors.primaryButton }}
                        >
                          {service.price}
                        </span>
                      ) : null}
                    </div>

                    <h3
                      className="text-lg font-bold leading-snug sm:text-xl"
                      style={{ color: colors.mainText, fontFamily: fonts.heading }}
                    >
                      {service.name}
                    </h3>

                    {service.description ? (
                      <p
                        className="mt-3 flex-1 text-sm leading-relaxed"
                        style={{ color: colors.secondaryText }}
                      >
                        {service.description}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </section>
  );
};

export default ServiceOverview;
