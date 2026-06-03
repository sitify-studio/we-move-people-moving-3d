'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { Page, Service, ServiceAreaPage } from '@/app/lib/types';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { getBusinessTagline } from '@/app/lib/siteContent';
import { cn } from '@/app/lib/utils';
import { tiptapToText } from '@/app/lib/seo';
import {
  getAreaCity,
  getAreaRegion,
  getServiceAreaPageHref,
  getServiceSlugFromAreaPage,
  normalizeSlug,
  resolveServiceSlug,
} from '@/app/lib/serviceAreaSlugs';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';

interface ServingAreasSectionProps {
  servingAreasSection?: Page['servingAreasSection'];
  className?: string;
}

type DisplayArea = {
  city: string;
  region: string;
  label: string;
  href?: string;
};

function resolveAreaCity(area: unknown): string {
  const fromHelper = getAreaCity(area);
  if (fromHelper) return fromHelper;

  if (area && typeof area === 'object') {
    const record = area as Record<string, unknown>;
    for (const key of ['area', 'location', 'label', 'title', 'name']) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }

  return '';
}

function formatAreaLabel(city: string, region: string): string {
  if (!region) return city;
  if (city.toLowerCase().includes(region.toLowerCase())) return city;
  return `${city}, ${region}`;
}

function normalizeServiceArea(area: unknown): Omit<DisplayArea, 'href' | 'label'> | null {
  const city = resolveAreaCity(area);
  if (!city) return null;

  const region = getAreaRegion(area);
  return { city, region };
}

function isVisibleService(service: Service): boolean {
  return service.status !== 'draft' && service.status !== 'archived';
}

function areaKey(area: Pick<DisplayArea, 'city' | 'region'>): string {
  return `${area.city.toLowerCase()}|${area.region.toLowerCase()}`;
}

function enrichArea(
  area: Omit<DisplayArea, 'href' | 'label'>,
  serviceSlug: string,
  serviceAreaPages: ServiceAreaPage[] | undefined
): DisplayArea {
  const href = getServiceAreaPageHref(serviceSlug, area, serviceAreaPages);
  return {
    ...area,
    label: formatAreaLabel(area.city, area.region),
    href: href || undefined,
  };
}

function AreaPill({
  area,
  index,
  colors,
  fonts,
}: {
  area: DisplayArea;
  index: number;
  colors: ReturnType<typeof useSectionTheme>['colors'];
  fonts: ReturnType<typeof useSectionTheme>['fonts'];
}) {
  const number = String(index + 1).padStart(2, '0');

  const pill = (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 sm:px-5 sm:py-2.5',
        'bg-transparent transition-colors duration-200',
        area.href && 'hover:border-[color-mix(in_srgb,var(--wb-primary)_25%,#d1d5db)]'
      )}
      style={{
        borderColor: 'color-mix(in srgb, var(--wb-primary) 8%, #d1d5db)',
        fontFamily: fonts.heading,
      }}
    >
      <span
        className="text-[10px] sm:text-[11px] tabular-nums font-normal"
        style={{ color: colors.secondaryText, opacity: 0.55 }}
      >
        {number}
      </span>
      <span className="text-sm sm:text-[15px] font-normal whitespace-nowrap" style={{ color: colors.mainText }}>
        {area.label}
      </span>
    </span>
  );

  if (area.href) {
    return (
      <Link href={area.href} className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-full">
        {pill}
      </Link>
    );
  }

  return <span className="inline-block">{pill}</span>;
}

