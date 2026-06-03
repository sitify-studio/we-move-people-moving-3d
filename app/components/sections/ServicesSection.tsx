'use client';

import {
  ArrowRight,
  Building2,
  Home,
  MapPinned,
  Package,
  Truck,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { useEffect, useMemo, useRef } from 'react';
import type { Page, Service } from '@/app/lib/types';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { getPageHref } from '@/app/lib/siteContent';
import { tiptapToText } from '@/app/lib/seo';
import { cn, getImageSrc } from '@/app/lib/utils';
import { TiptapRenderer } from '@/app/components/ui/TiptapRenderer';
import { OptimizedImage, IMAGE_SIZES } from '@/app/components/ui/OptimizedImage';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import type { ThemeColors } from '@/app/hooks/useTheme';
import { resolveServiceSlug } from '@/app/lib/serviceAreaSlugs';

gsap.registerPlugin(ScrollTrigger);

interface ServicesSectionProps {
  servicesSection?: Page['servicesSection'];
  companyDetailSection?: Page['companyDetailSection'];
  ctaSection?: Page['ctaSection'];
  page?: Page | null;
  className?: string;
}

type ServicesSectionInput = NonNullable<Page['servicesSection']> & {
  heading?: unknown;
  subtitle?: unknown;
  primaryButton?: { label?: string; href?: string };
};

type DisplayService = {
  id: string;
  title: string;
  description: string;
  image?: string;
  imageAlt: string;
  href: string;
  category?: string;
  ctaLabel: string;
};

const STACK_Y_STEP = 16;
const STACK_SCALE_STEP = 0.04;
const CARD_STACK_HEIGHT = 'min(42vh, 320px)';

function shortDescription(text: string, maxLength = 110): string {
  const trimmed = text.trim();
  if (!trimmed) return 'Reliable movers for local and long-distance relocations.';
  if (trimmed.length <= maxLength) return trimmed;
  const slice = trimmed.slice(0, maxLength);
  const breakAt = slice.lastIndexOf(' ');
  return `${(breakAt > 40 ? slice.slice(0, breakAt) : slice).trim()}…`;
}

function getStackCardTheme(index: number, colors: ThemeColors) {
  const accents = [
    colors.primaryButton,
    colors.hoverActive,
    `color-mix(in srgb, ${colors.primaryButton} 72%, ${colors.hoverActive})`,
    `color-mix(in srgb, ${colors.primaryButton} 48%, ${colors.inactive})`,
  ];
  const accent = accents[index % accents.length];

  return {
    accent,
    panel: `color-mix(in srgb, ${colors.cardBackground} 94%, transparent)`,
    visual: `linear-gradient(135deg, color-mix(in srgb, ${accent} 85%, ${colors.sectionBackgroundLight}) 0%, color-mix(in srgb, ${accent} 60%, ${colors.mainText}) 100%)`,
    border: `color-mix(in srgb, ${colors.primaryButton} 12%, transparent)`,
    shadow: `color-mix(in srgb, ${colors.mainText} 12%, transparent)`,
  };
}

type MovingServiceVisual = {
  Icon: LucideIcon;
  label: string;
  gradient: string;
};

function getMovingServiceVisual(
  title: string,
  category: string | undefined,
  colors: ThemeColors
): MovingServiceVisual {
  const text = `${title} ${category ?? ''}`.toLowerCase();
  const base = (mix: string) =>
    `linear-gradient(135deg, color-mix(in srgb, ${colors.primaryButton} ${mix}, ${colors.sectionBackgroundDark}) 0%, color-mix(in srgb, ${colors.primaryButton} 35%, ${colors.mainText}) 100%)`;

  if (text.match(/commercial|office|business|corporate/)) {
    return { Icon: Building2, label: 'Commercial moving', gradient: base('70%') };
  }
  if (text.match(/long[- ]?distance|interstate|cross[- ]?country/)) {
    return { Icon: MapPinned, label: 'Long-distance', gradient: base('58%') };
  }
  if (text.match(/pack|crat|wrap/)) {
    return { Icon: Package, label: 'Packing services', gradient: base('65%') };
  }
  if (text.match(/storage|warehouse/)) {
    return { Icon: Warehouse, label: 'Storage', gradient: base('52%') };
  }
  if (text.match(/local|residential|home|house|apartment/)) {
    return { Icon: Home, label: 'Residential moving', gradient: base('62%') };
  }

  return { Icon: Truck, label: 'Moving service', gradient: base('75%') };
}

function pickSectionField(
  section: ServicesSectionInput | undefined,
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

function isVisibleService(service: Service): boolean {
  return service.status !== 'draft' && service.status !== 'archived';
}

function mapLiveService(service: Service): DisplayService {
  const imageUrl = service.thumbnailImage?.url
    ? getImageSrc(service.thumbnailImage.url)
    : service.galleryImages?.[0]?.url
      ? getImageSrc(service.galleryImages[0].url)
      : undefined;

  const description =
    tiptapToText(service.shortDescription) || tiptapToText(service.description);

  return {
    id: service._id,
    title: service.name?.trim() || 'Service',
    description: description || '',
    image: imageUrl,
    imageAlt:
      service.thumbnailImage?.altText ||
      service.galleryImages?.[0]?.altText ||
      service.name ||
      'Service',
    href: service.cta?.buttonUrl?.trim()
      ? normalizeHref(service.cta.buttonUrl.trim())
      : `/service/${resolveServiceSlug(service)}`,
    category: service.category?.trim(),
    ctaLabel: service.cta?.buttonText?.trim() || 'View service',
  };
}

function OutlinedPillLink({
  href,
  label,
  className,
  external,
}: {
  href: string;
  label: string;
  className?: string;
  external?: boolean;
}) {
  const { colors, fonts } = useSectionTheme();
  const pillClass = cn(
    'inline-flex items-center justify-center rounded-full border px-8 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.02]',
    className
  );
  
  const style = {
    borderColor: colors.primaryButton,
    color: colors.primaryButton,
    backgroundColor: 'transparent',
    fontFamily: fonts.body,
  };

  if (external) {
    return (
      <a href={href} className={pillClass} style={style}>
        {label}
        <ArrowRight className="ml-2 h-4 w-4" />
      </a>
    );
  }

  return (
    <Link href={href} className={cn(pillClass, 'no-underline')} style={style}>
      {label}
      <ArrowRight className="ml-2 h-4 w-4" />
    </Link>
  );
}

function MovingCardPlaceholder({
  visual,
  colors,
}: {
  visual: MovingServiceVisual;
  colors: ThemeColors;
}) {
  const { Icon } = visual;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center transition-transform duration-700 group-hover:scale-110"
      style={{
        background:
          visual.gradient ||
          `linear-gradient(135deg, color-mix(in srgb, ${colors.primaryButton} 75%, ${colors.sectionBackgroundLight}) 0%, color-mix(in srgb, ${colors.primaryButton} 45%, ${colors.mainText}) 100%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '20px 20px',
        }}
      />
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20">
        <Icon className="h-10 w-10 text-white/90" strokeWidth={1.5} aria-hidden />
      </div>
    </div>
  );
}

function StackServiceCard({
  service,
  index,
  stackTotal,
}: {
  service: DisplayService;
  index: number;
  stackTotal: number;
}) {
  const { colors, fonts, styles, layout } = useSectionTheme();
  const visual = getMovingServiceVisual(service.title, service.category, colors);
  const cardTheme = getStackCardTheme(index, colors);
  const { Icon } = visual;
  const bodyText = shortDescription(service.description);

  return (
    <article
      className="service-stack-card absolute inset-x-0 top-0 overflow-hidden rounded-[20px] border will-change-transform backdrop-blur-sm"
      style={{
        top: 0,
        zIndex: stackTotal - index,
        transformOrigin: 'center top',
        boxShadow: `0 10px 30px ${cardTheme.shadow}`,
        ...styles.cardSolid,
        backgroundColor: cardTheme.panel,
        borderColor: cardTheme.border,
      }}
      data-stack-index={index}
    >
      <div className="flex min-h-[260px] flex-col sm:min-h-[280px] lg:min-h-0 lg:flex-row">
        <div className="flex flex-1 flex-col justify-between gap-4 p-6 sm:p-7 lg:w-[54%] lg:py-7 lg:pl-8 lg:pr-6">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.24em]"
              style={{ color: cardTheme.accent, fontFamily: fonts.body }}
            >
              {service.category || visual.label}
            </p>
            <h3
              className="mt-2 text-xl font-bold leading-tight tracking-tight sm:text-2xl"
              style={{ color: colors.mainText, fontFamily: fonts.heading }}
            >
              <Link href={service.href} className="no-underline hover:opacity-85" style={{ color: 'inherit' }}>
                {service.title}
              </Link>
            </h3>
            <p
              className="mt-3 line-clamp-2 max-w-sm text-sm leading-relaxed"
              style={{ color: colors.secondaryText }}
            >
              {bodyText}
            </p>
          </div>

          <Link
            href={service.href}
            className="inline-flex w-fit items-center gap-2 rounded-full px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] no-underline transition-opacity hover:opacity-90"
            style={{ ...styles.primaryCta, fontFamily: fonts.body }}
          >
            {service.ctaLabel}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <Link
          href={service.href}
          className="relative min-h-[140px] flex-1 overflow-hidden no-underline sm:min-h-[160px] lg:min-h-0 lg:w-[46%]"
        >
          <div className="absolute inset-0" style={styles.imagePlaceholder}>
            {service.image ? (
              <>
                <OptimizedImage
                  src={service.image}
                  alt={service.imageAlt}
                  fill
                  sizes={IMAGE_SIZES.sectionHalf}
                  className="object-cover"
                />
                <div
                  className="absolute inset-0 mix-blend-multiply opacity-35"
                  style={{ background: cardTheme.visual }}
                  aria-hidden
                />
              </>
            ) : (
              <MovingCardPlaceholder visual={visual} colors={colors} />
            )}
          </div>
        </Link>
      </div>
    </article>
  );
}

export function ServicesSection({ servicesSection, className }: ServicesSectionProps) {
  const { services, pages } = useWebBuilder();
  const { colors, fonts, styles, layout } = useSectionTheme();
  const containerRef = useRef<HTMLElement>(null);
  const stackScrollRef = useRef<HTMLDivElement>(null);
  const stackPinRef = useRef<HTMLDivElement>(null);

  const sectionInput = servicesSection as ServicesSectionInput | undefined;
  const titleContent = pickSectionField(sectionInput, 'title');
  const titleText = useMemo(() => tiptapToText(titleContent).trim(), [titleContent]);

  const descriptionText = useMemo(
    () => tiptapToText(pickSectionField(sectionInput, 'description')).trim(),
    [sectionInput]
  );

  const descriptionContent = pickSectionField(sectionInput, 'description');

  const servicesListHref = useMemo(() => {
    const listPage = pages.find((p) => p.pageType === 'service-list' && p.status === 'published');
    return listPage ? getPageHref(listPage) : '/services';
  }, [pages]);

  const headerCta = useMemo(() => {
    const btn = sectionInput?.primaryButton;
    if (btn?.label?.trim()) {
      return {
        label: btn.label.trim(),
        href: normalizeHref(btn.href?.trim() || servicesListHref),
      };
    }
    const listPage = pages.find((p) => p.pageType === 'service-list' && p.status === 'published');
    return {
      label: 'View All Services',
      href: listPage ? getPageHref(listPage) : '/services',
    };
  }, [sectionInput, pages, servicesListHref]);

  const headerCtaExternal =
    headerCta.href.startsWith('http') ||
    headerCta.href.startsWith('mailto:') ||
    headerCta.href.startsWith('tel:');

  const displayServices = useMemo((): DisplayService[] => {
    const fromApi = (services ?? []).filter(isVisibleService);
    const ids = servicesSection?.serviceIds;

    const filtered = ids?.length
      ? ids
          .map((id) => fromApi.find((s) => s._id === id))
          .filter((s): s is Service => Boolean(s))
      : fromApi;

    return filtered.map(mapLiveService);
  }, [services, servicesSection?.serviceIds]);

  const stackCount = displayServices.length;

  useEffect(() => {
    if (!stackScrollRef.current || !stackPinRef.current || stackCount === 0) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('.service-stack-card', stackPinRef.current);
      if (!cards.length) return;

      cards.forEach((card, i) => {
        gsap.set(card, {
          y: i * STACK_Y_STEP,
          scale: 1 - i * STACK_SCALE_STEP,
          zIndex: cards.length - i,
          transformOrigin: 'center top',
        });
      });

      if (cards.length < 2) return;

      const segment = 1;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stackScrollRef.current,
          start: 'top 100px',
          end: `+=${(cards.length - 1) * 55}%`,
          pin: stackPinRef.current,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      for (let i = 0; i < cards.length - 1; i++) {
        const outgoing = cards[i];
        const behind = cards.slice(i + 1);

        tl.to(
          outgoing,
          {
            y: -window.innerHeight * 0.55,
            scale: 0.88,
            opacity: 0,
            filter: 'blur(4px)',
            ease: 'none',
            duration: segment,
          },
          i * segment
        );

        if (behind.length > 0) {
          tl.to(
            behind,
            {
              y: `-=${STACK_Y_STEP}`,
              scale: `+=${STACK_SCALE_STEP}`,
              ease: 'none',
              duration: segment,
            },
            i * segment
          );
        }
      }
    }, containerRef);

    return () => ctx.revert();
  }, [stackCount]);

  const hasContent =
    Boolean(titleText) || Boolean(descriptionText) || displayServices.length > 0;

  if (servicesSection?.enabled === false) return null;
  if (servicesSection && !hasContent) return null;

  return (
    <section
      ref={containerRef}
      id="services"
      className={cn('overflow-hidden', layout.sectionClass, className)}
      style={{ backgroundColor: colors.pageBackground, fontFamily: fonts.body }}
    >
      <div className="container mx-auto max-w-6xl px-6">
        
        {/* Dynamic Modern Layout Header */}
        <header className="mb-6 grid grid-cols-1 items-end gap-4 md:grid-cols-12 md:gap-6">
          <div className="md:col-span-7">
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
          </div>
          
          <div className="flex flex-col items-start md:col-span-5 md:items-end">
            {descriptionText ? (
              <p
                className={cn(layout.descriptionClass, 'mb-4 md:text-right')}
                style={{ ...layout.description, fontFamily: fonts.body }}
              >
                {descriptionContent && typeof descriptionContent === 'object' ? (
                  <TiptapRenderer content={descriptionContent} as="inline" />
                ) : (
                  descriptionText
                )}
              </p>
            ) : null}
            <OutlinedPillLink
              href={headerCta.href}
              label={headerCta.label}
              external={headerCtaExternal}
            />
          </div>
        </header>

        {displayServices.length > 0 ? (
          <div ref={stackScrollRef} className="relative">
            <div
              ref={stackPinRef}
              className="relative mx-auto w-full"
              style={{
                height: `calc(${CARD_STACK_HEIGHT} + ${Math.max(0, stackCount - 1) * STACK_Y_STEP}px)`,
              }}
            >
              {displayServices.map((service, index) => (
                <StackServiceCard
                  key={service.id}
                  service={service}
                  index={index}
                  stackTotal={stackCount}
                />
              ))}
            </div>
          </div>
        ) : (
          <div 
            className="rounded-[24px] border p-8 text-center border-dashed"
            style={styles.card}
          >
            <p className="text-sm" style={{ color: colors.secondaryText }}>
              Moving services will appear here once published.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default ServicesSection;