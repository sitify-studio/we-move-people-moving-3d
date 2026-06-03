'use client';

import { useMemo } from 'react';
import { useThemeColors } from '@/app/hooks/useTheme';

export function useSectionTheme() {
  const colors = useThemeColors();

  return useMemo(
    () => ({
      colors,
      fonts: {
        heading: 'var(--wb-heading-font, Georgia, serif)',
        body: 'var(--wb-body-font, inherit)',
      },
      styles: {
        titleGradient: {
          background: `linear-gradient(135deg, ${colors.mainText} 0%, ${colors.primaryButton} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        } as React.CSSProperties,
        iconBadge: {
          background: `linear-gradient(135deg, ${colors.primaryButton}, ${colors.hoverActive})`,
        } as React.CSSProperties,
        sectionGradientBg: {
          background: `linear-gradient(135deg, ${colors.sectionBackgroundLight} 0%, ${colors.pageBackground} 50%, color-mix(in srgb, ${colors.primaryButton} 8%, ${colors.pageBackground}) 100%)`,
        } as React.CSSProperties,
        sectionGradientBgAlt: {
          background: `linear-gradient(135deg, ${colors.pageBackground} 0%, ${colors.sectionBackgroundLight} 100%)`,
        } as React.CSSProperties,
        sectionGradientBgSoft: {
          background: `linear-gradient(135deg, ${colors.sectionBackgroundLight} 0%, ${colors.pageBackground} 100%)`,
        } as React.CSSProperties,
        card: {
          borderColor: 'color-mix(in srgb, var(--wb-primary) 10%, transparent)',
          backgroundColor: 'color-mix(in srgb, var(--wb-card-bg-light) 90%, transparent)',
        } as React.CSSProperties,
        cardSolid: {
          borderColor: 'color-mix(in srgb, var(--wb-primary) 10%, transparent)',
          backgroundColor: colors.cardBackground,
        } as React.CSSProperties,
        imagePlaceholder: {
          backgroundColor: colors.sectionBackgroundLight,
        } as React.CSSProperties,
        imageOverlay: {
          background: `linear-gradient(to top, color-mix(in srgb, ${colors.primaryButton} 60%, transparent), transparent)`,
        } as React.CSSProperties,
        imageOverlayHover: {
          background: `linear-gradient(to top, color-mix(in srgb, ${colors.primaryButton} 80%, transparent), transparent)`,
        } as React.CSSProperties,
        dividerDot: { backgroundColor: colors.primaryButton } as React.CSSProperties,
        dividerLine: {
          backgroundColor: 'color-mix(in srgb, var(--wb-primary) 30%, transparent)',
        } as React.CSSProperties,
        dividerGradient: {
          background: `linear-gradient(90deg, ${colors.primaryButton}, transparent)`,
        } as React.CSSProperties,
        primaryCta: {
          backgroundColor: colors.primaryButton,
          color: '#ffffff',
        } as React.CSSProperties,
        statCircle: {
          background: `linear-gradient(135deg, ${colors.primaryButton}, ${colors.hoverActive})`,
        } as React.CSSProperties,
        accentText: { color: colors.primaryButton } as React.CSSProperties,
        floatingDot: { backgroundColor: colors.primaryButton } as React.CSSProperties,
      },
      layout: {
        sectionClass: 'py-4 lg:py-5',
        headerClass: 'mb-6 max-w-3xl',
        headerCenterClass: 'mb-6 mx-auto max-w-2xl text-center',
        titleClass: 'text-2xl font-bold leading-tight tracking-tight sm:text-3xl',
        descriptionClass: 'text-sm leading-relaxed sm:text-base',
        eyebrowClass: 'text-[11px] font-bold uppercase tracking-[0.22em]',
        title: { color: colors.mainText } as React.CSSProperties,
        description: { color: colors.secondaryText } as React.CSSProperties,
        eyebrow: { color: colors.primaryButton } as React.CSSProperties,
        eyebrowLine: {
          background: `linear-gradient(90deg, ${colors.primaryButton}, transparent)`,
        } as React.CSSProperties,
      },
    }),
    [colors]
  );
}
