'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Page } from '@/app/lib/types';
import { tiptapToText } from '@/app/lib/seo';
import { cn, TIPTAP_INHERIT } from '@/app/lib/utils';
import { TiptapRenderer } from '@/app/components/ui/TiptapRenderer';
import { parseEditorialHeroLines } from '@/app/components/sections/EditorialHeroTypography';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import type { ThemeColors } from '@/app/hooks/useTheme';

interface FAQSectionProps {
  faqSection?: Page['faqSection'];
  className?: string;
}

type FaqItem = {
  question: string;
  answer: string;
  questionContent?: unknown;
  answerContent?: unknown;
};

const FAQ_TEXT = '#ffffff';

function FaqTitle({
  content,
  titleColor,
  accentColor,
}: {
  content: unknown;
  titleColor: string;
  accentColor: string;
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
              color: segment.kind === 'script' ? accentColor : titleColor,
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
  if (!text) return null;

  const words = text.split(/\s+/);
  if (words.length >= 2) {
    const last = words.pop();
    return (
      <>
        <span style={{ color: titleColor }}>{words.join(' ')} </span>
        <span style={{ color: accentColor }}>{last}</span>
      </>
    );
  }

  return <span style={{ color: titleColor }}>{text}</span>;
}

function normalizeFaqItem(item: { question?: unknown; answer?: unknown }): FaqItem | null {
  const question = tiptapToText(item.question).trim();
  const answer = tiptapToText(item.answer).trim();
  if (!question && !answer) return null;
  return {
    question,
    answer,
    questionContent: item.question,
    answerContent: item.answer,
  };
}

function faqKey(item: FaqItem, index: number): string {
  return `${index}-${item.question.slice(0, 48)}`;
}

function FaqAccordionItem({
  item,
  index,
  open,
  onToggle,
  colors,
  fonts,
}: {
  item: FaqItem;
  index: number;
  open: boolean;
  onToggle: () => void;
  colors: ThemeColors;
  fonts: { heading: string; body: string };
}) {
  const accent = colors.primaryButton;
  const expandedBorder = `color-mix(in srgb, ${accent} 25%, transparent)`;
  const formattedIndex = String(index + 1).padStart(2, '0');

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[24px] transition-all duration-300 border text-left w-full',
        open ? 'shadow-md scale-[1.01]' : 'shadow-none hover:scale-[1.005]'
      )}
      style={{
        backgroundColor: open ? colors.pageBackground : accent,
        borderColor: open ? expandedBorder : 'transparent',
      }}
    >
      {/* Background Embellishments to unify alignment depth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        <div 
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M32 0v32H0V0h32zM1 1v30h30V1H1z' fill='%23000000' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Subtle geometric clean ring motif */}
        <div 
          className={cn(
            "absolute -right-6 -top-6 w-24 h-24 rounded-full border transition-transform duration-500",
            open ? "border-current opacity-[0.06] scale-110" : "border-white/10 scale-100"
          )}
          style={{ color: open ? colors.mainText : undefined }}
        />
      </div>

      {/* Accordion Layout Wrapper */}
      <div className="relative z-10 flex flex-col w-full">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-start justify-between gap-5 p-6 text-left sm:p-7"
          aria-expanded={open}
        >
          {/* Aligned Numeric Index + Question Content Block */}
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <span 
              className={cn(
                "text-xs font-mono tracking-wider pt-1 shrink-0 select-none opacity-40",
                open ? "text-current" : "text-white"
              )}
              style={{ color: open ? colors.mainText : undefined }}
            >
              {formattedIndex}
            </span>
            <h3
              className="min-w-0 flex-1 text-base font-bold leading-snug sm:text-lg"
              style={{
                color: open ? colors.mainText : FAQ_TEXT,
                fontFamily: fonts.heading,
              }}
            >
              {item.questionContent && typeof item.questionContent === 'object' ? (
                <TiptapRenderer content={item.questionContent} as="inline" className={TIPTAP_INHERIT} />
              ) : (
                item.question
              )}
            </h3>
          </div>

          {/* Action Trigger Icon */}
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300"
            style={{
              backgroundColor: open ? accent : 'rgba(255, 255, 255, 0.15)',
              color: open ? FAQ_TEXT : '#ffffff',
            }}
            aria-hidden
          >
            {open ? (
              <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
            ) : (
              <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
            )}
          </span>
        </button>

        {/* Collapsible Panel Section */}
        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-300 ease-out',
            open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          )}
        >
          <div className="overflow-hidden">
            {(item.answer || item.answerContent) ? (
              <div 
                className="flex items-start gap-4 px-6 pb-6 sm:px-7 sm:pb-7 text-sm leading-relaxed sm:text-[0.95rem]"
                style={{ color: colors.secondaryText, fontFamily: fonts.body }}
              >
                {/* Horizontal Spacer Element keeping alignments perfectly mirrored */}
                <div className="w-[1.4rem] shrink-0 select-none hidden sm:block" aria-hidden />
                
                <div className="flex-1 min-w-0">
                  {item.answerContent && typeof item.answerContent === 'object' ? (
                    <TiptapRenderer content={item.answerContent} as="inline" className={TIPTAP_INHERIT} />
                  ) : (
                    item.answer
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FAQSection({ faqSection, className }: FAQSectionProps) {
  const { colors, fonts, layout } = useSectionTheme();
  const [openIndex, setOpenIndex] = useState(0);

  const faqItems = useMemo((): FaqItem[] => {
    return (
      faqSection?.items
        ?.map((item) => normalizeFaqItem(item))
        .filter((item): item is FaqItem => Boolean(item)) ?? []
    );
  }, [faqSection?.items]);

  const titleContent = faqSection?.title;
  const descriptionContent = faqSection?.description;
  const hasTitle = !!tiptapToText(titleContent).trim();
  const hasDescription = !!tiptapToText(descriptionContent).trim();
  const count = faqItems.length;

  if (faqSection?.enabled === false) return null;
  if (!hasTitle && !hasDescription && count === 0) return null;

  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? -1 : i));

  return (
    <section
      id="faqs"
      className={cn(layout.sectionClass, className)}
      style={{ backgroundColor: colors.pageBackground, fontFamily: fonts.body }}
    >
      <div className="container mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-20">
          {/* Left column — sticky while accordion scrolls (lg+) */}
          <div className="max-w-xl self-start lg:sticky lg:top-[5.25rem] lg:z-[1]">
            <header data-scroll-reveal>
            <span
              className="inline-flex rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em]"
              style={{
                borderColor: colors.primaryButton,
                color: colors.primaryButton,
                fontFamily: fonts.body,
              }}
            >
              FAQ
            </span>

            {hasTitle ? (
              <h2
                className={cn(layout.titleClass, 'mt-5')}
                style={{ ...layout.title, fontFamily: fonts.heading }}
              >
                <FaqTitle
                  content={titleContent}
                  titleColor={colors.mainText}
                  accentColor={colors.primaryButton}
                />
              </h2>
            ) : null}

            {hasDescription ? (
              <div
                className={cn(layout.descriptionClass, 'mt-4 max-w-md')}
                style={{ ...layout.description, fontFamily: fonts.body }}
              >
                {typeof descriptionContent === 'object' ? (
                  <TiptapRenderer
                    content={descriptionContent}
                    as="inline"
                    className={TIPTAP_INHERIT}
                  />
                ) : (
                  descriptionContent
                )}
              </div>
            ) : null}
            </header>
          </div>

          {/* Right column — accordion */}
          {count > 0 ? (
            <div data-scroll-reveal className="flex flex-col gap-4 w-full">
              {faqItems.map((item, i) => (
                <FaqAccordionItem
                  key={faqKey(item, i)}
                  item={item}
                  index={i}
                  open={openIndex === i}
                  onToggle={() => toggle(i)}
                  colors={colors}
                  fonts={fonts}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default FAQSection;