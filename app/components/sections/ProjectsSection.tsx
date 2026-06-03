'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  ChevronRight,
} from 'lucide-react';
import { OptimizedImage, IMAGE_SIZES } from '@/app/components/ui/OptimizedImage';
import type { Page, Project } from '@/app/lib/types';
import { TiptapRenderer } from '@/app/components/ui/TiptapRenderer';
import { cn, getImageSrc, TIPTAP_INHERIT } from '@/app/lib/utils';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import { tiptapToText } from '@/app/lib/seo';

interface ProjectsSectionProps {
  projectSection?: Page['projectSection'];
  projectsSection?: Page['projectsSection'];
  className?: string;
  projectsLimit?: number;
}

type ManualProject = NonNullable<NonNullable<Page['projectsSection']>['projects']>[number];
type DisplayItem = Project | ManualProject;

type ProjectsSectionInput = NonNullable<Page['projectsSection']> & {
  heading?: unknown;
  subtitle?: unknown;
};

type ProjectSectionInput = NonNullable<Page['projectSection']> & {
  heading?: unknown;
  subtitle?: unknown;
};

function pickSectionField(
  section: ProjectsSectionInput | ProjectSectionInput | undefined,
  primary: 'title' | 'description'
): unknown {
  if (!section) return undefined;
  const alt = primary === 'title' ? section.heading : section.subtitle;
  const value = section[primary] ?? alt;
  if (value == null || value === '') return undefined;
  return value;
}

/**
 * Editorial Social Icon mapping based on image_a4c4b0.jpg
 */
function SocialIcon({ platform }: { platform: string }) {
  const iconClass = "h-3.5 w-3.5 transition-opacity hover:opacity-60";
  const key = platform.toLowerCase();
  if (key.includes('facebook')) return <Facebook className={iconClass} />;
  if (key.includes('instagram')) return <Instagram className={iconClass} />;
  if (key.includes('linkedin')) return <Linkedin className={iconClass} />;
  if (key.includes('twitter') || key.includes('x')) return <Twitter className={iconClass} />;
  return null;
}

