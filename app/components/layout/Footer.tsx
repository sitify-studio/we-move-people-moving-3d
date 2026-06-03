'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  ChevronUp,
  Instagram,
  Linkedin,
  Youtube,
  Facebook,
  Mail,
  Phone,
  ArrowRight,
} from 'lucide-react';
import type { Site } from '@/app/lib/types';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import {
  getBrandName,
  getCopyrightText,
  getFooterDescriptionContent,
  getFooterNavLinks,
  getPageHref,
} from '@/app/lib/siteContent';
import type { Page } from '@/app/lib/types';
import { tiptapToText } from '@/app/lib/seo';
import { cn, getImageSrc } from '@/app/lib/utils';

type FooterColumn = {
  title: string;
  links: { id: string; label: string; href: string }[];
};

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

function SocialIcon({ platform }: { platform: string }) {
  const key = platform.toLowerCase();
  const className = 'h-4 w-4 shrink-0';
  if (key === 'instagram') return <Instagram className={className} aria-hidden />;
  if (key === 'linkedin') return <Linkedin className={className} aria-hidden />;
  if (key === 'youtube') return <Youtube className={className} aria-hidden />;
  if (key === 'facebook') return <Facebook className={className} aria-hidden />;
  return null;
}

function buildCmsFooterColumns(site: Site | null): FooterColumn[] {
  return (
    site?.footer?.columns
      ?.filter(
        (col) =>
          col?.title?.trim() &&
          !isContactColumnTitle(col.title) &&
          col.links?.some((l) => l?.label?.trim() && l?.url?.trim())
      )
      .map((col, colIndex) => ({
        title: col.title.trim(),
        links: col.links
          .filter((l) => l?.label?.trim() && l?.url?.trim())
          .map((link, linkIndex) => ({
            id: `footer-cms-${colIndex}-${linkIndex}`,
            label: link.label.trim(),
            href: normalizeHref(link.url),
          })),
      })) ?? []
  );
}

function isContactColumnTitle(title: string): boolean {
  return /^contact(\s+us)?$/i.test(title.trim());
}

function buildPagesColumn(pages?: Page[]): FooterColumn {
  const navLinks = getFooterNavLinks(pages).filter((link) => link.href !== '/');
  return {
    title: 'Pages',
    links: navLinks.map((l) => ({ id: l.id, label: l.label, href: l.href })),
  };
}

