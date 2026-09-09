'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { ensureGsapRegistered, gsap } from '@/lib/gsap';
import styles from './parallax-background.module.css';

interface ParallaxBackgroundProps {
  src: string;
  alt?: string;
  priority?: boolean;
  className?: string;
}

/**
 * A full-bleed section background photo that drifts slower than the page as you scroll
 * (classic parallax), sitting under a scrim so foreground text stays legible. Static
 * when the viewer prefers reduced motion.
 */
export function ParallaxBackground({ src, alt = '', priority, className }: ParallaxBackgroundProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const image = imageRef.current;
    if (!wrap || !image) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    ensureGsapRegistered();

    const tween = gsap.fromTo(
      image,
      { scale: 1, yPercent: -16 },
      {
        ease: 'none',
        scale: 1.16,
        scrollTrigger: {
          trigger: wrap,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
        yPercent: 16,
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <div ref={wrapRef} className={`${styles.wrap} ${className ?? ''}`} aria-hidden="true">
      <div ref={imageRef} className={styles.imageLayer}>
        <Image src={src} alt={alt} fill sizes="100vw" priority={priority} className={styles.image} />
      </div>
      <div className={styles.scrim} />
      <div className={styles.edgeFade} />
    </div>
  );
}
