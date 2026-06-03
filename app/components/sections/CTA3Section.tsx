'use client';

import React, { useMemo } from 'react';
import { Page } from '@/app/lib/types';
import { TiptapRenderer } from '@/app/components/ui/TiptapRenderer';
import { getImageSrc, cn } from '@/app/lib/utils';
import { useThemeColors } from '@/app/hooks/useTheme';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';

interface CTA3SectionProps {
  cta3Section: Page['cta3Section'];
  className?: string;
}

export const CTA3Section: React.FC<CTA3SectionProps> = ({ cta3Section, className }) => {
  const themeColors = useThemeColors();
  const { layout, fonts } = useSectionTheme();

  const safeCta: NonNullable<Page['cta3Section']> = (cta3Section ?? { enabled: false }) as NonNullable<Page['cta3Section']>;

  const backgroundImageUrl = useMemo(() => {
    return safeCta.backgroundImage ? getImageSrc(safeCta.backgroundImage) : '';
  }, [safeCta.backgroundImage]);

  if (!safeCta?.enabled) return null;

  return (
    <section
      className={cn('relative overflow-hidden', className)}
      style={
        backgroundImageUrl
          ? {
              backgroundImage: `url(${backgroundImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : { backgroundColor: themeColors.sectionBackground }
      }
    >
      <div
        className="absolute inset-0"
        style={{
          background: backgroundImageUrl
            ? 'linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.30) 52%, rgba(0,0,0,0.10) 100%)'
            : `linear-gradient(135deg, ${themeColors.primaryButton}22 0%, rgba(0,0,0,0) 60%)`,
        }}
      />

      <div className="relative container mx-auto px-4">
        <div className={layout.sectionClass}>
          <div className="max-w-4xl">
            {safeCta.title && (
              <div
                className={layout.titleClass}
                style={{ color: backgroundImageUrl ? '#FFFFFF' : themeColors.lightPrimaryText, fontFamily: fonts.heading }}
              >
                <TiptapRenderer content={safeCta.title} />
              </div>
            )}

            {safeCta.description && (
              <div
                className={cn(layout.descriptionClass, 'mt-2 max-w-2xl')}
                style={{
                  color: backgroundImageUrl ? 'rgba(255,255,255,0.88)' : themeColors.lightSecondaryText,
                }}
              >
                <TiptapRenderer content={safeCta.description} />
              </div>
            )}

            {safeCta.primaryButton && (
              <div className="mt-8">
                <a
                  href={safeCta.primaryButton.href}
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full font-semibold transition-colors"
                  style={{
                    backgroundColor: themeColors.pageBackground,
                    color: themeColors.lightPrimaryText,
                  }}
                >
                  {safeCta.primaryButton.label}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA3Section;