export function ServingAreasSection({ servingAreasSection, className }: ServingAreasSectionProps) {
  const theme = useSectionTheme();
  const { colors, fonts, layout } = theme;
  const { site, services, serviceAreaPages } = useWebBuilder();

  const serviceAreas = useMemo<DisplayArea[]>(() => {
    const result: DisplayArea[] = [];
    const seen = new Set<string>();

    const addArea = (area: unknown, serviceSlug: string) => {
      const normalized = normalizeServiceArea(area);
      if (!normalized) return;
      const key = areaKey(normalized);
      if (seen.has(key)) return;
      seen.add(key);
      result.push(enrichArea(normalized, serviceSlug, serviceAreaPages));
    };

    const resolveSlugForPage = (page: ServiceAreaPage): string => {
      const serviceRef = page.serviceId as string | { slug?: string } | undefined;
      if (serviceRef && typeof serviceRef === 'object' && serviceRef.slug) {
        return resolveServiceSlug({ slug: serviceRef.slug });
      }
      if (typeof serviceRef === 'string') {
        const svc = services.find((s) => s._id === serviceRef);
        if (svc) return resolveServiceSlug(svc);
      }
      return 'service';
    };

    const addAreasFromServiceAreaPages = (filterPublished = true) => {
      serviceAreaPages.forEach((page) => {
        if (filterPublished && page.status !== 'published') return;
        if (!page.city?.trim()) return;
        addArea({ city: page.city, region: page.region }, resolveSlugForPage(page));
      });
    };

    const addAreasFromServiceAreaPagesForSlug = (slug: string, filterPublished = true) => {
      const normSlug = normalizeSlug(slug);
      serviceAreaPages.forEach((page) => {
        if (filterPublished && page.status !== 'published') return;
        if (!page.city?.trim()) return;
        const pageSlug = getServiceSlugFromAreaPage(page) || resolveSlugForPage(page);
        if (normalizeSlug(pageSlug) !== normSlug) return;
        addArea({ city: page.city, region: page.region }, normSlug);
      });
    };

    const sectionSlug = servingAreasSection?.serviceSlug?.trim();
    if (sectionSlug) {
      const normSectionSlug = normalizeSlug(sectionSlug);
      const match = services.find((s: Service) => resolveServiceSlug(s) === normSectionSlug);
      const slug = match ? resolveServiceSlug(match) : normSectionSlug;

      // Service detail: prefer live service area pages; fallback to service.serviceAreas only if none
      addAreasFromServiceAreaPagesForSlug(slug, true);
      if (result.length === 0) {
        addAreasFromServiceAreaPagesForSlug(slug, false);
      }
      if (result.length === 0) {
        (match?.serviceAreas ?? []).forEach((area) => addArea(area, slug));
      }
      return result;
    }

    addAreasFromServiceAreaPages(true);
    if (result.length > 0) return result;

    const visibleServices = services.filter(isVisibleService);
    for (const service of visibleServices) {
      const slug = resolveServiceSlug(service);
      (service.serviceAreas ?? []).forEach((area) => addArea(area, slug));
    }
    if (result.length > 0) return result;

    const defaultSlug = visibleServices[0]
      ? resolveServiceSlug(visibleServices[0])
      : services[0]
        ? resolveServiceSlug(services[0])
        : 'service';
    (site?.serviceAreas ?? []).forEach((area) => addArea(area, defaultSlug));
    if (result.length > 0) return result;

    addAreasFromServiceAreaPages(false);

    return result;
  }, [servingAreasSection?.serviceSlug, services, site?.serviceAreas, serviceAreaPages]);

  const sectionTitle = useMemo(() => {
    const text = tiptapToText(servingAreasSection?.title);
    return text || 'Our Service Areas';
  }, [servingAreasSection?.title]);

  const sectionDescription = useMemo(() => {
    const text = tiptapToText(servingAreasSection?.description);
    return text || getBusinessTagline(site) || '';
  }, [servingAreasSection?.description, site]);

  if (servingAreasSection?.enabled === false) return null;
  if (serviceAreas.length === 0) return null;

  return (
    <section
      className={cn('relative', layout.sectionClass, className)}
      style={{ backgroundColor: colors.pageBackground, fontFamily: fonts.heading }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <header className={layout.headerCenterClass}>
          <h2
            className={layout.titleClass}
            style={{ ...layout.title, fontFamily: fonts.heading }}
          >
            {sectionTitle}
          </h2>

          {sectionDescription ? (
            <p
              className={cn(layout.descriptionClass, 'mt-2 mx-auto max-w-3xl')}
              style={{ ...layout.description, fontFamily: fonts.body }}
            >
              {sectionDescription}
            </p>
          ) : null}
        </header>

        <div
          className={cn(
            'flex justify-center gap-2 sm:gap-3 lg:gap-4',
            'flex-nowrap overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible'
          )}
        >
          {serviceAreas.map((area, index) => (
            <AreaPill
              key={areaKey(area)}
              area={area}
              index={index}
              colors={colors}
              fonts={fonts}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ServingAreasSection;
