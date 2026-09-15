'use client';

import { useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
  threshold?: number;
  once?: boolean;
}

/**
 * Checks a node's own position against the viewport, independent of
 * IntersectionObserver. Used as a fallback so a card can never get stuck
 * invisible if the observer's callback is delayed or dropped (seen in
 * production on long pages: entries queued behind other observers/mutations
 * sometimes never flush before the user has already scrolled past).
 */
function isElementInViewport(node: Element, threshold: number) {
  const rect = node.getBoundingClientRect();
  if (rect.height === 0 && rect.width === 0) return false;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const visibleTop = Math.max(rect.top, 0);
  const visibleBottom = Math.min(rect.bottom, viewportHeight);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);
  return visibleHeight / rect.height >= threshold;
}

/** Tracks whether an element has scrolled into the viewport, for scroll-triggered animations. */
export function useInView<T extends HTMLElement>({ threshold = 0.3, once = true }: UseInViewOptions = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true);
      return;
    }

    let settled = false;
    const reveal = () => {
      if (settled && once) return;
      settled = true;
      setInView(true);
    };
    const hide = () => {
      if (!once) setInView(false);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          if (once) observer.disconnect();
        } else {
          hide();
        }
      },
      { threshold },
    );
    observer.observe(node);

    // Fallback: IntersectionObserver callbacks can be delayed indefinitely
    // behind other observers/DOM churn elsewhere on the page. A cheap manual
    // check on scroll/resize (plus once right away, for content already in
    // view on mount) guarantees this never gets stuck at opacity: 0.
    const checkManually = () => {
      if (settled && once) return;
      if (isElementInViewport(node, threshold)) {
        reveal();
        if (once) {
          observer.disconnect();
          window.removeEventListener('scroll', checkManually);
          window.removeEventListener('resize', checkManually);
        }
      } else {
        hide();
      }
    };

    checkManually();
    window.addEventListener('scroll', checkManually, { passive: true });
    window.addEventListener('resize', checkManually);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', checkManually);
      window.removeEventListener('resize', checkManually);
    };
  }, [threshold, once]);

  return { ref, inView };
}
