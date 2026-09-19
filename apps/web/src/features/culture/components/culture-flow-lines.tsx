'use client';

import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ensureGsapRegistered, gsap, ScrollTrigger } from '@/lib/gsap';
import styles from './culture-flow-lines.module.css';

/** Colors the line cycles through, top to bottom, so it keeps changing color as you scroll. */
const PALETTE = ['#315CF4', '#7370FF', '#3CD8C5', '#6F8FFF'] as const;

const DESKTOP_SEGMENT = 900;
const MOBILE_SEGMENT = 620;
const COLOR_BAND = 600;
const STATION_POOL = 40;

type Size = { width: number; height: number };

/**
 * One "station" the line passes through: how far below the previous one,
 * where across the page (as a fraction of its width; <0 or >1 is off-screen),
 * and how tightly the curve bends getting there.
 */
type Station = { drop: number; x: number; tension: number };

/**
 * A fresh random route (different on every page load). The line always
 * enters from beyond the top-right corner of the screen (heading left, into
 * the page). From there it keeps alternating between two kinds of stretches:
 * crossing the page, and swinging well *outside* the screen — far beyond the
 * left or right edge, chosen at random, sometimes staying away for two
 * stretches in a row — before curling back in. How often it leaves, which
 * side, how far, how long it stays away and how tightly each stretch bends are
 * all random, so no two stretches look alike.
 */
function randomRoute(): Station[] {
  const between = (min: number, max: number) => min + Math.random() * (max - min);
  const inside = () => between(0.1, 0.9);
  const outsideOn = (side: -1 | 1) => (side < 0 ? -between(0.25, 0.7) : 1 + between(0.25, 0.7));
  const tension = () => between(0.3, 0.7);
  const isOutside = (x: number) => x < 0 || x > 1;

  // First station: off-screen right. Second: inside, so the opening stretch
  // always sweeps leftwards into view.
  const stations: Station[] = [
    { drop: 0, x: 1.1, tension: 0.5 },
    { drop: between(0.7, 1.1), x: between(0.08, 0.5), tension: tension() },
  ];

  while (stations.length < STATION_POOL) {
    const previous = stations[stations.length - 1];

    if (isOutside(previous.x)) {
      // Still away from the screen: sometimes it stays out for one more
      // stretch (same side), otherwise it comes back in.
      const stayOut = stations.length >= 3 && !isOutside(stations[stations.length - 2].x) && Math.random() < 0.4;
      if (stayOut) {
        stations.push({ drop: between(0.5, 1.4), x: outsideOn(previous.x < 0 ? -1 : 1), tension: tension() });
        continue;
      }
    } else if (Math.random() < 0.6) {
      stations.push({ drop: between(0.5, 1.4), x: outsideOn(Math.random() < 0.5 ? -1 : 1), tension: tension() });
      continue;
    }

    let x = inside();
    for (let attempt = 0; attempt < 8 && !isOutside(previous.x) && Math.abs(x - previous.x) < 0.3; attempt += 1) {
      x = inside();
    }
    stations.push({ drop: between(0.4, 1.3), x, tension: tension() });
  }
  return stations;
}

