'use client';

import { ChangeEvent, useState } from 'react';
import { AdminApiError, uploadFile } from '../api/admin-api';
import type { UploadFolder } from '../types';
import styles from '../admin.module.css';

interface GalleryFieldProps {
  label: string;
  folder: UploadFolder;
  accept: string;
  value: string[];
  onChange: (paths: string[]) => void;
  helpText?: string;
  maxFiles?: number;
}

/**
 * Multi-file variant of `<FileUploadField>` for `gallery`-style fields
 * (spec §6.4: "multiple reorderable"). Each selected file is uploaded
 * individually via `POST /admin/uploads`; reordering is a simple swap with
 * up/down buttons rather than drag-and-drop, matching the rest of the admin
 * panel's zero-extra-dependency UI.
 */
export function GalleryField({ label, folder, accept, value, onChange, helpText, maxFiles = 20 }: GalleryFieldProps) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    const room = maxFiles - value.length;
    if (files.length === 0 || room <= 0) return;

    setStatus('uploading');
    setError('');
    try {
      const uploaded: string[] = [];
      for (const file of files.slice(0, room)) {
        const result = await uploadFile(file, folder);
        uploaded.push(result.path);
      }
      onChange([...value, ...uploaded]);
      setStatus('idle');
    } catch (caught) {
      setStatus('error');
      setError(
        caught instanceof AdminApiError && caught.status === 413
          ? 'Algún archivo supera el tamaño máximo permitido.'
          : caught instanceof AdminApiError && caught.status === 415
            ? 'Algún archivo tiene un formato no permitido.'
            : 'No pudimos subir uno o más archivos. Inténtalo nuevamente.',
      );
    }
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className={styles.field}>
      <span>{label}</span>
      <input
        type="file"
        accept={accept}
        multiple
        onChange={handleChange}
        disabled={status === 'uploading' || value.length >= maxFiles}
      />
      {status === 'uploading' ? <small>Subiendo…</small> : null}
      {status === 'error' ? (
        <small role="alert" className={styles.uploadError}>
          {error}
        </small>
      ) : null}
      {value.length > 0 ? (
        <ul className={styles.gallery}>
          {value.map((path, index) => (
            <li key={path} className={styles.galleryItem}>
              <span className={styles.uploadPath}>{path}</span>
              <div className={styles.galleryItemActions}>
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Mover arriba">
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === value.length - 1}
                  aria-label="Mover abajo"
                >
                  ↓
                </button>
                <button type="button" onClick={() => remove(index)} aria-label={`Quitar ${path}`}>
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {helpText ? <small>{helpText}</small> : null}
    </div>
  );
}
