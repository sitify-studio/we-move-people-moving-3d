'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone, ArrowRight } from 'lucide-react';
import type { Page } from '@/app/lib/types';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import {
  getBrandName,
  getHeaderNavItems,
  getPageHref,
  getTestimonialsNavItem,
  type HeaderNavItem,
} from '@/app/lib/siteContent';
import { cn, getImageSrc } from '@/app/lib/utils';

function normalizeHref(href: string): string {
  const t = href.trim();
  if (t.startsWith('http') || t.startsWith('mailto:') || t.startsWith('tel:') || t.startsWith('#')) {
    return t;
  }
  return t.startsWith('/') ? t : `/${t}`;
}

function formatTelHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits ? `tel:+${digits}` : `tel:${phone}`;
}

function buildNavLinks(pages?: Page[]): HeaderNavItem[] {
  const items = getHeaderNavItems(pages);
  const testimonials = getTestimonialsNavItem(pages);
  const seen = new Set(items.map((i) => i.href));
  if (!seen.has(testimonials.href)) {
    return [testimonials, ...items];
  }
  return items;
}

export function Header() {
  const { site, pages } = useWebBuilder();
  const { colors, fonts, layout } = useSectionTheme();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const brandName = useMemo(() => getBrandName(site) || site?.name?.trim() || '', [site]);
  const logoSrc = useMemo(() => {
    const url = site?.footer?.logo?.url || site?.theme?.logoUrl;
    return url ? getImageSrc(url) : undefined;
  }, [site?.footer?.logo?.url, site?.theme?.logoUrl]);

  const navLinks = useMemo(() => buildNavLinks(pages), [pages]);

  const contactPage = useMemo(
    () => pages.find((p) => p.pageType === 'contact' && p.status === 'published'),
    [pages]
  );

  const ctaHref = useMemo(() => {
    if (contactPage) return getPageHref(contactPage);
    const home = pages.find((p) => p.pageType === 'home');
    const heroCta = home?.hero?.primaryCta?.href?.trim();
    if (heroCta) return normalizeHref(heroCta);
    return '/contact-us';
  }, [contactPage, pages]);

  const ctaLabel = useMemo(() => {
    if (contactPage?.name?.trim()) return contactPage.name.trim();
    const home = pages.find((p) => p.pageType === 'home');
    const label = home?.hero?.primaryCta?.label?.trim();
    if (label) return label;
    return 'Get a quote';
  }, [contactPage, pages]);

  const phone = site?.business?.phone?.trim() ?? '';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  if (!brandName && navLinks.length === 0) return null;

  const onPrimaryBar = isScrolled;
  const barText = onPrimaryBar ? '#ffffff' : colors.mainText;
  const barTextMuted = onPrimaryBar
    ? '#ffffff'
    : `color-mix(in srgb, ${colors.mainText} 65%, transparent)`;

  const navLinkClass = cn(
    'relative text-xs font-bold uppercase tracking-[0.2em] transition-colors group',
    onPrimaryBar ? 'hover:text-white' : 'hover:text-[var(--wb-text-main)]'
  );

  const barStyle = onPrimaryBar
    ? {
        backgroundColor: colors.primaryButton,
        borderColor: 'transparent',
        boxShadow: `0 12px 40px color-mix(in srgb, ${colors.primaryButton} 40%, transparent)`,
        backdropFilter: 'none',
      }
    : {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        boxShadow: 'none',
        backdropFilter: 'none',
      };

  return (
    <nav
      className="pointer-events-none fixed left-0 right-0 top-0 z-[100] flex justify-center px-4 pt-2 sm:px-6 lg:px-8"
      style={{ fontFamily: fonts.body }}
    >
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'pointer-events-auto flex w-full max-w-7xl items-center justify-between gap-4 rounded-full border px-4 py-2.5 transition-all duration-500 sm:px-6 sm:py-3',
          isScrolled ? 'h-14 sm:h-16' : 'h-14 sm:h-[4.25rem]'
        )}
        style={barStyle}
      >
        <Link href="/" className="group flex min-w-0 shrink items-center gap-2.5">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={brandName || 'Home'}
              className="h-11 w-auto max-w-[11rem] object-contain transition-transform group-hover:scale-[1.02] sm:h-12 sm:max-w-[13rem] lg:h-14 lg:max-w-[15rem]"
            />
          ) : brandName ? (
            <span
              className="truncate text-sm font-bold tracking-tight sm:text-base transition-colors duration-500"
              style={{ color: barText, fontFamily: fonts.heading }}
            >
              {brandName}
            </span>
          ) : null}
        </Link>

        <div className="hidden items-center gap-6 lg:flex xl:gap-8">
          {navLinks.map((link) => {
            const href = normalizeHref(link.href);
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={link.id}
                href={href}
                className={navLinkClass}
                style={{ color: onPrimaryBar ? '#ffffff' : isActive ? barText : barTextMuted, fontFamily: fonts.body }}
              >
                {link.name}
                <span
                  className={cn(
                    'absolute -bottom-1.5 left-0 h-0.5 rounded-full transition-all duration-300',
                    isActive ? 'w-full' : 'w-0 group-hover:w-full'
                  )}
                  style={{
                    backgroundColor: onPrimaryBar ? '#ffffff' : colors.primaryButton,
                  }}
                  aria-hidden
                />
              </Link>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {phone ? (
            <a
              href={formatTelHref(phone)}
              className="hidden items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition-colors duration-500 hover:opacity-80 xl:flex"
              style={{
                borderColor: onPrimaryBar
                  ? '#ffffff'
                  : `color-mix(in srgb, ${colors.primaryButton} 25%, transparent)`,
                color: onPrimaryBar ? '#ffffff' : barText,
              }}
            >
              <Phone
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: onPrimaryBar ? '#ffffff' : colors.primaryButton }}
                aria-hidden
              />
              <span className="max-w-[10rem] truncate">{phone}</span>
            </a>
          ) : null}

          <Link
            href={ctaHref}
            className="group hidden items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold shadow-lg transition-all duration-500 hover:scale-[1.03] active:scale-[0.98] md:inline-flex sm:px-8 sm:py-3"
            style={{
              backgroundColor: onPrimaryBar ? '#ffffff' : colors.primaryButton,
              color: onPrimaryBar ? colors.primaryButton : '#ffffff',
              boxShadow: onPrimaryBar
                ? `0 8px 24px color-mix(in srgb, #000000 12%, transparent)`
                : `0 8px 24px color-mix(in srgb, ${colors.primaryButton} 35%, transparent)`,
            }}
          >
            <span>{ctaLabel}</span>
            <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-500 lg:hidden"
            style={{
              borderColor: onPrimaryBar
                ? '#ffffff'
                : `color-mix(in srgb, ${colors.primaryButton} 20%, transparent)`,
              color: onPrimaryBar ? '#ffffff' : colors.primaryButton,
              backgroundColor: onPrimaryBar
                ? 'transparent'
                : `color-mix(in srgb, ${colors.pageBackground} 80%, transparent)`,
            }}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isMobileMenuOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-auto fixed inset-0 z-[99] bg-black/20 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
            />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-auto fixed inset-x-4 top-[4.5rem] z-[101] overflow-hidden rounded-3xl border p-6 shadow-2xl sm:inset-x-6 sm:p-8 lg:hidden"
              style={{
                backgroundColor: colors.cardBackground,
                borderColor: `color-mix(in srgb, ${colors.primaryButton} 12%, transparent)`,
                fontFamily: fonts.body,
              }}
            >
              <div
                className="mb-6 h-1 w-12 rounded-full"
                style={{ backgroundColor: colors.primaryButton }}
                aria-hidden
              />
              <div className="flex flex-col gap-5">
                {navLinks.map((link) => (
                  <Link
                    key={link.id}
                    href={normalizeHref(link.href)}
                    className={cn(layout.titleClass, 'transition-opacity hover:opacity-80')}
                    style={{ ...layout.title, fontFamily: fonts.heading }}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              <div
                className="my-6 h-px"
                style={{
                  backgroundColor: `color-mix(in srgb, ${colors.primaryButton} 15%, transparent)`,
                }}
              />

              <div className="flex flex-col gap-4">
                {phone ? (
                  <a
                    href={formatTelHref(phone)}
                    className={cn(layout.descriptionClass, 'flex items-center gap-3')}
                    style={{ ...layout.description, fontFamily: fonts.body }}
                  >
                    <Phone className="h-4 w-4 shrink-0" style={{ color: colors.primaryButton }} />
                    {phone}
                  </a>
                ) : null}
                <Link
                  href={ctaHref}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-bold !text-white no-underline shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: colors.primaryButton,
                    boxShadow: `0 8px 24px color-mix(in srgb, ${colors.primaryButton} 35%, transparent)`,
                  }}
                >
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </nav>
  );
}

export default Header;
