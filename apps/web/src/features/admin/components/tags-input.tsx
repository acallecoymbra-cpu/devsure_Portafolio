'use client';

import { KeyboardEvent, useState } from 'react';
import styles from '../admin.module.css';

interface TagsInputProps {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

/** Reusable `<TagsInput>` (spec §11.2) for `tech_stack`-style string lists. */
export function TagsInput({ label, value, onChange, placeholder, maxTags = 30 }: TagsInputProps) {
  const [draft, setDraft] = useState('');

  function commitDraft() {
    const tag = draft.trim();
    setDraft('');
    if (!tag || value.length >= maxTags || value.includes(tag)) return;
    onChange([...value, tag]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commitDraft();
    } else if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    onChange(value.filter((entry) => entry !== tag));
  }

  return (
    <div className={styles.field}>
      <span>{label}</span>
      <div className={styles.tagsInput}>
        {value.map((tag) => (
          <span key={tag} className={styles.tag}>
            {tag}
            <button type="button" aria-label={`Quitar ${tag}`} onClick={() => removeTag(tag)}>
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          placeholder={value.length === 0 ? placeholder : undefined}
          disabled={value.length >= maxTags}
        />
      </div>
      <small>Presiona Enter o coma para añadir. Hasta {maxTags} etiquetas.</small>
    </div>
  );
}
