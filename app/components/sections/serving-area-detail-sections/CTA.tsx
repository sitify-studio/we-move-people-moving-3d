'use client';

import React from 'react';
import type { Page } from '@/app/lib/types';
import { getImageSrc, resolveMediaUrl } from '@/app/lib/utils';
import { CTASection } from '@/app/components/sections/CTASection';

interface CTAProps {
  cta: unknown;
  className?: string;
}

type CtaSectionData = NonNullable<Page['ctaSection']>;
type NormalizedCta = CtaSectionData & { subtitle?: unknown };

function resolveBackgroundImage(cta: Record<string, unknown>): string | undefined {
  const candidates = [
    cta.backgroundImage,
    cta.image,
    cta.background,
    cta.bgImage,
    cta.media,
    Array.isArray(cta.mediaItems) ? cta.mediaItems[0] : undefined,
  ];

  for (const raw of candidates) {
    const url = resolveMediaUrl(raw);
    if (url) return getImageSrc(url);
  }

  return undefined;
}

function resolvePrimaryButton(cta: Record<string, unknown>): CtaSectionData['primaryButton'] | undefined {
  const primary = cta.primaryButton as { label?: string; href?: string } | undefined;
  if (primary?.label?.trim()) {
    return {
      label: primary.label.trim(),
      href: primary.href?.trim() || '/',
    };
  }

  const legacy = cta.ctaButton as { text?: string; url?: string; label?: string; href?: string } | undefined;
  const label = legacy?.text?.trim() || legacy?.label?.trim();
  if (label) {
    return {
      label,
      href: legacy?.url?.trim() || legacy?.href?.trim() || '/contact-us',
    };
  }

  const buttonText = typeof cta.buttonText === 'string' ? cta.buttonText.trim() : '';
  const buttonUrl = typeof cta.buttonUrl === 'string' ? cta.buttonUrl.trim() : '';
  if (buttonText) {
    return { label: buttonText, href: buttonUrl || '/contact-us' };
  }

  return undefined;
}

function normalizeCtaSection(cta: unknown): NormalizedCta | null {
  if (!cta || typeof cta !== 'object') return null;

  const data = cta as Record<string, unknown>;
  if (data.enabled === false) return null;

  const primaryButton = resolvePrimaryButton(data);
  const backgroundImage = resolveBackgroundImage(data);
  const title = data.title;
  const description = data.description;
  const subtitle = data.subtitle ?? data.label;

  if (!title && !description && !primaryButton && !subtitle && !backgroundImage) return null;

  const section: NormalizedCta = {
    enabled: true,
    title: title as CtaSectionData['title'],
    description: description as CtaSectionData['description'],
    primaryButton,
    backgroundImage,
    backgroundColor:
      typeof data.backgroundColor === 'string' ? data.backgroundColor.trim() : undefined,
  };

  if (subtitle) section.subtitle = subtitle;

  return section;
}

/** Service area CTA — same cinematic layout as site CTASection. */
export const CTA: React.FC<CTAProps> = ({ cta, className }) => {
  const ctaSection = normalizeCtaSection(cta);
  if (!ctaSection) return null;

  return <CTASection ctaSection={ctaSection} className={className} />;
};

export default CTA;
