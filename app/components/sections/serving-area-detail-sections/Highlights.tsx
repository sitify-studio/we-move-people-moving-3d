'use client';

import type { Page } from '@/app/lib/types';
import { WhyChooseUsSection } from '@/app/components/sections/WhyChooseUsSection';
import { tiptapToText } from '@/app/lib/seo';

interface HighlightsProps {
  highlights: unknown;
  className?: string;
}

type WhyChooseUsSectionData = NonNullable<Page['whyChooseUsSection']> & {
  heading?: unknown;
  subtitle?: unknown;
};

function normalizeHighlightsSection(highlights: unknown): WhyChooseUsSectionData | null {
  if (!highlights || typeof highlights !== 'object') return null;

  const data = highlights as Record<string, unknown>;
  if (data.enabled === false) return null;

  const rawItems = (data.items ?? data.highlights) as Array<{
    title?: unknown;
    description?: unknown;
    price?: string;
    counter?: string;
    icon?: string;
  }> | undefined;

  const items =
    rawItems
      ?.filter((item) => item?.title || item?.description || item?.price || item?.counter)
      .map((item) => ({
        title: item.title,
        description: item.price || item.counter || item.description,
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

/** Service area stats/highlights — same card layout as home WhyChooseUsSection. */
export const Highlights: React.FC<HighlightsProps> = ({ highlights, className }) => {
  const section = normalizeHighlightsSection(highlights);
  if (!section) return null;

  const hasContent =
    Boolean(tiptapToText(section.title).trim()) ||
    Boolean(tiptapToText(section.description).trim()) ||
    (section.items?.length ?? 0) > 0;

  if (!hasContent) return null;

  return <WhyChooseUsSection whyChooseUsSection={section} className={className} />;
};

export default Highlights;
