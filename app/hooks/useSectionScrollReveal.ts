'use client';

import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePrefersReducedMotion } from '@/app/hooks/usePrefersReducedMotion';

gsap.registerPlugin(ScrollTrigger);

export type SectionScrollRevealMode = 'full' | 'header' | 'children';

export interface UseSectionScrollRevealOptions {
  /** Skip when section handles its own scroll animation */
  disabled?: boolean;
  /** full = section + staggered blocks; header = header only (pinned carousels); children = [data-scroll-reveal] only */
  mode?: SectionScrollRevealMode;
  start?: string;
  y?: number;
  duration?: number;
  stagger?: number;
}

const CHILD_SELECTOR = '[data-scroll-reveal], header, .container > *, .container > div > *';

const PINNED_SECTION_IDS = new Set(['services', 'why-choose-us', 'faqs']);

export function useSectionScrollReveal(
  scopeRef: RefObject<HTMLElement | null>,
  options: UseSectionScrollRevealOptions = {}
) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const {
    disabled = false,
    mode = 'full',
    start = 'top 88%',
    y = 32,
    duration = 0.75,
    stagger = 0.1,
  } = options;

  useEffect(() => {
    if (disabled || prefersReducedMotion) return;

    let cleanup: (() => void) | undefined;

    const frame = requestAnimationFrame(() => {
      if (!scopeRef.current) return;

      const root = scopeRef.current;
      const section =
        (root.querySelector('section') as HTMLElement | null) ??
        (root.firstElementChild as HTMLElement | null);
      if (!section || section.dataset.scrollAnimated === 'self') return;

      const resolvedMode =
        mode === 'full' && section.id && PINNED_SECTION_IDS.has(section.id) ? 'header' : mode;

      const ctx = gsap.context(() => {
      const revealEls = section.querySelectorAll<HTMLElement>('[data-scroll-reveal]');
      const header = section.querySelector<HTMLElement>('header');

      if (resolvedMode === 'header' && header) {
        gsap.from(header, {
          opacity: 0,
          y: y * 0.7,
          duration,
          ease: 'power3.out',
          scrollTrigger: { trigger: section, start, once: true },
        });
        return;
      }

      if (resolvedMode === 'children' && revealEls.length > 0) {
        gsap.from(revealEls, {
          opacity: 0,
          y: y * 0.65,
          duration: duration * 0.9,
          stagger,
          ease: 'power3.out',
          scrollTrigger: { trigger: section, start, once: true },
        });
        return;
      }

      if (revealEls.length > 0) {
        gsap.from(section, {
          opacity: 0,
          y: y * 0.5,
          duration: duration * 0.85,
          ease: 'power3.out',
          scrollTrigger: { trigger: section, start, once: true },
        });
        gsap.from(revealEls, {
          opacity: 0,
          y: y * 0.65,
          duration: duration * 0.9,
          stagger,
          ease: 'power3.out',
          scrollTrigger: { trigger: section, start, once: true },
          delay: 0.05,
        });
        return;
      }

      const blocks = Array.from(
        section.querySelectorAll<HTMLElement>(CHILD_SELECTOR)
      ).filter((el, i, arr) => arr.indexOf(el) === i && !el.closest('[data-scroll-reveal-ignore]'));

      if (blocks.length > 1) {
        gsap.from(section, {
          opacity: 0,
          y: y * 0.45,
          duration: duration * 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: section, start, once: true },
        });
        gsap.from(blocks, {
          opacity: 0,
          y,
          duration,
          stagger,
          ease: 'power3.out',
          scrollTrigger: { trigger: section, start, once: true },
        });
        return;
      }

      gsap.from(section, {
        opacity: 0,
        y,
        duration,
        ease: 'power3.out',
        scrollTrigger: { trigger: section, start, once: true },
      });
      }, root);

      cleanup = () => ctx.revert();
    });

    return () => {
      cancelAnimationFrame(frame);
      cleanup?.();
    };
  }, [disabled, prefersReducedMotion, mode, start, y, duration, stagger]);
}
