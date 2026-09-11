'use client';

import { useEffect, useRef, useState } from 'react';

const SKIP_SECTION_CLASSES = ['client-logos-section'];

/**
 * Floating looping video that hugs the right or left edge of the viewport and
 * switches sides as each top-level home section crosses the vertical center
 * of the screen (hero → right, next section → left, and so on). The thin
 * client-logos strip is skipped so the alternation lines up with the named
 * content sections, not that transitional bar.
 *
 * Hidden on narrow viewports via CSS — see `.ai-orb-companion` — since
 * there's no room "beside" the content on a phone.
 */
export function AiOrbCompanion() {
  const [side, setSide] = useState<'left' | 'right'>('right');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;

    let observer: IntersectionObserver | undefined;

    const setup = () => {
      observer?.disconnect();

      const sections = Array.from(main.querySelectorAll(':scope > section')).filter(
        (section) => !SKIP_SECTION_CLASSES.some((className) => section.classList.contains(className)),
      );
      if (sections.length === 0) return;

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const index = sections.indexOf(entry.target as Element);
            if (index === -1) continue;
            setSide(index % 2 === 0 ? 'right' : 'left');
          }
        },
        { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
      );

      sections.forEach((section) => observer?.observe(section));
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
    // calls play() — kick it once the element exists.
    const video = videoRef.current;
    if (!video) return;
    const tryPlay = () => void video.play().catch(() => {});
    tryPlay();
    video.addEventListener('loadeddata', tryPlay);
    return () => video.removeEventListener('loadeddata', tryPlay);
  }, []);

  return (
    <div className="ai-orb-companion" data-side={side} aria-hidden="true">
      <video ref={videoRef} className="ai-orb-companion-video" autoPlay loop muted playsInline preload="auto">
        {/* H.264/mp4 first: VP9 hardware decode is flaky on some Windows GPU
            drivers and can silently stall on the first frame instead of
            erroring, so don't let the browser prefer the webm source. */}
        <source src="/videos/ai-orb-loop.mp4" type="video/mp4" />
        <source src="/videos/ai-orb-loop.webm" type="video/webm" />
      </video>
    </div>
  );
}
