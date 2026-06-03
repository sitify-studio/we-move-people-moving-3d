'use client';

import { useRef, type ReactNode } from 'react';
import { cn } from '@/app/lib/utils';
import {
  useSectionScrollReveal,
  type SectionScrollRevealMode,
} from '@/app/hooks/useSectionScrollReveal';

interface SectionScrollRevealProps {
  children: ReactNode;
  className?: string;
  mode?: SectionScrollRevealMode;
  disabled?: boolean;
}

export function SectionScrollReveal({
  children,
  className,
  mode = 'full',
  disabled,
}: SectionScrollRevealProps) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useSectionScrollReveal(wrapRef, { mode, disabled });

  return (
    <div ref={wrapRef} className={cn('section-scroll-reveal', className)}>
      {children}
    </div>
  );
}

export default SectionScrollReveal;
