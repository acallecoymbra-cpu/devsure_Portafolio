'use client';

import { Component, type ReactNode } from 'react';

interface SectionErrorBoundaryProps {
  children: ReactNode;
  /** Rendered instead of `children` once an error is caught. */
  fallback: ReactNode;
  /**
   * Called once, right when an error is caught — e.g. to flip a parent's
   * state so the *next* render picks a different (working) path instead of
   * retrying the one that just crashed. `fallback` only covers the gap
   * until that re-render lands.
   */
  onError?: (error: unknown) => void;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
}

/**
 * Scopes a crash to one section instead of the whole route. Next.js's own
 * `error.tsx` only catches at the page/segment level — a throw inside, say,
 * a single DOM-heavy section (GSAP ScrollTrigger's pin, or a WebGL canvas
 * mounted imperatively outside React, both doing DOM writes some browser
 * extensions/security tools that monkey-patch `insertBefore`/`removeChild`
 * choke on) would otherwise take down the entire page instead of just that
 * section.
 */
export class SectionErrorBoundary extends Component<SectionErrorBoundaryProps, SectionErrorBoundaryState> {
  state: SectionErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SectionErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