function buildPath(route: readonly Station[], { width, height }: Size, segment: number): string {
  // Starts a little below the very top so the entry reads as coming in from
  // the upper-right side, not straight down from the top edge.
  const entryY = Math.min(height * 0.02, 90);
  const points: { x: number; y: number; tension: number }[] = [
    { x: route[0].x * width, y: entryY, tension: route[0].tension },
  ];
  let y = entryY;

  for (let k = 1; k < route.length; k += 1) {
    y += route[k].drop * segment;
    if (y >= height - segment * 0.35) break;
    points.push({ x: route[k].x * width, y, tension: route[k].tension });
  }

  // Leaves the page beyond the side edge opposite the last station.
  const last = points[points.length - 1];
  points.push({ x: last.x < width / 2 ? width * 1.1 : width * -0.1, y: height, tension: 0.5 });

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let k = 1; k < points.length; k += 1) {
    const from = points[k - 1];
    const to = points[k];
    const rise = (to.y - from.y) * to.tension;
    // The opening stretch leaves the corner sideways, heading left (horizontal tangent);
    // every other stretch leaves vertically, like an S-curve.
    const startControl =
      k === 1
        ? `${(from.x - width * 0.45).toFixed(1)} ${(from.y + rise * 0.1).toFixed(1)}`
        : `${from.x.toFixed(1)} ${(from.y + rise).toFixed(1)}`;
    d += ` C ${startControl}, ${to.x.toFixed(1)} ${(to.y - rise).toFixed(1)}, ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
  }
  return d;
}

function gradientStops(height: number) {
  const count = Math.max(PALETTE.length + 2, Math.round(height / COLOR_BAND));
  return Array.from({ length: count + 1 }, (_, j) => ({
    offset: `${((j / count) * 100).toFixed(2)}%`,
    color: PALETTE[j % PALETTE.length],
  }));
}

/**
 * One thick decorative line that runs the whole length of `/cultura`: it
 * enters from off-screen at the top-right, follows a random route down the page
 * (new on every load), drawing itself in as you scroll while cycling through
 * the brand colors, and exits off-screen at the bottom. Purely decorative
 * (aria-hidden, pointer-events: none) — never admin-managed.
 *
 * Meant to be rendered as the *first* absolutely-positioned child right
 * after the hero, inside a `position: relative` wrapper around the page: it
 * then paints above the hero photo (below the wordmark), below every later
 * in-flow section's content, and *below* the pinned 3D column — whose canvas
 * is transparent, so the line shows through it and passes behind the column.
 *
 * Geometry is generated in real pixels from the measured wrapper size (the
 * page's height is content-driven: pinned team section, 3D column, …), so the
 * stroke never distorts; it re-generates whenever that size changes, from the
 * same random route, so the line keeps its character instead of jumping.
 */
export function CultureFlowLines() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [size, setSize] = useState<Size | null>(null);
  // Generated on the client only (after mount): the SVG is not rendered until
  // then, so the server markup never depends on Math.random().
  const [route, setRoute] = useState<Station[] | null>(null);
  const gradientId = useId().replace(/:/g, '');

  useLayoutEffect(() => {
    setRoute(randomRoute());

    const root = rootRef.current;
    if (!root) return;

    const measure = () => {
      const width = Math.round(root.offsetWidth);
      const height = Math.round(root.offsetHeight);
      if (!width || !height) return;
      setSize((current) =>
        current && Math.abs(current.width - width) < 2 && Math.abs(current.height - height) < 8
          ? current
          : { width, height },
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const isMobile = size ? size.width < 768 : false;

  const line = useMemo(() => {
    if (!size || !route) return null;
    return {
      d: buildPath(route, size, isMobile ? MOBILE_SEGMENT : DESKTOP_SEGMENT),
      stops: gradientStops(size.height),
    };
  }, [size, route, isMobile]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const path = pathRef.current;
    if (!root || !path || !line) return;

    // Accessibility: reduced motion keeps the line visible, fully drawn.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    ensureGsapRegistered();

    const ctx = gsap.context(() => {
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(path, {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top 70%',
          end: 'bottom 70%',
          scrub: 0.6,
        },
      });
    }, root);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [line]);

  return (
    <div ref={rootRef} className={styles.root} aria-hidden="true">
      {size && line ? (
        <svg
          className={styles.svg}
          width={size.width}
          height={size.height}
          viewBox={`0 0 ${size.width} ${size.height}`}
          fill="none"
          focusable="false"
        >
          <defs>
            <linearGradient
              id={gradientId}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2="0"
              y2={size.height}
            >
              {line.stops.map((stop) => (
                <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
          </defs>
          <path
            ref={pathRef}
            d={line.d}
            className={styles.line}
            stroke={`url(#${gradientId})`}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={isMobile ? 10 : 18}
          />
        </svg>
      ) : null}
    </div>
  );
}