export function ProjectsSection({
  projectSection,
  projectsSection,
  className,
  projectsLimit,
}: ProjectsSectionProps) {
  const { projects, site } = useWebBuilder();
  const { colors, fonts, layout } = useSectionTheme();

  const titleContent = useMemo(
    () =>
      pickSectionField(projectsSection as ProjectsSectionInput | undefined, 'title') ??
      pickSectionField(projectSection as ProjectSectionInput | undefined, 'title'),
    [projectsSection, projectSection]
  );

  const descriptionContent = useMemo(
    () =>
      pickSectionField(projectsSection as ProjectsSectionInput | undefined, 'description') ??
      pickSectionField(projectSection as ProjectSectionInput | undefined, 'description'),
    [projectsSection, projectSection]
  );

  const titleText = useMemo(() => tiptapToText(titleContent).trim(), [titleContent]);
  const descriptionText = useMemo(
    () => tiptapToText(descriptionContent).trim(),
    [descriptionContent]
  );

  const displayItems = useMemo(() => {
    const manual = projectsSection?.projects ?? [];
    const fromApi = (projects ?? []).filter((p) => p.status === 'published');
    const ids = projectsSection?.projectIds;

    let items: DisplayItem[] = manual.length > 0 ? manual : fromApi;
    if (ids?.length && manual.length === 0) {
      items = ids
        .map((id) => fromApi.find((p) => p._id === id))
        .filter((p): p is Project => Boolean(p));
    }

    return projectsLimit ? items.slice(0, projectsLimit) : items;
  }, [projects, projectsSection, projectsLimit]);

  const socialLinks = useMemo(
    () => (site?.socialLinks ?? []).filter((link) => link?.url),
    [site?.socialLinks]
  );

  const isEnabled =
    projectsSection?.enabled !== false && projectSection?.enabled !== false;

  const hasContent =
    Boolean(titleText) || Boolean(descriptionText) || displayItems.length > 0;

  if (!isEnabled) return null;
  if ((projectsSection || projectSection) && !hasContent) return null;
  if (displayItems.length === 0 && !titleText && !descriptionText) return null;

  const hasHeader = Boolean(titleText) || Boolean(descriptionText);

  return (
    <section
      id="projects"
      className={cn(layout.sectionClass, className)}
      style={{ backgroundColor: colors.pageBackground, fontFamily: fonts.body }}
    >
      <div className="container mx-auto max-w-6xl px-6">
        {hasHeader ? (
          <header data-scroll-reveal className={layout.headerClass}>
            {titleText ? (
              <h2
                className={layout.titleClass}
                style={{ ...layout.title, fontFamily: fonts.heading }}
              >
                {titleContent && typeof titleContent === 'object' ? (
                  <TiptapRenderer content={titleContent} as="inline" className={TIPTAP_INHERIT} />
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
                {descriptionContent && typeof descriptionContent === 'object' ? (
                  <TiptapRenderer
                    content={descriptionContent}
                    as="inline"
                    className={TIPTAP_INHERIT}
                  />
                ) : (
                  descriptionText
                )}
              </p>
            ) : null}
          </header>
        ) : null}

        {displayItems.length > 0 ? (
        <div className="flex flex-col gap-16 lg:gap-24">
          {displayItems.map((item, index) => {
            const isEven = index % 2 === 0;
            const title = isProjectEntity(item) ? item.title : tiptapToText(item.title);
            const description = isProjectEntity(item) ? item.shortDescription || item.description : item.description;
            const category = isProjectEntity(item) ? item.category : 'Portfolio';
            const dateRaw = isProjectEntity(item)
              ? item.date || item.publishedAt || item.createdAt
              : undefined;
            const date = dateRaw
              ? new Date(dateRaw).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : null;
            const imageUrl = projectImages(item)[0];
            const href = projectHref(item);

            return (
              <div 
                key={isProjectEntity(item) ? item._id : index}
                className={cn(
                  "flex flex-col items-center gap-8 lg:flex-row lg:gap-16",
                  !isEven && "lg:flex-row-reverse"
                )}
              >
                {/* Content Block - Styled like image_a4c4b0.jpg */}
                <div className="w-full lg:w-1/2">
                  <div 
                    className="flex flex-col items-center p-8 text-center sm:p-12"
                    style={{ 
                      border: `1px solid color-mix(in srgb, ${colors.mainText} 10%, transparent)`,
                      backgroundColor: colors.cardBackground 
                    }}
                  >
                    <header className="mb-4">
                      <p 
                        className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-60"
                        style={{ color: colors.secondaryText }}
                      >
                        {category}
                        {date ? (
                          <>
                            <span className="mx-2">/</span> {date}
                          </>
                        ) : null}
                      </p>
                      <h3 
                        className="mt-3 text-2xl font-black uppercase leading-tight tracking-tighter sm:text-3xl"
                        style={{ color: colors.mainText, fontFamily: fonts.heading }}
                      >
                        {title}
                      </h3>
                    </header>

                    <div 
                      className="mb-8 line-clamp-4 text-sm leading-relaxed opacity-80"
                      style={{ color: colors.secondaryText }}
                    >
                      {typeof description === 'string' ? (
                        description
                      ) : (
                        <TiptapRenderer content={description} as="inline" />
                      )}
                    </div>

                    <div className="flex flex-col items-center gap-6">
                      <Link
                        href={href}
                        className="group relative inline-block text-[11px] font-black uppercase tracking-[0.4em] transition-all"
                        style={{ color: colors.mainText }}
                      >
                        Read More
                        <span 
                          className="absolute -bottom-1 left-0 h-[1px] w-full origin-left scale-x-0 transition-transform group-hover:scale-x-100"
                          style={{ backgroundColor: colors.primaryButton }}
                        />
                      </Link>

                      {/* Editorial Social Sharing Bar */}
                      <div className="flex items-center gap-4 border-t pt-4" style={{ borderColor: `color-mix(in srgb, ${colors.mainText} 10%, transparent)` }}>
                        {socialLinks.slice(0, 4).map((link, idx) => (
                          <a key={idx} href={link.url} target="_blank" rel="noreferrer" style={{ color: colors.mainText }}>
                            <SocialIcon platform={link.platform} />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Image Block */}
                <div className="w-full lg:w-1/2">
                  <Link href={href} className="group block overflow-hidden">
                    <div className="relative aspect-[4/3] w-full overflow-hidden shadow-sm transition-shadow group-hover:shadow-xl">
                      {imageUrl ? (
                        <OptimizedImage
                          src={imageUrl}
                          alt={title}
                          fill
                          sizes={IMAGE_SIZES.sectionHalf}
                          className="object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-neutral-100" />
                      )}
                    </div>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        ) : null}
      </div>
    </section>
  );
}

// --- Helper Functions ---

function isProjectEntity(p: DisplayItem): p is Project {
  return typeof (p as Project)._id === 'string';
}

function projectHref(p: DisplayItem): string {
  if (isProjectEntity(p)) return `/project-detail/${p.slug}`;
  return (p as ManualProject).href || '#';
}

function projectImages(p: DisplayItem): string[] {
  const urls: string[] = [];
  if (isProjectEntity(p)) {
    if (p.featuredImage?.url) urls.push(getImageSrc(p.featuredImage.url));
  } else {
    if ((p as ManualProject).image?.url) urls.push(getImageSrc((p as ManualProject).image!.url));
  }
  return urls;
}