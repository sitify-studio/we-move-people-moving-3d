'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { OptimizedImage, IMAGE_SIZES } from '@/app/components/ui/OptimizedImage';
import type { Page } from '@/app/lib/types';
import { TiptapRenderer } from '@/app/components/ui/TiptapRenderer';
import { getImageSrc, cn, TIPTAP_INHERIT } from '@/app/lib/utils';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import { CardLoader } from '@/app/components/ui/SkeletonLoader';
import { tiptapToText } from '@/app/lib/seo';
import { getPageHref } from '@/app/lib/siteContent';

interface BlogSectionProps {
  blogSection?: Page['blogSection'];
  className?: string;
}

type BlogSectionInput = NonNullable<Page['blogSection']> & {
  heading?: unknown;
  subtitle?: unknown;
};

type BlogPost = {
  _id: string;
  slug: string;
  title?: string;
  category?: string;
  excerpt?: unknown;
  publishedAt?: string;
  createdAt?: string;
  featuredImage?: unknown;
  seo?: { ogImageUrl?: string };
};

function pickSectionField(
  section: BlogSectionInput | undefined,
  primary: 'title' | 'description'
): unknown {
  if (!section) return undefined;
  const alt = primary === 'title' ? section.heading : section.subtitle;
  const value = section[primary] ?? alt;
  if (value == null || value === '') return undefined;
  return value;
}

function formatPostDate(iso: string | undefined): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

function getPostImageSrc(post: BlogPost): string {
  const img = post?.featuredImage;
  let raw: string | undefined;
  if (typeof img === 'string' && img.trim()) raw = img;
  else if (img && typeof img === 'object' && (img as { url?: string }).url) {
    raw = (img as { url: string }).url;
  } else if (post?.seo?.ogImageUrl) raw = post.seo.ogImageUrl;
  return raw ? getImageSrc(raw) : '';
}

function BlogCard({
  post,
  showExcerpt,
  showDate,
}: {
  post: BlogPost;
  showExcerpt: boolean;
  showDate: boolean;
}) {
  const { colors, fonts, styles, layout } = useSectionTheme();
  const imgSrc = getPostImageSrc(post);
  const dateLabel = formatPostDate(post.publishedAt || post.createdAt);

  return (
    <article
      className="group relative flex h-full min-w-[300px] max-w-[520px] shrink-0 flex-col overflow-hidden rounded-[24px] border transition-all duration-300 hover:shadow-xl sm:min-w-[420px] sm:flex-row"
      style={{
        ...styles.cardSolid,
        fontFamily: fonts.body,
      }}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="flex h-full w-full flex-col no-underline sm:flex-row"
        aria-label={post.title?.trim() || 'View article'}
      >
        <div
          className="relative aspect-video w-full overflow-hidden sm:aspect-auto sm:w-[42%]"
          style={styles.imagePlaceholder}
        >
          {imgSrc ? (
            <OptimizedImage
              src={imgSrc}
              alt={post.title || ''}
              fill
              sizes={IMAGE_SIZES.gridThird}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : null}
        </div>

        <div className="flex flex-1 flex-col justify-between gap-4 p-6 lg:p-7">
          <div>
            {(showDate && dateLabel) || post.category ? (
              <p
                className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: colors.primaryButton }}
              >
                {post.category}
                {showDate && dateLabel ? (
                  <span style={{ color: colors.secondaryText }}>
                    {post.category ? ' · ' : ''}
                    {dateLabel}
                  </span>
                ) : null}
              </p>
            ) : null}
            {post.title ? (
              <h3
                className="text-lg font-bold leading-tight tracking-tight lg:text-xl"
                style={{ color: colors.mainText, fontFamily: fonts.heading }}
              >
                {post.title}
              </h3>
            ) : null}
            {showExcerpt && post.excerpt ? (
              <div
                className="mt-3 line-clamp-3 text-sm leading-relaxed"
                style={{ color: colors.secondaryText }}
              >
                <TiptapRenderer content={post.excerpt} as="inline" className={TIPTAP_INHERIT} />
              </div>
            ) : null}
          </div>

          <span
            className="inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wide"
            style={{ ...styles.primaryCta, fontFamily: fonts.body }}
          >
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </Link>
    </article>
  );
}

