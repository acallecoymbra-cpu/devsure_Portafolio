'use client';

import { useEffect, useRef, useState } from 'react';
import type { ProfileStat } from '@devsure/contracts';
import { translateValue } from '@devsure/contracts';
import { useInView } from '@/lib/use-in-view';
import styles from '@/features/portfolio/about-stats.module.css';

interface AboutStatsProps {
  stats: ProfileStat[];
  locale: string;
}

const COUNT_DURATION_MS = 900;

/** Metrics strip for "Nosotros": counts each stat up from 0 and grows a bar accent once scrolled into view. */
export function AboutStats({ stats, locale }: AboutStatsProps) {
  const { ref, inView } = useInView<HTMLUListElement>({ threshold: 0.4 });
  const maxValue = Math.max(...stats.map((stat) => stat.value), 1);

  return (
    <ul className="about-stats" ref={ref}>
      {stats.map((stat, index) => (
        <AboutStat key={index} stat={stat} locale={locale} maxValue={maxValue} active={inView} />
      ))}
    </ul>
  );
}

interface AboutStatProps {
  stat: ProfileStat;
  locale: string;
  maxValue: number;
  active: boolean;
}

function AboutStat({ stat, locale, maxValue, active }: AboutStatProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const frame = useRef<number | undefined>(undefined);
  const barWidth = Math.max(12, Math.round((stat.value / maxValue) * 100));

  useEffect(() => {
    if (!active) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(stat.value);
      return;
    }

    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / COUNT_DURATION_MS);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * stat.value));
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      }
    }

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [active, stat.value]);

  return (
    <li className="about-stat">
      <strong>
        {displayValue}
        {stat.suffix ?? ''}
      </strong>
      <span>{translateValue(stat.label, locale)}</span>
      <span className={styles.barTrack} aria-hidden="true">
        <span className={styles.barFill} style={{ width: active ? `${barWidth}%` : 0 }} />
      </span>
    </li>
  );
}
