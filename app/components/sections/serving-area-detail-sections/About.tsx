'use client';

import { useMemo } from 'react';
import type { Page } from '@/app/lib/types';
import { AboutSection } from '@/app/components/sections/AboutSection';

interface AboutProps {
  about: unknown;
  className?: string;
}

type AboutSectionData = NonNullable<Page['aboutSection']> & {
  heading?: unknown;
  subtitle?: unknown;
  primaryButton?: { label?: string; href?: string };
  primaryCta?: { label?: string; href?: string };
};

function normalizeImage(raw: unknown): AboutSectionData['image'] | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'string' && raw.trim()) return { url: raw.trim() };
  if (typeof raw === 'object' && raw !== null && 'url' in raw) {
    const record = raw as { url?: string; altText?: string };
    if (record.url?.trim()) return { url: record.url.trim(), altText: record.altText };
  }
  return undefined;
}

function normalizeHref(href: string): string {
  const t = href.trim();
  if (t.startsWith('http') || t.startsWith('mailto:') || t.startsWith('tel:')) return t;
  return t.startsWith('/') ? t : `/${t}`;
}

function resolvePrimaryButton(data: Record<string, unknown>): AboutSectionData['primaryButton'] {
  const primary = data.primaryCta as { label?: string; href?: string } | undefined;
  if (primary?.label?.trim()) {
    return { label: primary.label.trim(), href: normalizeHref(primary.href?.trim() || '/contact-us') };
  }

  const primaryButton = data.primaryButton as { label?: string; href?: string } | undefined;
  if (primaryButton?.label?.trim()) {
    return {
      label: primaryButton.label.trim(),
      href: normalizeHref(primaryButton.href?.trim() || '/contact-us'),
    };
  }

  const legacy = data.ctaButton as { text?: string; url?: string; label?: string; href?: string };
  const label = legacy?.text?.trim() || legacy?.label?.trim();
  if (label) {
    return {
      label,
      href: normalizeHref(legacy?.url?.trim() || legacy?.href?.trim() || '/contact-us'),
    };
  }

  const button = data.button as { label?: string; text?: string; href?: string; url?: string };
  const buttonLabel = button?.label?.trim() || button?.text?.trim();
  if (buttonLabel) {
    return {
      label: buttonLabel,
      href: normalizeHref(button?.href?.trim() || button?.url?.trim() || '/contact-us'),
    };
  }

  return undefined;
}

function normalizeAboutSection(about: unknown): AboutSectionData | null {
  if (!about || typeof about !== 'object') return null;

  const data = about as Record<string, unknown>;
  if (data.enabled === false) return null;

  const features = Array.isArray(data.features)
    ? (data.features as AboutSectionData['features']).filter((f) => f?.label?.trim())
    : [];

  const title = (data.title ?? data.heading) as AboutSectionData['title'];
  const description = (data.description ?? data.subtitle) as AboutSectionData['description'];
  const image = normalizeImage(data.image);
  const primaryButton = resolvePrimaryButton(data);

  if (!title && !description && !image && features.length === 0 && !primaryButton) return null;

  return {
    enabled: true,
    title,
    subtitle: data.subtitle,
    description,
    features,
    image,
    primaryButton,
  };
}

/** Service area about — same layout as home AboutSection. */
export const About: React.FC<AboutProps> = ({ about, className }) => {
  const aboutSection = useMemo(() => normalizeAboutSection(about), [about]);
  if (!aboutSection) return null;

  return <AboutSection aboutSection={aboutSection} className={className} />;
};

export default About;