export function BlogSection({ blogSection, className }: BlogSectionProps) {
  const { colors, fonts, styles, layout } = useSectionTheme();
  const { blogPosts, loading, pages } = useWebBuilder();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  const sectionInput = useMemo(() => {
    const fallback = pages.find((p) => p.pageType === 'blog-list')?.blogSection as
      | BlogSectionInput
      | undefined;
    const current = blogSection as BlogSectionInput | undefined;
    if (!current && !fallback) return undefined;

    const titleContent =
      pickSectionField(current, 'title') ?? pickSectionField(fallback, 'title');
    const descriptionContent =
      pickSectionField(current, 'description') ?? pickSectionField(fallback, 'description');

    return {
      enabled: current?.enabled ?? fallback?.enabled ?? false,
      postsToShow: current?.postsToShow ?? fallback?.postsToShow ?? 6,
      showExcerpt: current?.showExcerpt ?? fallback?.showExcerpt ?? true,
      showDate: current?.showDate ?? fallback?.showDate ?? true,
      titleContent,
      descriptionContent,
    };
  }, [blogSection, pages]);

  const titleText = useMemo(
    () => tiptapToText(sectionInput?.titleContent).trim(),
    [sectionInput?.titleContent]
  );
  const descriptionText = useMemo(
    () => tiptapToText(sectionInput?.descriptionContent).trim(),
    [sectionInput?.descriptionContent]
  );

  const blogListPage = useMemo(
    () => pages.find((p) => p.pageType === 'blog-list' && p.status === 'published'),
    [pages]
  );
  const viewAllHref = blogListPage ? getPageHref(blogListPage) : '/blog';
  const viewAllLabel = blogListPage?.name?.trim() || '';

  const displayPosts = useMemo(() => {
    if (!sectionInput?.enabled || !blogPosts?.length) return [];
    return blogPosts.slice(0, sectionInput.postsToShow) as BlogPost[];
  }, [sectionInput, blogPosts]);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScroll({
      left: scrollLeft > 4,
      right: scrollLeft + clientWidth < scrollWidth - 10,
    });
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [displayPosts.length, loading]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const move = direction === 'left' ? -el.clientWidth * 0.75 : el.clientWidth * 0.75;
    el.scrollBy({ left: move, behavior: 'smooth' });
  };

  const hasContent =
    Boolean(titleText) || Boolean(descriptionText) || displayPosts.length > 0;

  if (!sectionInput?.enabled) return null;
  if ((blogSection || sectionInput) && !hasContent) return null;

  const hasHeader = Boolean(titleText) || Boolean(descriptionText) || viewAllLabel;

  return (
    <section
      id="blog"
      className={cn('relative py-6 lg:py-8', className)}
      style={{ backgroundColor: colors.pageBackground, fontFamily: fonts.body }}
    >
      <div className="container mx-auto max-w-6xl px-6">
        {hasHeader ? (
          <header
            data-scroll-reveal
            className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div className="max-w-2xl">
              {titleText ? (
                <h2
                  className={layout.titleClass}
                  style={{ ...layout.title, fontFamily: fonts.heading }}
                >
                  {sectionInput?.titleContent && typeof sectionInput.titleContent === 'object' ? (
                    <TiptapRenderer
                      content={sectionInput.titleContent}
                      as="inline"
                      className={TIPTAP_INHERIT}
                    />
                  ) : (
                    titleText
                  )}
                </h2>
              ) : null}
              {descriptionText ? (
                <p
                  className={cn(layout.descriptionClass, 'mt-2')}
                  style={{ ...layout.description, fontFamily: fonts.body }}
                >
                  {sectionInput?.descriptionContent &&
                  typeof sectionInput.descriptionContent === 'object' ? (
                    <TiptapRenderer
                      content={sectionInput.descriptionContent}
                      as="inline"
                      className={TIPTAP_INHERIT}
                    />
                  ) : (
                    descriptionText
                  )}
                </p>
              ) : null}
            </div>
            {viewAllLabel && displayPosts.length > 0 ? (
              <Link
                href={viewAllHref}
                className="group inline-flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] no-underline transition-opacity hover:opacity-70"
                style={{ color: colors.primaryButton, fontFamily: fonts.body }}
              >
                {viewAllLabel}
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            ) : null}
          </header>
        ) : null}

        {loading ? (
          <div className="flex gap-5 overflow-hidden">
            <CardLoader className="h-56 min-w-[300px] shrink-0 sm:min-w-[420px]" />
            <CardLoader className="h-56 min-w-[300px] shrink-0 sm:min-w-[420px]" />
          </div>
        ) : displayPosts.length > 0 ? (
          <div className="group/scroll relative" data-scroll-reveal>
            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex gap-5 overflow-x-auto pb-4 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {displayPosts.map((post) => (
                <BlogCard
                  key={post._id}
                  post={post}
                  showExcerpt={sectionInput.showExcerpt}
                  showDate={sectionInput.showDate}
                />
              ))}
            </div>

            {displayPosts.length > 1 ? (
              <>
                {canScroll.left ? (
                  <button
                    type="button"
                    onClick={() => scroll('left')}
                    className="absolute -left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg transition-transform hover:scale-105 active:scale-95 sm:-left-4"
                    style={{
                      borderColor: `color-mix(in srgb, ${colors.primaryButton} 35%, transparent)`,
                      backgroundColor: colors.cardBackground,
                      color: colors.primaryButton,
                    }}
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden />
                  </button>
                ) : null}
                {canScroll.right ? (
                  <button
                    type="button"
                    onClick={() => scroll('right')}
                    className="absolute -right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg transition-transform hover:scale-105 active:scale-95 sm:-right-4"
                    style={{
                      borderColor: `color-mix(in srgb, ${colors.primaryButton} 35%, transparent)`,
                      backgroundColor: colors.cardBackground,
                      color: colors.primaryButton,
                    }}
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden />
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default BlogSection;
