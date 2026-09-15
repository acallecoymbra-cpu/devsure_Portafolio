'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/lib/use-theme';

/**
 * Sections the companion never changes side/reveals for. `client-logos-section`
 * is just the thin transitional strip between hero and content.
 * `home-hero-section` gets separate handling below — it's the one section
 * that actively hides the companion again on re-entry (scrolling back up),
 * rather than just being skipped once.
 */
const SKIP_SECTION_CLASSES = ['client-logos-section', 'home-hero-section'];

/**
 * Floating looping video that hugs the right or left edge of the viewport and
 * switches sides every two top-level home sections (sections 1-2 → right,
 * 3-4 → left, and so on), rather than on every single one. The thin
 * client-logos strip is skipped so the alternation lines up with the named
 * content sections, not that transitional bar.
 *
 * Hidden until the second section (see `SKIP_SECTION_CLASSES`) — sized and
 * positioned differently depending on viewport: on phones/tablets it pins
 * to the viewport edge and scales down with it; on wide desktops it moves
 * beside the content column instead, where there's room for it.
 */
export function AiOrbCompanion() {
  const { theme } = useTheme();
  const [side, setSide] = useState<'left' | 'right'>('right');
  const [hidden, setHidden] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;

    let observer: IntersectionObserver | undefined;

    const setup = () => {
      observer?.disconnect();

      const allSections = Array.from(main.querySelectorAll(':scope > section'));
      const heroSection = allSections.find((section) => section.classList.contains('home-hero-section'));
      const trackedSections = allSections.filter(
        (section) => !SKIP_SECTION_CLASSES.some((className) => section.classList.contains(className)),
      );
      if (allSections.length === 0) return;

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            if (entry.target === heroSection) {
              setHidden(true);
              continue;
            }
            const index = trackedSections.indexOf(entry.target as Element);
            if (index === -1) continue;
            setSide(Math.floor(index / 2) % 2 === 0 ? 'right' : 'left');
            setHidden(false);
          }
        },
        { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
      );

      if (heroSection) observer.observe(heroSection);
      trackedSections.forEach((section) => observer?.observe(section));
    };

    setup();
    // Re-sync if a section is swapped in later (e.g. the technologies teaser
    // resolving inside its own Suspense boundary).
    const mutationObserver = new MutationObserver(setup);
    mutationObserver.observe(main, { childList: true });

    return () => {
      observer?.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    // autoPlay is enough in most browsers, but Chrome sometimes leaves a
    // muted <video> stalled on its first frame until something explicitly
    // calls play() — kick it once the element exists. Re-runs on theme
    // change too, since the <video> below is re-keyed (and its <source>s
    // swapped) whenever the theme flips.
    const video = videoRef.current;
    if (!video) return;
    const tryPlay = () => void video.play().catch(() => {});
    tryPlay();
    video.addEventListener('loadeddata', tryPlay);
    return () => video.removeEventListener('loadeddata', tryPlay);
  }, [theme]);

  return (
    <div className="ai-orb-companion" data-side={side} data-hidden={hidden} aria-hidden="true">
      {/*
       * `key={theme}` forces React to drop and recreate the <video> node
       * instead of leaving the old one's already-decoded sources in place
       * when the <source> children below change — a plain prop/children
       * swap doesn't make browsers re-run resource selection on its own.
       */}
      <video key={theme} ref={videoRef} className="ai-orb-companion-video" autoPlay loop muted playsInline preload="auto">
        {theme === 'light' ? (
          <source src="/videos/orbe_theme_light.mp4" type="video/mp4" />
        ) : (
          <>
            {/* H.264/mp4 first: VP9 hardware decode is flaky on some Windows
                GPU drivers and can silently stall on the first frame instead
                of erroring, so don't let the browser prefer the webm source. */}
            <source src="/videos/ai-orb-loop.mp4" type="video/mp4" />
            <source src="/videos/ai-orb-loop.webm" type="video/webm" />
          </>
        )}
      </video>
    </div>
  );
}
