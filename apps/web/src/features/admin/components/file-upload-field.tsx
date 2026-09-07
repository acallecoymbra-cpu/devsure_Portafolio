'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { AdminApiError, uploadFile } from '../api/admin-api';
import type { UploadFolder } from '../types';
import styles from '../admin.module.css';

interface FileUploadFieldProps {
  label: string;
  folder: UploadFolder;
  accept: string;
  /** Renders a hidden input under this name, for uncontrolled `FormData` forms (e.g. ProfileForm). */
  hiddenName?: string;
  /** Called with the uploaded path, for controlled forms (e.g. ExperienceForm). */
  onUploaded?: (path: string) => void;
  value?: string;
  helpText?: string;
}

/**
 * Reusable `<FileUploadField>` (spec §11.2): uploads immediately on selection
 * via `POST /admin/uploads`. Supports two integration styles: an
 * uncontrolled `<form>` reads the path back from the rendered hidden input
 * (`hiddenName`), while a controlled form reads it from `onUploaded`.
 */
export function FileUploadField({ label, folder, accept, hiddenName, onUploaded, value, helpText }: FileUploadFieldProps) {
  const [path, setPath] = useState(value ?? '');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => setPath(value ?? ''), [value]);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setStatus('uploading');
    setError('');
    try {
      const result = await uploadFile(file, folder);
      setPath(result.path);
      onUploaded?.(result.path);
      setStatus('idle');
    } catch (caught) {
      setStatus('error');
      setError(
        caught instanceof AdminApiError && caught.status === 413
          ? 'El archivo supera el tamaño máximo permitido.'
          : caught instanceof AdminApiError && caught.status === 415
            ? 'Ese formato de archivo no está permitido.'
            : 'No pudimos subir el archivo. Inténtalo nuevamente.',
      );
    }
  }

  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input type="file" accept={accept} onChange={handleChange} disabled={status === 'uploading'} />
      {hiddenName ? <input type="hidden" name={hiddenName} value={path} /> : null}
      {status === 'uploading' ? <small>Subiendo…</small> : null}
      {status === 'error' ? (
        <small role="alert" className={styles.uploadError}>
          {error}
        </small>
      ) : null}
      {status !== 'uploading' && path ? <small className={styles.uploadPath}>{path}</small> : null}
      {helpText ? <small>{helpText}</small> : null}
    </label>
  );
}
