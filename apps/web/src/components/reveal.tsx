'use client';

import type { ComponentPropsWithoutRef, ElementType, Ref } from 'react';
import { useInView } from '@/lib/use-in-view';

type RevealProps<T extends ElementType> = {
  as: T;
} & Omit<ComponentPropsWithoutRef<T>, 'ref'>;

/**
 * Renders `as` (any tag or component that forwards a ref, e.g. `next/link`'s
 * `Link`) with a fade/settle-in transition applied once it scrolls into
 * view. Kept as the direct grid/list item itself — no wrapper element — so
 * it slots into existing CSS grid/flex layouts without changing their DOM
 * structure. State lives in React (`useInView`), so unlike a raw
 * `document.querySelectorAll` + `classList` approach, it can never race with
 * Next's hydration of streamed-in Suspense content.
 */
export function Reveal<T extends ElementType = 'div'>({ as, className, ...rest }: RevealProps<T>) {
  const Tag = as as ElementType;
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.15 });

  return (
    <Tag
      ref={ref as Ref<Element>}
      className={`${className ?? ''} reveal-init${inView ? ' is-revealed' : ''}`}
      {...rest}
    />
  );
}
