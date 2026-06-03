'use client';

import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Page, BusinessHours } from '@/app/lib/types';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { cn } from '@/app/lib/utils';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import { ContactSideForm } from '@/app/components/ui/ContactSideForm';
import { tiptapToText } from '@/app/lib/seo';
import { SectionEditorialHeader } from '@/app/components/sections/SectionEditorialHeader';

const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

interface ContactSectionProps {
  contactSection?: Page['contactSection'];
  className?: string;
}

type ContactSectionInput = NonNullable<Page['contactSection']> & {
  heading?: unknown;
  subtitle?: unknown;
};

function pickSectionField(
  section: ContactSectionInput | undefined,
  primary: 'title' | 'description'
): unknown {
  if (!section) return undefined;
  const alt = primary === 'title' ? section.heading : section.subtitle;
  const value = section[primary] ?? alt;
  if (value == null || value === '') return undefined;
  return value;
}

const CARD_TEXT = '#ffffff';

function ContactField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const { fonts } = useSectionTheme();

  return (
    <div className="space-y-2">
      <span
        className="block text-[10px] font-bold uppercase tracking-[0.2em]"
        style={{ color: CARD_TEXT, fontFamily: fonts.body }}
      >
        {label}
      </span>
      <div className="text-sm leading-relaxed" style={{ color: CARD_TEXT, fontFamily: fonts.body }}>
        {children}
      </div>
    </div>
  );
}

