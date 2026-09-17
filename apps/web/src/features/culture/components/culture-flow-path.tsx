'use client';

import { useId, useLayoutEffect, useRef } from 'react';
import { ensureGsapRegistered, gsap, ScrollTrigger } from '@/lib/gsap';
import styles from './culture-flow-path.module.css';

interface GradientStop {
  offset: string;
  color: string;
}

interface CultureFlowPathProps {
  /** Cubic-bezier `d` attribute for the ≥768px viewport. */
  desktopPath: string;
  /** Cubic-bezier `d` attribute for the <768px viewport — a different route, not a squashed desktop path. */
  mobilePath: string;
  desktopViewBox: string;
  mobileViewBox: string;
  /** Shared with neighboring segments' start/end stops so the line reads as one continuous gradient. */
  stops: GradientStop[];
  /** Which edge of the host section the SVG hugs when its aspect ratio doesn't fill the section's full height. */
  anchor?: 'top' | 'bottom';
  className?: string;
}

/**
 * One tramo of the page-wide decorative flow line on `/cultura`. Purely
 * decorative (aria-hidden, pointer-events: none) — never admin-managed,
 * unlike the page's editorial copy. Always `position: absolute; z-index:
 * -1` within its host section (see culture.module.css) so it paints above
 * that section's own background but below its in-flow content, without
 * that content needing any `position`/`z-index` of its own — the same
 * negative-z-index trick `ParallaxBackground` already uses site-wide.
 *
 * `width: 100%; height: auto` (never `preserveAspectRatio="none"` or a
 * forced 100% height) — scales uniformly with viewport width so the curve's
 * proportions and stroke weight never distort against a host section whose
 * height is content-driven, not fixed.
 */
export function CultureFlowPath({
  desktopPath,
  mobilePath,
  desktopViewBox,
  mobileViewBox,
  stops,
  anchor = 'top',
  className = '',
}: CultureFlowPathProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const desktopPathRef = useRef<SVGPathElement>(null);
  const mobilePathRef = useRef<SVGPathElement>(null);
  const gradientId = useId().replace(/:/g, '');

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const wrap = wrapRef.current;
    if (!wrap) return;

    // Accessibility (brief): reduced motion keeps the line visible, fully
    // drawn, with no draw-in reveal and no scroll-linked changes at all.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    ensureGsapRegistered();

    const ctx = gsap.context(() => {
      [desktopPathRef.current, mobilePathRef.current].forEach((path) => {
        if (!path) return;
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(path, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: wrap,
            start: 'top 90%',
            end: 'bottom 55%',
            scrub: 0.6,
          },
        });
      });
    }, wrap);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('resize', refresh);

    return () => {
      window.removeEventListener('resize', refresh);
      ctx.revert();
    };
  }, [desktopPath, mobilePath]);

  return (
    <div ref={wrapRef} className={`${styles.wrap} ${className}`} data-anchor={anchor} aria-hidden="true">
      <svg
        className={styles.svgDesktop}
        viewBox={desktopViewBox}
        fill="none"
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient
            id={`${gradientId}-d`}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2={desktopViewBox.split(' ')[2]}
            y2={desktopViewBox.split(' ')[3]}
          >
            {stops.map((stop) => (
              <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
        </defs>
        <path
          d={desktopPath}
          className={styles.pathBlur}
          stroke={`url(#${gradientId}-d)`}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          ref={desktopPathRef}
          d={desktopPath}
          className={styles.pathMain}
          stroke={`url(#${gradientId}-d)`}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <svg
        className={styles.svgMobile}
        viewBox={mobileViewBox}
        fill="none"
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient
            id={`${gradientId}-m`}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2={mobileViewBox.split(' ')[2]}
            y2={mobileViewBox.split(' ')[3]}
          >
            {stops.map((stop) => (
              <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
        </defs>
        <path
          d={mobilePath}
          className={styles.pathBlur}
          stroke={`url(#${gradientId}-m)`}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          ref={mobilePathRef}
          d={mobilePath}
          className={styles.pathMain}
          stroke={`url(#${gradientId}-m)`}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
