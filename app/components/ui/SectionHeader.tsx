'use client';

import { TiptapRenderer } from '@/app/components/ui/TiptapRenderer';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import { tiptapToText } from '@/app/lib/seo';
import { cn, TIPTAP_INHERIT } from '@/app/lib/utils';

interface SectionHeaderProps {
  title?: unknown;
  description?: unknown;
  eyebrow?: string;
  align?: 'left' | 'center';
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  scrollReveal?: boolean;
}

export function SectionHeader({
  title,
  description,
  eyebrow,
  align = 'left',
  className,
  titleClassName,
  descriptionClassName,
  scrollReveal,
}: SectionHeaderProps) {
  const { colors, fonts, layout } = useSectionTheme();

  const titleText = tiptapToText(title).trim();
  const descriptionText = tiptapToText(description).trim();

  if (!titleText && !descriptionText && !eyebrow) return null;

  return (
    <header
      {...(scrollReveal ? { 'data-scroll-reveal': true } : {})}
      className={cn(
        align === 'center' ? layout.headerCenterClass : layout.headerClass,
        className
      )}
    >
      {eyebrow ? (
        <div
          className={cn(
            'mb-2 flex items-center gap-3',
            align === 'center' && 'justify-center'
          )}
        >
          <span className="h-px w-8 shrink-0" style={layout.eyebrowLine} aria-hidden />
          <span className={layout.eyebrowClass} style={layout.eyebrow}>
            {eyebrow}
          </span>
          {align === 'center' ? (
            <span className="h-px w-8 shrink-0" style={layout.eyebrowLine} aria-hidden />
          ) : null}
        </div>
      ) : null}
      {titleText ? (
        <h2
          className={cn(layout.titleClass, titleClassName)}
          style={{ ...layout.title, fontFamily: fonts.heading }}
        >
          {title && typeof title === 'object' ? (
            <TiptapRenderer content={title} as="inline" className={TIPTAP_INHERIT} />
          ) : (
            titleText
          )}
        </h2>
      ) : null}
      {descriptionText ? (
        <p
          className={cn(layout.descriptionClass, titleText && 'mt-2', descriptionClassName)}
          style={{ ...layout.description, fontFamily: fonts.body }}
        >
          {description && typeof description === 'object' ? (
            <TiptapRenderer content={description} as="inline" className={TIPTAP_INHERIT} />
          ) : (
            descriptionText
          )}
        </p>
      ) : null}
    </header>
  );
}

export default SectionHeader;
