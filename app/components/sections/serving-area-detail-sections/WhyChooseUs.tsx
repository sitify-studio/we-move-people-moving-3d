'use client';

import { useMemo } from 'react';
import type { Page } from '@/app/lib/types';
import { WhyChooseUsSection } from '@/app/components/sections/WhyChooseUsSection';
import { tiptapToText } from '@/app/lib/seo';

interface WhyChooseUsProps {
  whyChooseUs: unknown;
  className?: string;
}

type WhyChooseUsSectionData = NonNullable<Page['whyChooseUsSection']> & {
  heading?: unknown;
  subtitle?: unknown;
};

function normalizeWhyChooseUsSection(whyChooseUs: unknown): WhyChooseUsSectionData | null {
  if (!whyChooseUs || typeof whyChooseUs !== 'object') return null;

  const data = whyChooseUs as Record<string, unknown>;
  if (data.enabled === false) return null;

  const rawItems = (data.reasons ?? data.items) as Array<{
    title?: unknown;
    description?: unknown;
    icon?: string;
  }> | undefined;

  const items =
    rawItems
      ?.filter((item) => item?.title || item?.description)
      .map((item) => ({
        title: item.title,
        description: item.description,
        icon: typeof item.icon === 'string' ? item.icon : undefined,
      })) ?? [];

  if (!data.title && !data.heading && !data.description && !data.subtitle && items.length === 0) {
    return null;
  }

  return {
    enabled: true,
    title: (data.title ?? data.heading) as WhyChooseUsSectionData['title'],
    heading: data.heading as WhyChooseUsSectionData['heading'],
    description: (data.description ?? data.subtitle) as WhyChooseUsSectionData['description'],
    subtitle: data.subtitle as WhyChooseUsSectionData['subtitle'],
    items,
  };
}

/** Service area why choose us — same layout as home WhyChooseUsSection. */
export const WhyChooseUs: React.FC<WhyChooseUsProps> = ({ whyChooseUs, className }) => {
  const section = useMemo(() => normalizeWhyChooseUsSection(whyChooseUs), [whyChooseUs]);
  if (!section) return null;

  const hasContent =
    Boolean(tiptapToText(section.title).trim()) ||
    Boolean(tiptapToText(section.description).trim()) ||
    (section.items?.length ?? 0) > 0;

  if (!hasContent) return null;

  return <WhyChooseUsSection whyChooseUsSection={section} className={className} />;
};

export default WhyChooseUs;
