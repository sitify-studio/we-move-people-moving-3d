'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import type { Page } from '@/app/lib/types';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { tiptapToText } from '@/app/lib/seo';
import { cn, resolveTextOnBackground, TIPTAP_INHERIT } from '@/app/lib/utils';
import { TiptapRenderer } from '@/app/components/ui/TiptapRenderer';
import { parseEditorialHeroLines } from '@/app/components/sections/EditorialHeroTypography';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import type { ThemeColors } from '@/app/hooks/useTheme';

gsap.registerPlugin(ScrollTrigger);

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

function FaqCarouselCard({
  item,
  active,
  onSelect,
  colors,
  fonts,
  inactiveQuestionColor,
}: {
  item: FaqItem;
  active: boolean;
  onSelect: () => void;
  colors: ThemeColors;
  fonts: { heading: string; body: string };
  inactiveQuestionColor: string;
}) {
  const inactiveBg = `color-mix(in srgb, ${colors.sectionBackgroundLight} 88%, ${colors.cardBackground})`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'faq-carousel-card relative flex shrink-0 flex-col overflow-hidden rounded-[28px] text-left transition-[transform,box-shadow] duration-500',
        active 
          ? 'min-h-[400px] w-[min(88vw,340px)] scale-100 shadow-xl sm:min-h-[440px] sm:w-[360px]' 
          : 'min-h-[360px] w-[min(78vw,280px)] scale-[0.94] opacity-90 sm:min-h-[400px] sm:w-[300px]'
      )}
      style={{
        backgroundColor: active ? colors.primaryButton : inactiveBg,
        boxShadow: active
          ? `0 24px 48px color-mix(in srgb, ${colors.primaryButton} 28%, transparent)`
          : `0 8px 24px color-mix(in srgb, ${colors.mainText} 6%, transparent)`,
      }}
      aria-current={active ? 'true' : undefined}
    >
      <div
        className={cn(
          'flex h-full flex-col p-7 sm:p-8',
          active ? 'justify-center gap-6' : 'justify-end'
        )}
      >
        <h3
          className={cn(
            'font-bold leading-snug tracking-tight',
            active ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
          )}
          style={{
            color: active ? '#ffffff' : inactiveQuestionColor,
            fontFamily: fonts.heading,
          }}
        >
          {item.questionContent && typeof item.questionContent === 'object' ? (
            <TiptapRenderer content={item.questionContent} as="inline" className={TIPTAP_INHERIT} />
          ) : (
            item.question
          )}
        </h3>

        {active && (item.answer || item.answerContent) ? (
          <div
            className="text-sm leading-relaxed sm:text-[0.95rem]"
            style={{ color: 'color-mix(in srgb, #ffffff 88%, transparent)', fontFamily: fonts.body }}
          >
            {item.answerContent && typeof item.answerContent === 'object' ? (
              <TiptapRenderer content={item.answerContent} as="inline" className={TIPTAP_INHERIT} />
            ) : (
              item.answer
            )}
          </div>
        ) : null}
      </div>
    </button>
  );
}

function FaqNavButton({
  direction,
  onClick,
  disabled,
  filled,
  colors,
}: {
  direction: 'prev' | 'next';
  onClick: () => void;
  disabled?: boolean;
  filled?: boolean;
  colors: ThemeColors;
}) {
  const Icon = direction === 'prev' ? ArrowLeft : ArrowRight;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300',
        'disabled:pointer-events-none disabled:opacity-35',
        !filled && 'hover:opacity-90'
      )}
      style={
        filled
          ? {
              borderColor: colors.mainText,
              backgroundColor: colors.mainText,
              color: colors.pageBackground,
            }
          : {
              borderColor: `color-mix(in srgb, ${colors.mainText} 35%, transparent)`,
              backgroundColor: colors.pageBackground,
              color: colors.mainText,
            }
      }
    >
      <Icon className="h-5 w-5" strokeWidth={2} />
    </button>
  );
}

