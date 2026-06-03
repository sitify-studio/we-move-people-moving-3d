'use client';

import { useState, type FormEvent } from 'react';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import { cn } from '@/app/lib/utils';

type FooterNewsletterProps = {
  title?: string;
  placeholder?: string;
  buttonLabel?: string;
  className?: string;
};

export function FooterNewsletter({
  title = 'Newsletter',
  placeholder = 'Email Goes here',
  buttonLabel = 'Send',
  className,
}: FooterNewsletterProps) {
  const { colors, fonts, layout } = useSectionTheme();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const borderColor = `color-mix(in srgb, ${colors.primaryButton} 35%, transparent)`;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className={className} style={{ fontFamily: fonts.body }}>
      <h3
        className={cn(layout.titleClass, 'font-normal')}
        style={{ ...layout.title, fontFamily: fonts.heading }}
      >
        {title}
      </h3>

      {submitted ? (
        <p className={cn(layout.descriptionClass, 'mt-4')} style={{ ...layout.description, fontFamily: fonts.body }}>
          Thank you for subscribing.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <label className="sr-only" htmlFor="footer-newsletter-email">
            {placeholder}
          </label>
          <input
            id="footer-newsletter-email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            required
            autoComplete="email"
            className="min-w-0 flex-1 rounded-md border bg-transparent px-4 py-2.5 text-sm outline-none transition-colors placeholder:opacity-40 focus:outline-2 focus:outline-offset-1"
            style={{
              color: colors.mainText,
              borderColor,
              fontFamily: fonts.body,
              outlineColor: colors.primaryButton,
            }}
          />
          <button
            type="submit"
            className="shrink-0 rounded-md px-7 py-2.5 text-sm font-normal !text-white transition-opacity hover:opacity-90"
            style={{
              backgroundColor: colors.primaryButton,
              fontFamily: fonts.heading,
            }}
          >
            {buttonLabel}
          </button>
        </form>
      )}
    </div>
  );
}

export default FooterNewsletter;
