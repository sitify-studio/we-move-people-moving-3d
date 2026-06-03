'use client';

import type { Page } from '@/app/lib/types';
import { FAQSection } from '@/app/components/sections/FAQSection';
import { tiptapToText } from '@/app/lib/seo';

interface FAQsProps {
  faqs: unknown;
  className?: string;
}

type FaqSectionData = NonNullable<Page['faqSection']> & {
  heading?: unknown;
  subtitle?: unknown;
};

function normalizeFaqSection(faqs: unknown): FaqSectionData | null {
  if (!faqs) return null;

  if (Array.isArray(faqs)) {
    const items = faqs.filter(
      (item) =>
        item &&
        typeof item === 'object' &&
        ((item as { question?: unknown }).question || (item as { answer?: unknown }).answer)
    ) as FaqSectionData['items'];
    if (items.length === 0) return null;
    return { enabled: true, items };
  }

  if (typeof faqs !== 'object') return null;

  const data = faqs as Record<string, unknown>;
  if (data.enabled === false) return null;

  const items =
    (data.items as FaqSectionData['items'] | undefined)?.filter(
      (item) => item?.question || item?.answer
    ) ?? [];

  if (!data.title && !data.heading && !data.description && !data.subtitle && items.length === 0) {
    return null;
  }

  return {
    enabled: true,
    title: (data.title ?? data.heading) as FaqSectionData['title'],
    description: (data.description ?? data.subtitle) as FaqSectionData['description'],
    subtitle: data.subtitle as FaqSectionData['subtitle'],
    items,
  };
}

/** Service area FAQs — same layout as home FAQSection. */
export const FAQs: React.FC<FAQsProps> = ({ faqs, className }) => {
  const faqSection = normalizeFaqSection(faqs);
  if (!faqSection) return null;

  const hasContent =
    Boolean(tiptapToText(faqSection.title).trim()) ||
    Boolean(tiptapToText(faqSection.description).trim()) ||
    (faqSection.items?.length ?? 0) > 0;

  if (!hasContent) return null;

  return <FAQSection faqSection={faqSection} className={className} />;
};

export default FAQs;
