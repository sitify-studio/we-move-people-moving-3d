'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Plus } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Page } from '@/app/lib/types';
import { tiptapToText } from '@/app/lib/seo';
import { cn, getImageSrc } from '@/app/lib/utils';
import { OptimizedImage } from '@/app/components/ui/OptimizedImage';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
gsap.registerPlugin(ScrollTrigger);

interface GallerySectionProps {
  gallerySection?: Page['gallerySection'];
  className?: string;
}

type GalleryItem = {
  id: string;
  img: string;
  alt: string;
  aspect: 'portrait' | 'landscape' | 'square';
};

export function GallerySection({ gallerySection, className }: GallerySectionProps) {
  const { colors, fonts, layout } = useSectionTheme();
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  
  const containerRef = useRef<HTMLElement>(null);
  const colLeftRef = useRef<HTMLDivElement>(null);
  const colCenterRef = useRef<HTMLDivElement>(null);
  const colRightRef = useRef<HTMLDivElement>(null);

  const items = useMemo((): GalleryItem[] => {
    return (
      gallerySection?.images
        ?.filter((image) => image?.url?.trim())
        .map((image, index) => {
          const aspects: ('portrait' | 'landscape' | 'square')[] = ['portrait', 'square', 'landscape', 'portrait'];
          return {
            id: `gallery-${index}`,
            img: getImageSrc(image.url),
            alt: image.altText || 'Gallery Image',
            aspect: aspects[index % aspects.length],
          };
        }) ?? []
    );
  }, [gallerySection?.images]);

  /** Assign each image to the shortest column so the right side stays filled. */
  const columns = useMemo(() => {
    if (items.length === 0) return [] as GalleryItem[][];
    if (items.length === 1) return [items];
    if (items.length === 2) return [items.slice(0, 1), items.slice(1)];

    const cols: GalleryItem[][] = [[], [], []];
    const heights = [0, 0, 0];

    const aspectWeight = (aspect: GalleryItem['aspect']) => {
      if (aspect === 'portrait') return 1.35;
      if (aspect === 'square') return 1;
      return 0.72;
    };

    for (const item of items) {
      const target = heights.indexOf(Math.min(...heights));
      cols[target].push(item);
      heights[target] += aspectWeight(item.aspect);
    }

    return cols;
  }, [items]);

  const columnRefs = [colLeftRef, colCenterRef, colRightRef];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax movement for columns
      const mm = gsap.matchMedia();
      
      mm.add("(min-width: 768px)", () => {
        const parallax = [
          { el: colLeftRef.current, y: -120 },
          { el: colCenterRef.current, y: -50 },
          { el: colRightRef.current, y: -160 },
        ];

        parallax.forEach(({ el, y }) => {
          if (!el) return;
          gsap.to(el, {
            y,
            ease: 'none',
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          });
        });
      });

      // Reveal animation for all images
      gsap.fromTo(".gallery-card-inner", 
        { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.2 },
        { 
          clipPath: 'inset(0% 0% 0% 0%)', 
          scale: 1,
          duration: 1.5,
          ease: "power4.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
          }
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [items, columns.length]);

  if (gallerySection?.enabled === false || items.length === 0) return null;

  return (
    <section
      ref={containerRef}
      id="gallery"
      data-scroll-animated="self"
      className={cn('relative overflow-hidden', layout.sectionClass, className)}
      style={{ backgroundColor: colors.pageBackground, fontFamily: fonts.body }}
    >
      <div className="container relative z-10 mx-auto px-6">
        {/* Header Section */}
        <header className={layout.headerClass}>
          {gallerySection?.title && (
            <h2
              className={layout.titleClass}
              style={{ ...layout.title, fontFamily: fonts.heading }}
            >
              {tiptapToText(gallerySection.title)}
            </h2>
          )}
          {gallerySection?.description && (
            <p
              className={cn(layout.descriptionClass, 'mt-2 max-w-xl')}
              style={{ ...layout.description, fontFamily: fonts.body }}
            >
              {tiptapToText(gallerySection.description)}
            </p>
          )}
        </header>

        {/* Masonry-style columns — balanced fill, no empty right gap */}
        <div
          className={cn(
            'grid w-full grid-cols-1 gap-4 md:gap-6',
            columns.length === 2 && 'md:grid-cols-2',
            columns.length >= 3 && 'md:grid-cols-3'
          )}
        >
          {columns.map((columnItems, colIdx) => (
            <div
              key={`gallery-col-${colIdx}`}
              ref={columnRefs[colIdx]}
              className="flex min-w-0 flex-col gap-4 md:gap-6"
            >
              {columnItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="gallery-card-inner relative overflow-hidden">
                    <div className={cn(
                      "relative w-full transition-transform duration-700 group-hover:scale-110",
                      item.aspect === 'portrait' ? 'aspect-[3/4]' : item.aspect === 'square' ? 'aspect-square' : 'aspect-[4/3]'
                    )}>
                      <OptimizedImage
                        src={item.img}
                        alt={item.alt}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
                        <Plus className="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-2xl transition-all"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
          onClick={() => setSelectedItem(null)}
        >
          <button 
            className="absolute right-8 top-8 text-white/50 transition-colors hover:text-white"
            onClick={() => setSelectedItem(null)}
          >
            <X className="h-10 w-10" />
          </button>
          
          <div className="relative max-h-[80vh] max-w-5xl overflow-hidden rounded-lg">
            <img 
              src={selectedItem.img} 
              alt={selectedItem.alt} 
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      )}
    </section>
  );
}

export default GallerySection;