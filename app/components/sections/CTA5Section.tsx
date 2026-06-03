'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Page } from '@/app/lib/types';
import { TiptapRenderer } from '@/app/components/ui/TiptapRenderer';
import { getImageSrc, cn } from '@/app/lib/utils';
import { useThemeColors } from '@/app/hooks/useTheme';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';

interface CTA5SectionProps {
  cta5Section: Page['cta5Section'];
  className?: string;
}

export const CTA5Section: React.FC<CTA5SectionProps> = ({ cta5Section, className }) => {
  const themeColors = useThemeColors();
  const { layout, fonts } = useSectionTheme();
  const safe = (cta5Section ?? { enabled: false }) as NonNullable<Page['cta5Section']>;

  const bgUrl = useMemo(
    () => (safe.backgroundImage ? getImageSrc(safe.backgroundImage) : ''),
    [safe.backgroundImage]
  );

  if (!safe?.enabled) return null;

  return (
    <section
      className={cn('relative overflow-hidden', layout.sectionClass, className)}
      style={{
        backgroundColor: safe.backgroundColor || '#030306',
        backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily: fonts.body,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: bgUrl
            ? 'radial-gradient(ellipse 120% 80% at 20% 40%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.75) 100%)'
            : `radial-gradient(ellipse at 30% 20%, color-mix(in srgb, ${themeColors.primaryButton} 22%, transparent), transparent 55%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:56px_56px] opacity-40" />

      <div className="relative container mx-auto px-6 lg:px-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          {safe.title && (
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              className={cn(layout.titleClass, 'text-white')}
              style={{ fontFamily: fonts.heading }}
            >
              <TiptapRenderer content={safe.title} />
            </motion.div>
          )}
          {safe.description && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.85, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={cn(layout.descriptionClass, 'mt-2 max-w-2xl text-white/75')}
            >
              <TiptapRenderer content={safe.description} />
            </motion.div>
          )}
          {safe.primaryButton && (
            <motion.a
              href={safe.primaryButton.href}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.7, delay: 0.18 }}
              className="mt-12 inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.08] px-10 py-4 text-xs font-semibold uppercase tracking-[0.35em] text-white shadow-[0_0_50px_rgba(0,0,0,0.45)] backdrop-blur-xl"
              style={{ borderColor: `color-mix(in srgb, ${themeColors.primaryButton} 35%, transparent)` }}
            >
              {safe.primaryButton.label}
            </motion.a>
          )}
        </div>
      </div>
    </section>
  );
};

export default CTA5Section;
