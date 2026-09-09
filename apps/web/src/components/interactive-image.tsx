'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { ensureGsapRegistered, gsap } from '@/lib/gsap';
import styles from './interactive-image.module.css';

interface InteractiveImageProps {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
  /** CSS aspect-ratio for the card. Defaults to a square, right for logos. */
  aspectRatio?: string;
  /** 'contain' (logos, padded) or 'cover' (photos, edge-to-edge). Defaults to 'contain'. */
  fit?: 'contain' | 'cover';
}

const MAX_TILT_DEG = 10;

/**
 * A photo/logo that tilts in 3D toward the cursor, shows a soft light glare, and settles
 * into place once scrolled into view. Reusable "cinematic" image treatment for real
 * photos/screenshots once they're available; falls back to a static image when the
 * viewer prefers reduced motion.
 */
export function InteractiveImage({
  src,
  alt,
  sizes = '(min-width: 64rem) 20vw, 40vw',
  className,
  priority,
  aspectRatio = '1',
  fit = 'contain',
}: InteractiveImageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    const glare = glareRef.current;
    if (!wrap || !card || !glare) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(wrap, { autoAlpha: 1 });
      return;
    }

    ensureGsapRegistered();

    const setRotateX = gsap.quickTo(card, 'rotateX', { duration: 0.5, ease: 'power3.out' });
    const setRotateY = gsap.quickTo(card, 'rotateY', { duration: 0.5, ease: 'power3.out' });
    const setGlareX = gsap.quickTo(glare, 'xPercent', { duration: 0.4, ease: 'power3.out' });
    const setGlareY = gsap.quickTo(glare, 'yPercent', { duration: 0.4, ease: 'power3.out' });

    function onMove(event: PointerEvent) {
      const rect = wrap!.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      setRotateY((px - 0.5) * MAX_TILT_DEG * 2);
      setRotateX(-(py - 0.5) * MAX_TILT_DEG * 2);
      setGlareX(px * 100 - 50);
      setGlareY(py * 100 - 50);
    }

    function onEnter() {
      gsap.to(glare, { opacity: 1, duration: 0.3 });
    }

    function onLeave() {
      setRotateX(0);
      setRotateY(0);
      gsap.to(glare, { opacity: 0, duration: 0.4 });
    }

    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerenter', onEnter);
    wrap.addEventListener('pointerleave', onLeave);

    const entrance = gsap.fromTo(
      wrap,
      { autoAlpha: 0, y: 40, scale: 0.92, rotateY: -8 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        rotateY: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: wrap,
          start: 'top 85%',
          once: true,
        },
      },
    );

    return () => {
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerenter', onEnter);
      wrap.removeEventListener('pointerleave', onLeave);
      entrance.scrollTrigger?.kill();
      entrance.kill();
    };
  }, []);

  return (
    <div ref={wrapRef} className={`${styles.wrap} ${className ?? ''}`}>
      <div ref={cardRef} className={styles.card} style={{ aspectRatio }}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={fit === 'cover' ? styles.imageCover : styles.image}
          priority={priority}
        />
        <div ref={glareRef} className={styles.glare} aria-hidden="true" />
      </div>
    </div>
  );
}
