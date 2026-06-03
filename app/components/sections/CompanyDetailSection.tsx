'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Page } from '@/app/lib/types';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { getPageHref } from '@/app/lib/siteContent';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import { cn, getImageSrc } from '@/app/lib/utils';
import { tiptapToText } from '@/app/lib/seo';
import { SectionEditorialTitle } from '@/app/components/sections/SectionEditorialHeader';
import { OptimizedImage, IMAGE_SIZES } from '@/app/components/ui/OptimizedImage';

gsap.registerPlugin(ScrollTrigger);

interface CompanyDetailSectionProps {
  companyDetailSection?: Page['companyDetailSection'];
  className?: string;
}

type CompanyDetailSectionInput = NonNullable<Page['companyDetailSection']> & {
  heading?: unknown;
  subtitle?: unknown;
  primaryButton?: { label?: string; href?: string };
  cta?: { label?: string; href?: string };
};

type DetailBlock = {
  heading: string;
  description: string;
  imageUrl?: string;
  imageAlt: string;
};

type CollageImage = { url: string; alt: string };

/** Bento slots for up to 4 images (reference collage). */
const COLLAGE_SLOTS = [
  'col-span-6 row-span-2 row-start-1 min-h-[7rem]',
  'col-span-6 row-span-4 row-start-3 min-h-[11rem]',
  'col-span-6 row-span-5 col-start-7 row-start-1 min-h-[14rem]',
  'col-span-6 row-span-2 col-start-7 row-start-6 min-h-[7rem]',
] as const;

