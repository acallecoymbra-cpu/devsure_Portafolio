'use client';

import Image from 'next/image';
import { CSSProperties, PointerEvent, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ensureGsapRegistered, gsap, ScrollTrigger } from '@/lib/gsap';
import type { TeamMember } from '@/features/culture/culture-content';
import styles from './team-reveal-section.module.css';

type TeamRevealSectionProps = {
  members: readonly TeamMember[];
  eyebrow?: string;
  title?: string;
  className?: string;
};

type RevealStyle = CSSProperties & {
  '--reveal-x': string;
  '--reveal-y': string;
};

/**
 * Admin uploads resolve to an absolute URL on the API's storage server (see
 * `getTeamImageUrl`). `next/image` refuses any host not listed in
 * `images.remotePatterns` — and throws, taking the whole section down — so
 * those are served as-is, exactly like every other uploaded image on the
 * site. Bundled `/photos/*` placeholders still go through the optimizer.
 */
const isUploadedImage = (src: string) => /^https?:\/\//.test(src);

/**
 * Editorial team section: desktop pins the section and drives all the
 * cards past horizontally as the viewer scrolls vertically (GSAP
 * ScrollTrigger, distance derived from the track's real scrollWidth — never
 * hardcoded to `members.length`). Each card shows a grayscale "neutral"
 * portrait that only reveals its color "smiling" counterpart, through a
 * circular clip-path mask, on direct interaction — hover/focus on desktop,
 * tap on touch — never automatically from scroll. Mobile drops the GSAP pin
 * entirely for a native horizontal scroll-snap carousel, since fighting a
 * pin against touch-scroll swipes reads as janky.
 */
export function TeamRevealSection({
  members,
  eyebrow = 'Nuestro equipo',
  title = 'Las personas detrás de DevSure',
  className = '',
}: TeamRevealSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // On touch, a card can stay open after tapping it; desktop keeps using hover regardless of this.
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    ensureGsapRegistered();

    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (!section || !viewport || !track) return;

    const mm = gsap.matchMedia();

    const getScrollDistance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

    const ctx = gsap.context(() => {
      mm.add('(min-width: 769px)', () => {
        const horizontalTween = gsap.to(track, {
          x: () => -getScrollDistance(),
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${Math.max(getScrollDistance(), 1)}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });

        return () => {
          horizontalTween.scrollTrigger?.kill();
          horizontalTween.kill();
        };
      });

      // Mobile never pins vertically — the carousel scrolls horizontally by touch instead.
      mm.add('(max-width: 768px)', () => {
        gsap.set(track, { x: 0 });
      });
    }, section);

    const refresh = () => ScrollTrigger.refresh();
    const resizeObserver = new ResizeObserver(refresh);

    resizeObserver.observe(track);
    resizeObserver.observe(viewport);
    window.addEventListener('load', refresh);

    ScrollTrigger.refresh();

    return () => {
      window.removeEventListener('load', refresh);
      resizeObserver.disconnect();
      mm.revert();
      ctx.revert();
    };
  }, [members.length]);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return;

    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    target.style.setProperty('--reveal-x', `${x.toFixed(2)}%`);
    target.style.setProperty('--reveal-y', `${y.toFixed(2)}%`);
  }, []);

  const handleTouchToggle = useCallback((event: PointerEvent<HTMLElement>, id: string) => {
    if (event.pointerType === 'mouse') return;
    setActiveCardId((current) => (current === id ? null : id));
  }, []);

  if (!members.length) return null;

  return (
    <section ref={sectionRef} className={`${styles.section} ${className}`} aria-labelledby="team-reveal-title">
      <div className={styles.header}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 id="team-reveal-title" className={styles.title}>
          {title}
        </h2>

        <p className={styles.hint}>Pasa el cursor o toca para conocer a cada persona.</p>
      </div>

      <div ref={viewportRef} className={styles.viewport}>
        <div
          ref={trackRef}
          className={styles.track}
          style={
            {
              '--team-count': members.length,
            } as CSSProperties
          }
        >
          {members.map((member, index) => {
            const isActive = activeCardId === member.id;

            return (
              <article
                key={member.id}
                className={styles.card}
                data-active={isActive ? 'true' : 'false'}
                tabIndex={0}
                onPointerMove={handlePointerMove}
                onPointerUp={(event) => handleTouchToggle(event, member.id)}
                onBlur={() => {
                  if (activeCardId === member.id) {
                    setActiveCardId(null);
                  }
                }}
                style={
                  {
                    '--reveal-x': '50%',
                    '--reveal-y': '50%',
                  } as RevealStyle
                }
              >
                <div className={styles.imageFrame}>
                  {/* No `priority` here — this section is well below the fold
                      (behind the hero and the whole 3D column scroll range),
                      so eager-loading would only compete with what's actually
                      above the fold for bandwidth on first paint. */}
                  <Image
                    src={member.neutralImage}
                    alt={member.alt ?? member.name}
                    unoptimized={isUploadedImage(member.neutralImage)}
                    fill
                    sizes="(max-width: 768px) 82vw, 30vw"
                    className={styles.neutralImage}
                  />

                  <Image
                    src={member.smilingImage}
                    alt=""
                    aria-hidden="true"
                    unoptimized={isUploadedImage(member.smilingImage)}
                    fill
                    sizes="(max-width: 768px) 82vw, 30vw"
                    className={styles.smilingImage}
                  />

                  <div className={styles.imageShade} />

                  <div className={styles.number}>{String(index + 1).padStart(2, '0')}</div>

                  <div className={styles.revealLabel}>
                    <span className={styles.revealDot} />
                    Conóceme
                  </div>
                </div>

                <div className={styles.info}>
                  <div>
                    <h3 className={styles.name}>{member.name}</h3>
                    <p className={styles.role}>{member.role}</p>
                  </div>

                  <span className={styles.index}>
                    {String(index + 1).padStart(2, '0')} / {String(members.length).padStart(2, '0')}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
