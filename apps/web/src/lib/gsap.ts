'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let registered = false;

/** Registers GSAP's ScrollTrigger plugin once, client-side only. Import this instead of gsap/ScrollTrigger directly. */
export function ensureGsapRegistered() {
  if (registered || typeof window === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

export { gsap, ScrollTrigger };