function pickSectionField(
  section: CompanyDetailSectionInput | undefined,
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

function normalizeDetailBlocks(
  companyDetailSection?: Page['companyDetailSection']
): DetailBlock[] {
  if (!companyDetailSection?.details?.length) return [];

  const blocks: DetailBlock[] = [];

  companyDetailSection.details.forEach((detail, index) => {
    const heading = tiptapToText(detail.title) || detail.label?.trim() || '';
    const description =
      tiptapToText(detail.description) ||
      (!detail.title && !detail.description ? tiptapToText(detail.value) : '');
    const imageUrl = detail.image?.url ? getImageSrc(detail.image.url) : undefined;
    const imageAlt =
      detail.image?.altText?.trim() || heading || `Company detail ${index + 1}`;

    if (!heading && !description && !imageUrl) return;

    blocks.push({ heading, description, imageUrl, imageAlt });
  });

  return blocks;
}

function collectCollageImages(blocks: DetailBlock[]): CollageImage[] {
  const seen = new Set<string>();
  const images: CollageImage[] = [];

  for (const block of blocks) {
    if (!block.imageUrl || seen.has(block.imageUrl)) continue;
    seen.add(block.imageUrl);
    images.push({ url: block.imageUrl, alt: block.imageAlt });
    if (images.length >= 4) break;
  }

  return images;
}

function CompanyCollage({ images }: { images: CollageImage[] }) {
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="relative min-h-[20rem] overflow-hidden rounded-lg sm:min-h-[24rem]">
        <OptimizedImage
          src={images[0].url}
          alt={images[0].alt}
          fill
          sizes={IMAGE_SIZES.sectionHalf}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="grid min-h-[22rem] grid-cols-12 grid-rows-7 gap-3 sm:min-h-[28rem] lg:min-h-[32rem]">
      {images.map((image, index) => (
        <div
          key={image.url}
          className={cn(
            'relative overflow-hidden rounded-lg',
            COLLAGE_SLOTS[index] ?? 'col-span-6 row-span-2'
          )}
        >
          <OptimizedImage
            src={image.url}
            alt={image.alt}
            fill
            sizes={IMAGE_SIZES.card}
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}

export function CompanyDetailSection({
  companyDetailSection,
  className,
}: CompanyDetailSectionProps) {
  const { pages } = useWebBuilder();
  const { colors, fonts, layout } = useSectionTheme();
  const containerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const sectionInput = companyDetailSection as CompanyDetailSectionInput | undefined;
  const sectionTitle = pickSectionField(sectionInput, 'title');

  const description = useMemo(
    () => tiptapToText(pickSectionField(sectionInput, 'description')).trim(),
    [sectionInput]
  );

  const sections = useMemo(
    () => normalizeDetailBlocks(companyDetailSection),
    [companyDetailSection]
  );

  const collageImages = useMemo(() => collectCollageImages(sections), [sections]);

  const cta = useMemo(() => {
    const btn = sectionInput?.primaryButton ?? sectionInput?.cta;
    if (btn?.label?.trim()) {
      return {
        label: btn.label.trim(),
        href: normalizeHref(btn.href?.trim() || '/about-us'),
      };
    }
    const aboutPage = pages?.find((p) => p.pageType === 'about' && p.status === 'published');
    if (aboutPage) {
      return {
        label: 'Learn more',
        href: getPageHref(aboutPage),
      };
    }
    return { label: 'Learn more', href: '/about-us' };
  }, [sectionInput, pages]);

  const ctaIsExternal =
    cta.href.startsWith('http') ||
    cta.href.startsWith('mailto:') ||
    cta.href.startsWith('tel:');

  const hasTitle = Boolean(tiptapToText(sectionTitle).trim());
  const gridItems = sections.filter((s) => s.heading || s.description);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const items = contentRef.current?.querySelectorAll('.company-detail-item');
      if (items?.length) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.1,
            scrollTrigger: {
              trigger: contentRef.current,
              start: 'top 85%',
              once: true,
            },
          }
        );
      }
    }, containerRef);
    return () => ctx.revert();
  }, [gridItems.length, collageImages.length]);

  if (!companyDetailSection || companyDetailSection.enabled === false) return null;
  if (!hasTitle && !description && gridItems.length === 0) return null;

  const ctaButtonClass =
    'inline-flex shrink-0 items-center justify-center rounded-md px-8 py-3.5 text-sm font-semibold shadow-lg transition-opacity hover:opacity-90';

  const CtaButton = ctaIsExternal ? (
    <a
      href={cta.href}
      className={ctaButtonClass}
      style={{
        backgroundColor: colors.cardBackground,
        color: colors.mainText,
        fontFamily: fonts.body,
      }}
    >
      {cta.label}
    </a>
  ) : (
    <Link
      href={cta.href}
      className={cn(ctaButtonClass, 'no-underline')}
      style={{
        backgroundColor: colors.cardBackground,
        color: colors.mainText,
        fontFamily: fonts.body,
      }}
    >
      {cta.label}
    </Link>
  );

  return (
    <section
      ref={containerRef}
      id="company"
      className={cn('relative overflow-hidden', layout.sectionClass, className)}
      style={{ backgroundColor: colors.pageBackground, fontFamily: fonts.body }}
    >
      <div className="container mx-auto max-w-6xl px-6">
        {/* Top: title + description | CTA */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div className={layout.headerClass}>
            {hasTitle ? (
              <h2
                className={layout.titleClass}
                style={{ ...layout.title, fontFamily: fonts.heading }}
              >
                <SectionEditorialTitle content={sectionTitle} colors={colors} />
              </h2>
            ) : null}
            {description ? (
              <p
                className={cn(layout.descriptionClass, 'mt-2 max-w-lg')}
                style={{ ...layout.description, fontFamily: fonts.body }}
              >
                {description}
              </p>
            ) : null}
          </div>

          <div className="lg:pt-2">{CtaButton}</div>
        </div>

        {/* Bottom: numbered grid | image collage */}
        {gridItems.length > 0 || collageImages.length > 0 ? (
          <div
            ref={contentRef}
            className={cn(
              'grid items-start gap-10 lg:gap-14',
              collageImages.length > 0 ? 'lg:grid-cols-2' : 'grid-cols-1'
            )}
          >
            {gridItems.length > 0 ? (
              <div
                className={cn(
                  'grid gap-x-10 gap-y-12',
                  gridItems.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1'
                )}
              >
                {gridItems.map((block, index) => (
                  <article key={`${block.heading}-${index}`} className="company-detail-item">
                    <p
                      className="text-4xl font-bold leading-none sm:text-5xl"
                      style={{ color: colors.mainText, fontFamily: fonts.heading }}
                    >
                      {index + 1}.
                    </p>
                    {block.heading ? (
                      <h3
                        className="mt-4 text-base font-bold sm:text-lg"
                        style={{ color: colors.mainText, fontFamily: fonts.body }}
                      >
                        {block.heading}
                      </h3>
                    ) : null}
                    {block.description ? (
                      <p
                        className="mt-3 text-sm leading-relaxed"
                        style={{ color: colors.secondaryText }}
                      >
                        {block.description}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : null}

            {collageImages.length > 0 ? (
              <div className="company-detail-item">
                <CompanyCollage images={collageImages} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default CompanyDetailSection;
