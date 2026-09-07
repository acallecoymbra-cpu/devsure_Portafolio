'use client';

import type { ReactNode } from 'react';
import styles from '../admin.module.css';

interface RepeaterFieldProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  createItem: () => T;
  renderItem: (item: T, index: number, update: (patch: Partial<T>) => void) => ReactNode;
  addLabel: string;
  itemLabel?: (item: T, index: number) => string;
  minItems?: number;
  emptyText?: string;
}

/**
 * Reusable `<RepeaterField>` (spec §11.2) for dynamic-length arrays (levels,
 * apps, highlights, social links...). Items are fully controlled, so index
 * keys are safe here even though entries can be removed from the middle.
 */
export function RepeaterField<T>({
  items,
  onChange,
  createItem,
  renderItem,
  addLabel,
  itemLabel,
  minItems = 0,
  emptyText,
}: RepeaterFieldProps<T>) {
  function update(index: number, patch: Partial<T>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function remove(index: number) {
    if (items.length <= minItems) return;
    onChange(items.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...items, createItem()]);
  }

  return (
    <div className={styles.repeater}>
      {items.length === 0 && emptyText ? <p className={styles.muted}>{emptyText}</p> : null}
      {items.map((item, index) => (
        <div key={index} className={styles.repeaterItem}>
          <div className={styles.repeaterItemHeading}>
            <strong>{itemLabel ? itemLabel(item, index) : `#${index + 1}`}</strong>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => remove(index)}
              disabled={items.length <= minItems}
            >
              Eliminar
            </button>
          </div>
          {renderItem(item, index, (patch) => update(index, patch))}
        </div>
      ))}
      <button type="button" className={styles.secondaryButton} onClick={add}>
        <span aria-hidden="true">＋</span> {addLabel}
      </button>
    </div>
  );
}
