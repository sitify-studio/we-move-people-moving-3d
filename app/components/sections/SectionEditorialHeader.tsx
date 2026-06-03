'use client';

import { useMemo } from 'react';
import { tiptapToText } from '@/app/lib/seo';
import { cn } from '@/app/lib/utils';
import {
  hasEditorialTitleContent,
  parseEditorialHeroLines,
} from '@/app/components/sections/EditorialHeroTypography';
import type { ThemeColors } from '@/app/hooks/useTheme';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';

export function SectionEditorialTitle({
  content,
  colors,
}: {
  content: unknown;
  colors: ThemeColors;
}) {
  const lines = useMemo(() => parseEditorialHeroLines(content), [content]);
  const line = lines[0];

  if (line?.segments.length) {
    return (
      <>
        {line.segments.map((segment, index) => (
          <span
            key={index}
            className={cn(segment.kind === 'script' && 'italic')}
            style={{
              color: segment.kind === 'script' ? colors.primaryButton : colors.mainText,
            }}
          >
            {segment.text}
            {index < line.segments.length - 1 ? ' ' : null}
          </span>
        ))}
      </>
    );
  }

  const text = tiptapToText(content).trim();
  if (text) {
    const words = text.split(/\s+/);
    if (words.length >= 2) {
      const last = words.pop();
      return (
        <>
          <span style={{ color: colors.mainText }}>{words.join(' ')} </span>
          <span style={{ color: colors.primaryButton }}>{last}</span>
        </>
      );
    }
    return <span style={{ color: colors.mainText }}>{text}</span>;
  }

  return null;
}

export function SectionEditorialHeader({
  eyebrow,
  title,
  description,
  colors,
  fonts,
  align = 'center',
  className,
  headerRef,
}: {
  eyebrow?: string;
  title?: unknown;
  description?: string;
  colors: ThemeColors;
  fonts: { heading: string; body: string };
  align?: 'center' | 'left';
  className?: string;
  headerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const { layout } = useSectionTheme();
  const hasTitle = hasEditorialTitleContent(title);
  const centered = align === 'center';

  if (!eyebrow && !hasTitle && !description) return null;

  return (
    <div
      ref={headerRef}
      className={cn(
        centered ? layout.headerCenterClass : layout.headerClass,
        centered && 'text-center',
        className
      )}
    >
      {eyebrow ? (
        <div className={cn('mb-2 flex items-center gap-3', centered && 'justify-center')}>
          <span className="h-px w-8 shrink-0" style={layout.eyebrowLine} aria-hidden />
          <span className={layout.eyebrowClass} style={layout.eyebrow}>
            {eyebrow}
          </span>
          {centered ? (
            <span className="h-px w-8 shrink-0" style={layout.eyebrowLine} aria-hidden />
          ) : null}
        </div>
      ) : null}

      {hasTitle ? (
        <h2 className={layout.titleClass} style={{ ...layout.title, fontFamily: fonts.heading }}>
          <SectionEditorialTitle content={title} colors={colors} />
        </h2>
      ) : null}

      {description ? (
        <p
          className={cn(layout.descriptionClass, hasTitle && 'mt-2', centered && 'mx-auto')}
          style={{ ...layout.description, fontFamily: fonts.body }}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
