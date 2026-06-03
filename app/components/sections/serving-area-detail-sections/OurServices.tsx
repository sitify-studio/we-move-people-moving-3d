'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import type { Page, Service } from '@/app/lib/types';
import { ServicesSection } from '@/app/components/sections/ServicesSection';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { normalizeSlug, resolveServiceSlug } from '@/app/lib/serviceAreaSlugs';

interface OurServicesProps {
  services?: unknown;
  pageServiceId?: string;
  className?: string;
}

type ServicesSectionData = NonNullable<Page['servicesSection']> & {
  heading?: unknown;
  subtitle?: unknown;
  label?: string;
  serviceIds?: string[];
};

function isVisibleService(service: Service): boolean {
  return service.status !== 'draft' && service.status !== 'archived';
}

function orderServiceIds(
  liveServices: Service[],
  pageServiceId?: string,
  serviceSlugFromUrl?: string
): string[] {
  const visible = liveServices.filter(isVisibleService);
  const normSlug = serviceSlugFromUrl ? normalizeSlug(serviceSlugFromUrl) : '';

  const primary =
    (pageServiceId && visible.find((s) => s._id === pageServiceId)) ||
    (normSlug && visible.find((s) => resolveServiceSlug(s) === normSlug));

  if (!primary) return visible.map((s) => s._id);

  return [primary._id, ...visible.filter((s) => s._id !== primary._id).map((s) => s._id)];
}

function normalizeOurServicesSection(
  config: unknown,
  liveServices: Service[],
  pageServiceId?: string,
  serviceSlugFromUrl?: string
): ServicesSectionData | null {
  if (config != null && typeof config === 'object' && (config as { enabled?: boolean }).enabled === false) {
    return null;
  }

  const data =
    config && typeof config === 'object' ? (config as Record<string, unknown>) : ({} as Record<string, unknown>);

  const cmsIds = Array.isArray(data.serviceIds)
    ? (data.serviceIds as string[]).filter(Boolean)
    : undefined;

  const serviceIds =
    cmsIds && cmsIds.length > 0
      ? cmsIds
      : orderServiceIds(liveServices, pageServiceId, serviceSlugFromUrl);

  if (
    !data.title &&
    !data.heading &&
    !data.description &&
    !data.subtitle &&
    !data.label &&
    serviceIds.length === 0
  ) {
    return null;
  }

  return {
    enabled: true,
    title: (data.title ?? data.label ?? data.heading) as ServicesSectionData['title'],
    heading: data.heading as ServicesSectionData['heading'],
    description: (data.description ?? data.subtitle) as ServicesSectionData['description'],
    subtitle: (data.subtitle ?? data.label) as ServicesSectionData['subtitle'],
    serviceIds,
  };
}

/** Service area services list — same layout as home ServicesSection. */
export const OurServices: React.FC<OurServicesProps> = ({
  services,
  pageServiceId,
  className,
}) => {
  const { services: liveServices } = useWebBuilder();
  const params = useParams();
  const serviceSlugFromUrl =
    typeof params?.serviceSlug === 'string' ? params.serviceSlug : '';

  const servicesSection = useMemo(
    () => normalizeOurServicesSection(services, liveServices, pageServiceId, serviceSlugFromUrl),
    [services, liveServices, pageServiceId, serviceSlugFromUrl]
  );

  if (!servicesSection) return null;

  return <ServicesSection servicesSection={servicesSection} className={className} />;
};

export default OurServices;
