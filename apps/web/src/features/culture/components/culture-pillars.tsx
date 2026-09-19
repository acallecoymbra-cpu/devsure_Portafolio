'use client';

import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import {
  CSSProperties,
  KeyboardEvent,
  PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { CulturePillar } from '@/features/culture/culture-content';
import { pillarIcons, pillarScenes } from './culture-pillar-scenes';
import styles from './culture-pillars.module.css';

const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-pillar-display',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-pillar-mono',
});

/** Time each pillar stays in focus while autoplay runs. Deliberately slow. */
const AUTOPLAY_MS = 9000;
const SWIPE_MIN_PX = 48;

type CulturePillarsProps = {
  pillars: readonly CulturePillar[];
  eyebrow?: string;
  title?: string;
};

/**
 * "What we value": an interactive showcase instead of a static grid. One
 * pillar is active at a time — the list on the left (hover/click/arrow keys on
 * desktop, tap or swipe on touch) drives a single large stage on the right
 * that re-draws its blueprint scene and re-staggers its copy for the active
 * pillar. A slow autoplay walks the pillars on its own; its progress is a CSS
 * animation on the active item (so pausing on hover/focus/off-screen is just
 * `animation-play-state`, and `animationend` is the only "timer").
 */
export function CulturePillars({
  pillars,
  eyebrow,
  title = '03 — What we value',
}: CulturePillarsProps) {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  const count = pillars.length;
  const label = eyebrow ?? `Los ${count} pilares`;
  const select = useCallback((index: number) => setActive((index + count) % count), [count]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener('change', sync);

    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      query.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setRevealed(true);
      },
      { threshold: 0.35 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const autoplay = !reducedMotion && count > 1;
  const running = autoplay && inView && tabVisible && !hovered && !focused;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keyToIndex: Record<string, number> = {
      ArrowDown: active + 1,
      ArrowRight: active + 1,
      ArrowUp: active - 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: count - 1,
    };
    if (!(event.key in keyToIndex)) return;
    event.preventDefault();
    const next = (keyToIndex[event.key] + count) % count;
    select(next);
    tabRefs.current[next]?.focus();
  };

  const onStagePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    stage.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    stage.style.setProperty('--my', `${event.clientY - rect.top}px`);
  };

  const onStagePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return;
    swipeStart.current = { x: event.clientX, y: event.clientY };
  };

  const onStagePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
      select(active + (dx < 0 ? 1 : -1));
    }
  };

  return (
    <section
      ref={rootRef}
      className={`${styles.section} ${display.variable} ${mono.variable}`}
      aria-labelledby="pillars-title"
      data-revealed={revealed}
    >
      <div className="shell">
        <header className={styles.header}>
          <h2 id="pillars-title" className={styles.title}>
            {title}
          </h2>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            {label}
          </p>
        </header>

        <div
          className={styles.showcase}
          data-running={running}
          onPointerEnter={(event) => event.pointerType === 'mouse' && setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
          }}
        >
          <div
            className={styles.list}
            role="tablist"
            aria-orientation="vertical"
            aria-label={label}
            onKeyDown={onKeyDown}
          >
            {pillars.map((pillar, index) => {
              const isActive = index === active;
              return (
                <button
                  key={pillar.id}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  id={`pillar-tab-${pillar.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`pillar-panel-${pillar.id}`}
                  tabIndex={isActive ? 0 : -1}
                  className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
                  style={{ '--enter': index } as CSSProperties}
                  onClick={() => select(index)}
                  onPointerEnter={(event) => event.pointerType === 'mouse' && select(index)}
                >
                  <span className={styles.itemNumber}>{pillar.number}</span>
                  <span className={styles.itemText}>
                    <span className={styles.itemName}>{pillar.title}</span>
                    {pillar.keywords ? <span className={styles.itemKeywords}>{pillar.keywords}</span> : null}
                  </span>
                  {isActive && autoplay ? (
                    <span
                      key={`progress-${index}`}
                      className={styles.progress}
                      style={{ animationDuration: `${AUTOPLAY_MS}ms` }}
                      onAnimationEnd={() => select(index + 1)}
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div
            ref={stageRef}
            className={styles.stage}
            onPointerMove={onStagePointerMove}
            onPointerDown={onStagePointerDown}
            onPointerUp={onStagePointerUp}
            onPointerCancel={() => {
              swipeStart.current = null;
            }}
          >
            <div className={styles.stageGlow} aria-hidden="true" />
            <div className={styles.stageGrid} aria-hidden="true" />
            <span key={`sweep-${active}`} className={styles.sweep} aria-hidden="true" />

            <div className={styles.hud} aria-hidden="true">
              <span className={styles.hudCount}>
                {pillars[active].number} / {String(count).padStart(2, '0')}
              </span>
              <span className={styles.pips}>
                {pillars.map((pillar, index) => (
                  <span key={pillar.id} className={index === active ? styles.pipActive : styles.pip} />
                ))}
              </span>
            </div>

            {pillars.map((pillar, index) => {
              const Scene = pillarScenes[pillar.visual];
              const Icon = pillarIcons[pillar.visual];
              const isActive = index === active;
              return (
                <article
                  key={pillar.id}
                  id={`pillar-panel-${pillar.id}`}
                  role="tabpanel"
                  aria-labelledby={`pillar-tab-${pillar.id}`}
                  className={`${styles.slide} ${isActive ? styles.slideActive : ''}`}
                >
                  <span className={styles.ghost} aria-hidden="true">
                    {pillar.number}
                  </span>
                  <svg
                    className={styles.scene}
                    viewBox="0 0 480 300"
                    preserveAspectRatio="xMidYMid meet"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <Scene />
                  </svg>
                  <div className={styles.copy}>
                    <div className={styles.kickerRow}>
                      <span className={styles.badge}>
                        <Icon />
                      </span>
                      <span className={styles.kicker}>Pilar {pillar.number}</span>
                    </div>
                    <h3 className={styles.name}>{pillar.title}</h3>
                    <p className={styles.description}>{pillar.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
