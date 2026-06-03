'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { useThemeColors } from '@/app/hooks/useTheme';
import { Footer } from '@/app/components/layout/Footer';
import { HeroSection } from '@/app/components/sections/HeroSection';
import { AboutSection } from '@/app/components/sections/AboutSection';
import { ServicesSection } from '@/app/components/sections/ServicesSection';
import { TestimonialsSection } from '@/app/components/sections/TestimonialsSection';
import { FAQSection } from '@/app/components/sections/FAQSection';
import { CTASection } from '@/app/components/sections/CTASection';
import { WhyChooseUsSection } from '@/app/components/sections/WhyChooseUsSection';
import { CompanyDetailSection } from '@/app/components/sections/CompanyDetailSection';
import { ProjectsSection } from '@/app/components/sections/ProjectsSection';
import { CTA2Section } from '@/app/components/sections/CTA2Section';
import { CTA3Section } from '@/app/components/sections/CTA3Section';
import { GallerySection } from '@/app/components/sections/GallerySection';
import { ContactSection } from '@/app/components/sections/ContactSection';
import { BlogSection } from '@/app/components/sections/BlogSection';
import { ServingAreasSection } from '@/app/components/sections/ServingAreasSection';
import api from '@/app/lib/fetch-api';
import { Page, ServiceAreaPage } from '@/app/lib/types';
import { PageContentLoader } from '@/app/components/ui/PageContentLoader';
import { SectionScrollReveal } from '@/app/components/ui/SectionScrollReveal';

interface PageSlugClientProps {
  pageSlug: string;
}