function FooterLinkColumn({
  column,
  colors,
  fonts,
  layout,
}: {
  column: FooterColumn;
  colors: ReturnType<typeof useSectionTheme>['colors'];
  fonts: ReturnType<typeof useSectionTheme>['fonts'];
  layout: ReturnType<typeof useSectionTheme>['layout'];
}) {
  if (!column.links.length) return null;

  return (
    <div>
      <h4 className={cn(layout.eyebrowClass, 'mb-3')} style={{ ...layout.eyebrow, fontFamily: fonts.body }}>
        {column.title}
      </h4>
      <ul className="space-y-2.5">
        {column.links.map((link) => {
          const isExternal =
            link.href.startsWith('http') ||
            link.href.startsWith('mailto:') ||
            link.href.startsWith('tel:');
          const linkClass = cn(
            layout.descriptionClass,
            'transition-colors hover:opacity-100 no-underline'
          );
          const linkStyle = {
            ...layout.description,
            fontFamily: fonts.body,
            color: colors.secondaryText,
          };

          return (
            <li key={link.id}>
              {isExternal ? (
                <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass} style={linkStyle}>
                  {link.label}
                </a>
              ) : (
                <Link href={link.href} className={linkClass} style={linkStyle}>
                  {link.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Footer() {
  const { site, pages } = useWebBuilder();
  const { colors, fonts, layout } = useSectionTheme();

  const brandName = useMemo(() => getBrandName(site), [site]);
  const description = useMemo(() => tiptapToText(getFooterDescriptionContent(site)).trim(), [site]);
  const logoSrc = useMemo(() => {
    const url = site?.footer?.logo?.url || site?.theme?.logoUrl;
    return url ? getImageSrc(url) : undefined;
  }, [site?.footer?.logo?.url, site?.theme?.logoUrl]);

  const pagesColumn = useMemo(() => buildPagesColumn(pages), [pages]);
  const cmsColumns = useMemo(() => buildCmsFooterColumns(site), [site]);

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
    const home = pages.find((p) => p.pageType === 'home');
    return home?.hero?.primaryCta?.label?.trim() || contactPage?.name?.trim() || 'Get a quote';
  }, [contactPage, pages]);

  const socialLinks = useMemo(() => {
    if (site?.footer?.showSocialLinks === false) return [];
    return site?.socialLinks?.filter((s) => s?.url?.trim()) ?? [];
  }, [site?.footer?.showSocialLinks, site?.socialLinks]);

  const copyright = useMemo(() => {
    const fromCms = getCopyrightText(site);
    if (fromCms && fromCms.length > 4) return fromCms;
    if (brandName) {
      return `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`;
    }
    return `© ${new Date().getFullYear()}`;
  }, [site, brandName]);

  const legalLinks = useMemo(() => {
    const links: { label: string; href: string }[] = [];
    if (site?.legal?.termsOfService) {
      links.push({ label: 'Terms of Service', href: '/terms-of-service' });
    }
    if (site?.legal?.privacyPolicy) {
      links.push({ label: 'Privacy Policy', href: '/privacy-policy' });
    }
    return links;
  }, [site?.legal]);

  const phone = site?.business?.phone?.trim();
  const email = site?.business?.email?.trim();

  const borderColor = `color-mix(in srgb, ${colors.primaryButton} 15%, transparent)`;
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const hasBrandBlock = Boolean(brandName || description || logoSrc || phone || email);
  const hasSocial = socialLinks.length > 0;
  const hasBottom = Boolean(copyright || legalLinks.length > 0);
  const hasRightNav = pagesColumn.links.length > 0;

  if (!hasBrandBlock && !hasRightNav && cmsColumns.length === 0 && !hasSocial && !hasBottom) {
    return null;
  }

  return (
    <footer
      id="contact"
      className="relative overflow-hidden"
      style={{ backgroundColor: colors.pageBackground, fontFamily: fonts.body }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${colors.primaryButton}, transparent)`,
        }}
        aria-hidden
      />

      <div className="container relative z-10 mx-auto max-w-7xl px-6 py-10 lg:py-12">
        {(ctaLabel && ctaHref) ? (
          <div
            className="mb-10 flex justify-end"
          >
            <Link
              href={ctaHref}
              className="group inline-flex shrink-0 items-center gap-2 rounded-full px-8 py-4 text-sm font-bold !text-white no-underline shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98]"
              style={{
                backgroundColor: colors.primaryButton,
                boxShadow: `0 8px 24px color-mix(in srgb, ${colors.primaryButton} 35%, transparent)`,
              }}
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {hasBrandBlock ? (
            <div className="lg:col-span-5 xl:col-span-4">
              <Link href="/" className="mb-4 inline-flex items-center gap-3">
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt={site?.footer?.logo?.altText?.trim() || brandName || 'Logo'}
                    className="h-12 w-auto max-w-[12rem] object-contain sm:h-14 sm:max-w-[14rem] lg:h-16 lg:max-w-[16rem]"
                  />
                ) : null}
                {brandName && !logoSrc ? (
                  <span
                    className={layout.titleClass}
                    style={{ ...layout.title, fontFamily: fonts.heading }}
                  >
                    {brandName}
                  </span>
                ) : null}
              </Link>

              <div
                className="mb-4 h-1 w-12 rounded-full"
                style={{ backgroundColor: colors.primaryButton }}
                aria-hidden
              />

              {description ? (
                <p className={layout.descriptionClass} style={{ ...layout.description, fontFamily: fonts.body }}>
                  {description}
                </p>
              ) : null}

              {(phone || email) ? (
                <div className="mt-5 flex flex-col gap-2.5">
                  {phone ? (
                    <a
                      href={formatTelHref(phone)}
                      className={cn(layout.descriptionClass, 'inline-flex items-center gap-2 transition-opacity hover:opacity-80')}
                      style={{ ...layout.description, fontFamily: fonts.body }}
                    >
                      <Phone className="h-4 w-4 shrink-0" style={{ color: colors.primaryButton }} aria-hidden />
                      {phone}
                    </a>
                  ) : null}
                  {email ? (
                    <a
                      href={`mailto:${email}`}
                      className={cn(layout.descriptionClass, 'inline-flex items-center gap-2 transition-opacity hover:opacity-80')}
                      style={{ ...layout.description, fontFamily: fonts.body }}
                    >
                      <Mail className="h-4 w-4 shrink-0" style={{ color: colors.primaryButton }} aria-hidden />
                      {email}
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <div
            className={cn(
              'grid grid-cols-2 gap-8 sm:grid-cols-3',
              hasBrandBlock ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'
            )}
          >
            <FooterLinkColumn column={pagesColumn} colors={colors} fonts={fonts} layout={layout} />

            {cmsColumns.map((column) => (
              <FooterLinkColumn
                key={column.title}
                column={column}
                colors={colors}
                fonts={fonts}
                layout={layout}
              />
            ))}

            {hasSocial ? (
              <div>
                <h4 className={cn(layout.eyebrowClass, 'mb-3')} style={{ ...layout.eyebrow, fontFamily: fonts.body }}>
                  Social
                </h4>
                <ul className="flex flex-wrap gap-2 sm:flex-col sm:gap-2.5">
                  {socialLinks.map((social) => {
                    const platform = social.platform || 'Link';
                    const label =
                      platform.charAt(0).toUpperCase() + platform.slice(1).replace(/^X$/i, 'X');
                    return (
                      <li key={`${platform}-${social.url}`}>
                        <a
                          href={social.url.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-80"
                          style={{
                            borderColor,
                            color: colors.mainText,
                            fontFamily: fonts.body,
                          }}
                        >
                          <SocialIcon platform={platform} />
                          <span className="hidden sm:inline">{label}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        {hasBottom ? (
          <>
            <div className="my-8 h-px" style={{ backgroundColor: borderColor }} />

            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p
                className="text-center text-xs sm:text-left"
                style={{ color: colors.secondaryText, fontFamily: fonts.body }}
              >
                {copyright}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                {legalLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-xs font-bold uppercase tracking-[0.16em] transition-opacity hover:opacity-80 no-underline"
                    style={{ color: colors.secondaryText, fontFamily: fonts.body }}
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition-opacity hover:opacity-80"
                  style={{
                    borderColor,
                    color: colors.mainText,
                    fontFamily: fonts.body,
                  }}
                >
                  Back to top
                  <ChevronUp className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" aria-hidden />
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </footer>
  );
}

export default Footer;