export function ContactSection({ contactSection, className }: ContactSectionProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { site } = useWebBuilder();
  const { colors, fonts, layout } = useSectionTheme();

  const sectionInput = contactSection as ContactSectionInput | undefined;
  const titleContent = pickSectionField(sectionInput, 'title');
  const descriptionContent = pickSectionField(sectionInput, 'description');

  const eyebrow = useMemo(
    () => tiptapToText(sectionInput?.subtitle).trim(),
    [sectionInput?.subtitle]
  );

  const descriptionText = useMemo(
    () => tiptapToText(descriptionContent).trim(),
    [descriptionContent]
  );

  if (!contactSection?.enabled) return null;

  const business = site?.business;
  const address = business?.address;
  const businessHours = business?.businessHours;
  const showForm = contactSection.showForm !== false;
  const showMap = contactSection.showMap !== false;
  const showContactInfo = contactSection.showContactInfo !== false;

  const formatTime = (time: string) => {
    if (!time) return '';
    if (businessHours?.displayFormat === '12h') {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    }
    return time;
  };

  const formatDayHours = (dayHours: BusinessHours) => {
    if (!dayHours.isOpen) return 'Closed';
    if (dayHours.is24Hours) return '24h';
    if (dayHours.timeRanges?.length) {
      return dayHours.timeRanges
        .map((range) => `${formatTime(range.openTime)} - ${formatTime(range.closeTime)}`)
        .join(', ');
    }
    return '';
  };

  const addressLine = [address?.street, address?.city, address?.state, address?.zipCode]
    .filter(Boolean)
    .join(', ');

  const mapQuery = addressLine;
  const cardBorder = `color-mix(in srgb, ${CARD_TEXT} 22%, transparent)`;
  const cardBackground = `linear-gradient(145deg, color-mix(in srgb, ${colors.primaryButton} 92%, ${colors.mainText}) 0%, color-mix(in srgb, ${colors.primaryButton} 70%, ${colors.mainText}) 100%)`;
  const hoursPanelBg = `color-mix(in srgb, ${CARD_TEXT} 10%, transparent)`;

  const hasAddress = Boolean(address?.street || address?.city);
  const hasPhone = Boolean(business?.phone?.trim());
  const hasEmail = Boolean(business?.email?.trim());
  const hasHours = Boolean(businessHours?.isEnabled && businessHours.hours?.length);
  const hasContactDetails = hasAddress || hasPhone || hasEmail || hasHours;

  const hasHeader =
    Boolean(eyebrow) ||
    Boolean(tiptapToText(titleContent).trim()) ||
    Boolean(descriptionText);

  const hasContent = hasHeader || showForm || (showContactInfo && hasContactDetails) || showMap;
  if (!hasContent) return null;

  return (
    <section
      id="contact"
      className={cn('relative overflow-hidden', layout.sectionClass, className)}
      style={{ backgroundColor: colors.pageBackground, fontFamily: fonts.body }}
    >
      <div className="container relative z-10 mx-auto max-w-6xl px-6">
        {hasHeader ? (
          <SectionEditorialHeader
            eyebrow={eyebrow || undefined}
            title={titleContent}
            description={descriptionText || undefined}
            colors={colors}
            fonts={fonts}
            className="mb-6"
          />
        ) : null}

        {showForm ? (
          <div className="mb-6 flex justify-center">
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="group inline-flex items-center justify-center gap-2 rounded-full px-10 py-3.5 text-xs font-bold uppercase tracking-[0.2em] transition-opacity hover:opacity-90"
              style={{
                backgroundColor: colors.primaryButton,
                color: '#ffffff',
                fontFamily: fonts.body,
              }}
            >
              Open contact form
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        ) : null}

        <ContactSideForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />

        {(showContactInfo && hasContactDetails) || showMap ? (
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2 lg:gap-10">
            {showContactInfo && hasContactDetails ? (
              <div
                className="flex flex-col gap-8 rounded-2xl p-7 shadow-sm sm:p-8"
                style={{
                  border: `1px solid ${cardBorder}`,
                  background: cardBackground,
                }}
              >
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  {hasAddress ? (
                    <ContactField label="Address">
                      <p style={{ color: CARD_TEXT }}>
                        {address?.street ? (
                          <>
                            {address.street}
                            <br />
                          </>
                        ) : null}
                        {[address?.city, address?.state, address?.zipCode].filter(Boolean).join(', ')}
                      </p>
                      {mapQuery ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-2 rounded-full border px-6 py-2 text-xs font-medium transition-opacity hover:opacity-80"
                          style={{
                            borderColor: CARD_TEXT,
                            color: CARD_TEXT,
                          }}
                        >
                          View map
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                        </a>
                      ) : null}
                    </ContactField>
                  ) : null}

                  {hasPhone || hasEmail ? (
                    <div className="flex flex-col gap-8">
                      {hasPhone && business?.phone ? (
                        <ContactField label="Phone">
                          <a
                            href={`tel:${business.phone.replace(/\s/g, '')}`}
                            className="transition-opacity hover:opacity-80"
                            style={{ color: CARD_TEXT }}
                          >
                            {business.phone}
                          </a>
                        </ContactField>
                      ) : null}

                      {hasEmail && business?.email ? (
                        <ContactField label="Email">
                          <a
                            href={`mailto:${business.email}`}
                            className="break-all transition-opacity hover:opacity-80"
                            style={{ color: CARD_TEXT }}
                          >
                            {business.email}
                          </a>
                        </ContactField>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {hasHours && businessHours?.hours ? (
                  <ContactField label="Business hours">
                    <div
                      className="mt-1 space-y-2 rounded-xl border p-4"
                      style={{
                        borderColor: cardBorder,
                        backgroundColor: hoursPanelBg,
                      }}
                    >
                      {businessHours.hours.map((day) => (
                        <div
                          key={day.day}
                          className="flex justify-between gap-4 text-sm"
                          style={{ color: CARD_TEXT, fontFamily: fonts.body }}
                        >
                          <span className="font-medium" style={{ color: CARD_TEXT }}>
                            {DAY_LABELS[day.day]}
                          </span>
                          <span>{formatDayHours(day)}</span>
                        </div>
                      ))}
                    </div>
                  </ContactField>
                ) : null}
              </div>
            ) : null}

            {showMap ? (
              <div
                className="relative min-h-[280px] overflow-hidden rounded-2xl border shadow-sm lg:min-h-full"
                style={{ borderColor: cardBorder, backgroundColor: colors.cardBackground }}
              >
                {site?.business?.coordinates?.latitude != null &&
                site?.business?.coordinates?.longitude != null ? (
                  <iframe
                    title="Office location"
                    width="100%"
                    height="100%"
                    className="absolute inset-0 h-full w-full border-0 opacity-95 transition-opacity duration-500 hover:opacity-100"
                    src={`https://maps.google.com/maps?q=${site.business.coordinates.latitude},${site.business.coordinates.longitude}&z=15&output=embed`}
                    allowFullScreen
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="flex h-full min-h-[280px] items-center justify-center px-6 text-center text-sm"
                    style={{ color: colors.secondaryText }}
                  >
                    Map coordinates not configured in the site builder
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default ContactSection;