export default function PageSlugClient({ pageSlug: pageSlugProp }: PageSlugClientProps) {
  const params = useParams();
  const pageSlug = params.pageSlug as string || pageSlugProp;
  const { pages, currentPage, setCurrentPage, loading, site } = useWebBuilder();
  const themeColors = useThemeColors();
  const [serviceAreaPage, setServiceAreaPage] = useState<ServiceAreaPage | null>(null);
  const [serviceAreaLoading, setServiceAreaLoading] = useState(false);
  const hasAttemptedLoad = useRef(false);

  // Load service area page
  const loadServiceAreaPage = useCallback(async () => {
    if (!site || hasAttemptedLoad.current) return;

    hasAttemptedLoad.current = true;
    setServiceAreaLoading(true);

    try {
      const response = await api.get(`/public/sites/${site.slug}/service-areas/${pageSlug}`);
      if (response.success) {
        setServiceAreaPage(response.data);
      } else {
        setServiceAreaPage(null);
      }
    } catch {
      setServiceAreaPage(null);
    } finally {
      setServiceAreaLoading(false);
    }
  }, [site, pageSlug]);

  useEffect(() => {
    if (loading || pages.length === 0) return;

    const foundPage = pages.find(page => page.slug === pageSlug);
    if (foundPage) {
      setCurrentPage(foundPage);
      setServiceAreaPage(null);
    } else {
      setCurrentPage(null);
      if (!hasAttemptedLoad.current) {
        loadServiceAreaPage();
      }
    }
  }, [pageSlug, pages, loading, setCurrentPage, loadServiceAreaPage]);

  if (loading || serviceAreaLoading) {
    return <PageContentLoader />;
  }

  const displayPage = currentPage || serviceAreaPage;

  if (!displayPage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center" style={{ backgroundColor: themeColors.pageBackground }}>
        <h2 className="text-2xl font-bold mb-2" style={{ color: themeColors.lightPrimaryText }}>Page Not Found</h2>
        <p style={{ color: themeColors.lightSecondaryText }}>The page &quot;{pageSlug}&quot; could not be found.</p>
        <Link href="/" className="mt-8 hover:underline" style={{ color: themeColors.primaryButton }}>Return Home</Link>
      </div>
    );
  }

  const page: Page | null = currentPage;
  const pageType = page?.pageType;
  const showServingAreas =
    page?.servingAreasSection?.enabled !== false &&
    (page?.servingAreasSection != null || pageType === 'home');

  return (
    <div className="min-h-screen" style={{ backgroundColor: themeColors.pageBackground }}>
      <main>
        {pageType === 'home' && (
          <>
            <HeroSection hero={page?.hero} page={page} />
            <SectionScrollReveal>
              <AboutSection aboutSection={page?.aboutSection} />
            </SectionScrollReveal>
            <SectionScrollReveal>
              <ServicesSection servicesSection={page?.servicesSection} />
            </SectionScrollReveal>
            <SectionScrollReveal>
              <GallerySection gallerySection={page?.gallerySection} />
            </SectionScrollReveal>
            <SectionScrollReveal>
              <TestimonialsSection testimonialsSection={page?.testimonialsSection} />
            </SectionScrollReveal>
            <SectionScrollReveal>
              <FAQSection faqSection={page?.faqSection} />
            </SectionScrollReveal>
            <SectionScrollReveal>
              <ContactSection contactSection={page?.contactSection} />
            </SectionScrollReveal>
            <SectionScrollReveal>
              <BlogSection blogSection={page?.blogSection} />
            </SectionScrollReveal>
            <SectionScrollReveal>
              <CTASection ctaSection={page?.ctaSection} />
            </SectionScrollReveal>
            <SectionScrollReveal>
              <WhyChooseUsSection whyChooseUsSection={page?.whyChooseUsSection} />
            </SectionScrollReveal>
            <SectionScrollReveal>
              <CompanyDetailSection companyDetailSection={page?.companyDetailSection} />
            </SectionScrollReveal>
            <SectionScrollReveal>
              <ProjectsSection
                projectSection={page?.projectSection}
                projectsSection={page?.projectsSection}
              />
            </SectionScrollReveal>
            <SectionScrollReveal>
              <CTA2Section cta2Section={page?.cta2Section} />
            </SectionScrollReveal>
            <SectionScrollReveal>
              <CTA3Section cta3Section={page?.cta3Section} />
            </SectionScrollReveal>
          </>
        )}

        {pageType === 'about' && (
          <>
            <HeroSection hero={page?.hero} page={page} />
            <SectionScrollReveal>
              <AboutSection aboutSection={page?.aboutSection} />
            </SectionScrollReveal>
            <SectionScrollReveal>
              <WhyChooseUsSection whyChooseUsSection={page?.whyChooseUsSection} />
            </SectionScrollReveal>
            <SectionScrollReveal>
              <CompanyDetailSection companyDetailSection={page?.companyDetailSection} />
            </SectionScrollReveal>
            <SectionScrollReveal>
              <CTA2Section cta2Section={page?.cta2Section} />
            </SectionScrollReveal>
          </>
        )}

        {pageType === 'contact' && (
          <>
            <HeroSection hero={page?.hero} page={page} />
            <SectionScrollReveal>
              <ContactSection contactSection={page?.contactSection} />
            </SectionScrollReveal>
          </>
        )}

        {pageType === 'service-list' && (
          <>
            <HeroSection hero={page?.hero} page={page} />
            <SectionScrollReveal>
              <ServicesSection servicesSection={page?.servicesSection} />
            </SectionScrollReveal>
          </>
        )}

        {pageType === 'blog-list' && (
          <>
            <HeroSection hero={page?.hero} page={page} />
            <SectionScrollReveal>
              <BlogSection blogSection={page?.blogSection} />
            </SectionScrollReveal>
          </>
        )}

        {pageType === 'project-detail' && (
          <HeroSection hero={page?.hero} page={page} />
        )}

        {page?.slug === 'testimonials' && (
          <>
            <HeroSection hero={page?.hero} page={page} />
            <SectionScrollReveal>
              <TestimonialsSection testimonialsSection={page?.testimonialsSection} />
            </SectionScrollReveal>
          </>
        )}

        {showServingAreas && (
          <SectionScrollReveal>
            <ServingAreasSection
              servingAreasSection={page?.servingAreasSection ?? { enabled: true }}
            />
          </SectionScrollReveal>
        )}
      </main>

      <Footer />
    </div>
  );
}
