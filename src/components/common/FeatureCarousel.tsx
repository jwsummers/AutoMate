import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Slide = {
  src: string;
  alt: string;
  caption?: string;
};

interface FeatureCarouselProps {
  slides: Slide[];
  autoPlayMs?: number; // e.g., 4000
  className?: string;
}

export function FeatureCarousel({
  slides,
  autoPlayMs = 4000,
  className = '',
}: FeatureCarouselProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const [isHover, setIsHover] = useState(false);

  const goTo = useCallback(
    (i: number) => {
      const el = containerRef.current;
      if (!el) return;
      const max = slides.length - 1;
      const next = (i + slides.length) % slides.length;
      const width = el.clientWidth;
      el.scrollTo({ left: next * width, behavior: 'smooth' });
      setIndex(Math.min(Math.max(next, 0), max));
    },
    [slides.length]
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Update index when user scrolls (swipe)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const width = el.clientWidth || 1;
      const current = Math.round(el.scrollLeft / width);
      if (current !== index) setIndex(current);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [index]);

  // Keep correct position on resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onResize = () => {
      const width = el.clientWidth;
      el.scrollTo({ left: index * width });
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [index]);

  // Autoplay
  useEffect(() => {
    if (slides.length <= 1 || isHover) return;
    const t = setInterval(next, autoPlayMs);
    return () => clearInterval(t);
  }, [slides.length, isHover, next, autoPlayMs]);

  // Keyboard arrows when carousel focused
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  };

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      onKeyDown={onKeyDown}
      tabIndex={0}
      aria-roledescription='carousel'
      aria-label='Feature screenshots'
    >
      {/* Slides container */}
      <div
        ref={containerRef}
        className='w-full h-full overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth'
      >
        <div className='flex w-full h-full'>
          {slides.map((s, i) => (
            <div
              key={i}
              className='min-w-full snap-start relative'
              aria-hidden={index !== i}
              aria-roledescription='slide'
              aria-label={`${i + 1} of ${slides.length}`}
            >
              <img
                src={s.src}
                alt={s.alt}
                className='w-full h-full object-cover'
                draggable={false}
              />
              {s.caption ? (
                <div className='absolute bottom-3 left-3 right-3 bg-black/40 text-white text-sm px-3 py-2 rounded-md backdrop-blur'>
                  {s.caption}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button
            type='button'
            onClick={prev}
            className='absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center'
            aria-label='Previous slide'
          >
            <ChevronLeft className='w-5 h-5' />
          </button>
          <button
            type='button'
            onClick={next}
            className='absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center'
            aria-label='Next slide'
          >
            <ChevronRight className='w-5 h-5' />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className='absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2'>
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-2.5 rounded-full transition-all ${
                index === i
                  ? 'w-6 bg-white'
                  : 'w-2.5 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
