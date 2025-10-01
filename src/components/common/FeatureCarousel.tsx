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
  const isAutoScrolling = useRef(false); // guard so onScroll won't fight programmatic scroll
  const [index, setIndex] = useState(0);
  const [isHover, setIsHover] = useState(false);

  const goTo = useCallback(
    (i: number) => {
      const el = containerRef.current;
      if (!el || slides.length === 0) return;

      const next = (i + slides.length) % slides.length;
      const width = el.clientWidth;

      isAutoScrolling.current = true;
      el.scrollTo({ left: next * width, behavior: 'smooth' });
      setIndex(next);
    },
    [slides.length]
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Update index when user scrolls (manual swipe/drag)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      if (isAutoScrolling.current) return; // ignore programmatic scrolls
      const width = el.clientWidth || 1;
      const current = Math.round(el.scrollLeft / width);
      if (current !== index) setIndex(current);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [index]);

  // Clear auto-scroll guard on 'scrollend' (with fallback timer)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const clearGuard = () => {
      isAutoScrolling.current = false;
    };

    // Fallback for browsers without 'scrollend'
    let fallback: number | undefined;
    const startFallbackTimer = () => {
      if (fallback) window.clearTimeout(fallback);
      // Allow time for smooth scroll + snap to settle
      fallback = window.setTimeout(() => {
        isAutoScrolling.current = false;
      }, 600);
    };

    const onAnyScroll = () => {
      // If we're auto-scrolling, keep nudging the fallback timer
      if (isAutoScrolling.current) startFallbackTimer();
    };

    el.addEventListener('scrollend', clearGuard);
    el.addEventListener('scroll', onAnyScroll, { passive: true });

    return () => {
      el.removeEventListener('scrollend', clearGuard);
      el.removeEventListener('scroll', onAnyScroll);
      if (fallback) window.clearTimeout(fallback);
    };
  }, []);

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

  // Autoplay (paused on hover)
  useEffect(() => {
    if (slides.length <= 1) return;
    if (isHover) return;
    const t = window.setInterval(next, autoPlayMs);
    return () => window.clearInterval(t);
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
        className='w-full h-full overflow-x-auto overflow-y-hidden no-scrollbar snap-x snap-mandatory snap-always scroll-smooth'
      >
        <div className='flex flex-nowrap w-full h-full'>
          {slides.map((s, i) => (
            <div
              key={i}
              className='relative h-full flex-[0_0_100%] snap-start'
              aria-hidden={index !== i}
              aria-roledescription='slide'
              aria-label={`${i + 1} of ${slides.length}`}
            >
              <img
                src={s.src}
                alt={s.alt}
                className='block w-full h-full object-contain'
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