export function FAQSection({ faqSection, className }: FAQSectionProps) {
  const { site } = useWebBuilder();
  const { colors, fonts, layout } = useSectionTheme();

  const sectionBackground =
    site?.theme?.pageBackgroundColor?.trim() || colors.pageBackground;

  const headerText = useMemo(
    () =>
      resolveTextOnBackground(sectionBackground, {
        primary: [
          colors.secondaryText,
          colors.primaryButton,
          colors.inactiveDark,
          colors.inactive,
        ],
        secondary: [colors.secondaryText, colors.inactive, colors.inactiveDark],
      }),
    [sectionBackground, colors]
  );
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const faqItems = useMemo((): FaqItem[] => {
    return (
      faqSection?.items
        ?.map((item) => normalizeFaqItem(item))
        .filter((item): item is FaqItem => Boolean(item)) ?? []
    );
  }, [faqSection?.items]);

  const count = faqItems.length;

  const updateCarouselPosition = useCallback(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport || count < 1) return;

    const trackWidth = track.scrollWidth;
    const viewWidth = viewport.clientWidth;

    if (trackWidth <= viewWidth) {
      gsap.to(track, { x: 0, duration: 0.55, ease: 'power3.out' });
      return;
    }

    const card = track.children[index] as HTMLElement | undefined;
    if (!card) return;

    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const viewCenter = viewWidth / 2;
    let x = viewCenter - cardCenter;

    const maxX = 0;
    const minX = viewWidth - trackWidth;
    x = Math.max(minX, Math.min(maxX, x));

    gsap.to(track, {
      x,
      duration: 0.55,
      ease: 'power3.out',
    });
  }, [index, count]);

  useEffect(() => {
    updateCarouselPosition();
    const id = requestAnimationFrame(() => updateCarouselPosition());
    return () => cancelAnimationFrame(id);
  }, [index, updateCarouselPosition, count]);

  useEffect(() => {
    const onResize = () => updateCarouselPosition();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [updateCarouselPosition]);

  const goTo = useCallback((next: number) => {
    if (count < 1) return;
    setIndex(((next % count) + count) % count);
  }, [count]);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  if (faqSection?.enabled === false) return null;

  const titleContent = faqSection?.title;
  const descriptionContent = faqSection?.description;
  const hasDescription = !!tiptapToText(descriptionContent).trim();

  return (
    <section
      ref={containerRef}
      id="faqs"
      className={cn('overflow-hidden', layout.sectionClass, className)}
      style={{ backgroundColor: colors.pageBackground, fontFamily: fonts.body }}
      onTouchStart={(e) => (touchStartX.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        if (touchStartX.current == null || count <= 1) return;
        const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
        if (Math.abs(delta) > 50) delta < 0 ? next() : prev();
      }}
    >
      <div className="container mx-auto max-w-6xl px-6">
        {/* Header Grid - Fixed Alignment */}
        <header
          data-scroll-reveal
          className="mb-6 grid grid-cols-1 items-start gap-4 md:grid-cols-12 md:gap-6"
        >
          <div className="md:col-span-6 lg:col-span-7">
            {titleContent && tiptapToText(titleContent).trim() ? (
              <h2
                className={layout.titleClass}
                style={{ color: headerText.primary, fontFamily: fonts.heading }}
              >
                <FaqTitle
                  content={titleContent}
                  titleColor={headerText.primary}
                  accentColor={colors.primaryButton}
                />
              </h2>
            ) : null}
          </div>

          <div className="flex flex-col gap-6 md:col-span-6 md:items-end lg:col-span-5">
            {hasDescription && (
              <div
                className={cn(layout.descriptionClass, 'max-w-md md:text-right')}
                style={{ color: headerText.secondary, fontFamily: fonts.body }}
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
            )}

            {count > 1 && (
              <div className="flex gap-3">
                <FaqNavButton direction="prev" onClick={prev} colors={colors} />
                <FaqNavButton direction="next" onClick={next} filled colors={colors} />
              </div>
            )}
          </div>
        </header>

        {/* Carousel Track */}
        {count > 0 && (
          <div
            ref={viewportRef}
            data-scroll-reveal
            className="-mx-6 overflow-hidden px-6 md:-mx-0 md:px-0"
          >
            <div
              ref={trackRef}
              className="flex w-max items-stretch gap-5 py-4 sm:gap-6"
              style={{ willChange: 'transform' }}
            >
              {faqItems.map((item, i) => (
                <FaqCarouselCard
                  key={faqKey(item, i)}
                  item={item}
                  active={i === index}
                  onSelect={() => goTo(i)}
                  colors={colors}
                  fonts={fonts}
                  inactiveQuestionColor={headerText.primary}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default FAQSection;