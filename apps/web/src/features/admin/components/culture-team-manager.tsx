'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  AdminApiError,
  createCultureTeamMember,
  deleteCultureTeamMember,
  listCultureTeam,
  updateCultureTeamMember,
} from '../api/admin-api';
import type { CultureTeamMember, CultureTeamMemberInput } from '../types';
import { FileUploadField } from './file-upload-field';
import styles from '../admin.module.css';

/**
 * Inline manager (list + add/edit form in one component, no routed pages)
 * for the "Nuestro equipo" roster (`TeamRevealSection` on `/cultura`) —
 * embedded directly in `/admin/cultura` next to `CultureForm`, since it's a
 * small, single-owner list (originally an 11-seat hardcoded placeholder
 * roster in `culture-content.ts`) rather than content that needs its own
 * list/detail routes like `/admin/culture-stories`.
 */
export function CultureTeamManager() {
  const router = useRouter();
  const [items, setItems] = useState<CultureTeamMember[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'forbidden'>('loading');
  const [editing, setEditing] = useState<CultureTeamMember | 'new' | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [deletingId, setDeletingId] = useState<string>();
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string }>();

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await listCultureTeam();
      setItems(response.items);
      setStatus('ready');
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      setStatus(error instanceof AdminApiError && error.status === 403 ? 'forbidden' : 'error');
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const editingMember = editing && editing !== 'new' ? editing : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(undefined);
    const input = formDataToInput(new FormData(event.currentTarget));

    try {
      if (editingMember) {
        await updateCultureTeamMember(editingMember.id, input);
        setMessage({ kind: 'success', text: 'Persona actualizada correctamente.' });
      } else {
        await createCultureTeamMember(input);
        setMessage({ kind: 'success', text: 'Persona agregada correctamente.' });
      }
      setEditing(undefined);
      await load();
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      setMessage({
        kind: 'error',
        text:
          error instanceof AdminApiError && error.status === 400
            ? 'Revisa los campos: falta algún dato o alguna imagen.'
            : 'No pudimos guardar los cambios. Inténtalo nuevamente.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(member: CultureTeamMember) {
    if (!window.confirm(`¿Eliminar a "${member.name}"? Esta acción no se puede deshacer.`)) return;

    setDeletingId(member.id);
    setMessage(undefined);
    try {
      await deleteCultureTeamMember(member.id);
      if (editingMember?.id === member.id) setEditing(undefined);
      await load();
      setMessage({ kind: 'success', text: 'Persona eliminada correctamente.' });
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      setMessage({
        kind: 'error',
        text:
          error instanceof AdminApiError && error.status === 403
            ? 'No tienes permiso para eliminar este contenido.'
            : 'No pudimos eliminar el registro.',
      });
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <section aria-labelledby="culture-team-title">
      <div className={styles.pageHeading}>
        <div>
          <h2 id="culture-team-title">Equipo</h2>
          <p className={styles.muted}>
            Las personas de &quot;Nuestro equipo&quot; en <code>/cultura</code>: un retrato serio (se ve en
            escala de grises) y uno sonriente (se revela al interactuar), misma persona y encuadre en ambos.
          </p>
        </div>
        {editing === undefined ? (
          <button className={styles.primaryButton} type="button" onClick={() => setEditing('new')}>
            <span aria-hidden="true">＋</span> Nueva persona
          </button>
        ) : null}
      </div>

      {message ? (
        <div
          className={message.kind === 'success' ? styles.alertSuccess : styles.alertError}
          role={message.kind === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </div>
      ) : null}

      {editing !== undefined ? (
        <form
          key={editingMember?.id ?? 'new'}
          className={styles.editorCard}
          onSubmit={handleSubmit}
        >
          <fieldset disabled={submitting}>
            <legend>{editingMember ? `Editar a "${editingMember.name}"` : 'Nueva persona'}</legend>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Nombre <em aria-hidden="true">*</em></span>
                <input name="name" defaultValue={editingMember?.name} maxLength={150} required autoComplete="off" />
              </label>
              <label className={styles.field}>
                <span>Rol <em aria-hidden="true">*</em></span>
                <input name="role" defaultValue={editingMember?.role} maxLength={150} required autoComplete="off" />
              </label>
              <label className={styles.field}>
                <span>Orden</span>
                <input
                  type="number"
                  name="sortOrder"
                  min={0}
                  step={1}
                  defaultValue={editingMember?.sortOrder ?? items.length}
                />
              </label>
              <label className={styles.field}>
                <span>Texto alternativo (accesibilidad)</span>
                <input name="alt" defaultValue={editingMember?.alt} maxLength={300} autoComplete="off" />
              </label>
              <div className={styles.fullField}>
                <FileUploadField
                  label="Retrato serio (escala de grises)"
                  folder="culture-team"
                  accept="image/png,image/jpeg,image/webp"
                  hiddenName="neutralImage"
                  value={editingMember?.neutralImage}
                  onUploadingChange={(value) => setUploadingCount((count) => count + (value ? 1 : -1))}
                  helpText="PNG, JPEG o WEBP, hasta 2 MB."
                />
              </div>
              <div className={styles.fullField}>
                <FileUploadField
                  label="Retrato sonriente (color)"
                  folder="culture-team"
                  accept="image/png,image/jpeg,image/webp"
                  hiddenName="smilingImage"
                  value={editingMember?.smilingImage}
                  onUploadingChange={(value) => setUploadingCount((count) => count + (value ? 1 : -1))}
                  helpText="Misma persona y encuadre que el retrato serio."
                />
              </div>
            </div>
          </fieldset>

          <div className={styles.formActions}>
            <button className={styles.secondaryButton} type="button" onClick={() => setEditing(undefined)}>
              Cancelar
            </button>
            <button className={styles.primaryButton} type="submit" disabled={submitting || uploadingCount > 0}>
              {submitting ? 'Guardando…' : editingMember ? 'Guardar cambios' : 'Agregar persona'}
            </button>
          </div>
        </form>
      ) : null}

      {status === 'loading' ? (
        <div className={styles.skeletonPanel} role="status" aria-live="polite">
          <span className={styles.srOnly}>Cargando equipo…</span>
          <div />
          <div />
          <div />
        </div>
      ) : null}

      {status === 'error' ? (
        <div className={styles.stateCard} role="alert">
          <h3>No pudimos cargar el equipo</h3>
          <p>Comprueba la conexión con el API e inténtalo nuevamente.</p>
          <button className={styles.secondaryButton} type="button" onClick={() => void load()}>
            Reintentar
          </button>
        </div>
      ) : null}

      {status === 'forbidden' ? (
        <div className={styles.stateCard} role="alert">
          <h3>Acceso restringido</h3>
          <p>Tu cuenta no tiene permiso para consultar este contenido.</p>
        </div>
      ) : null}

      {status === 'ready' && items.length === 0 ? (
        <div className={styles.stateCard}>
          <span className={styles.emptyIcon} aria-hidden="true">◇</span>
          <h3>Aún no hay personas registradas</h3>
          <p>
            Sin ninguna persona, la sección &quot;Nuestro equipo&quot; de <code>/cultura</code> no se muestra.
          </p>
        </div>
      ) : null}

      {status === 'ready' && items.length > 0 ? (
        <div className={styles.tableFrame}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>Listado del equipo administrable</caption>
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Rol</th>
                <th scope="col">Orden</th>
                <th scope="col"><span className={styles.srOnly}>Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map((member) => (
                <tr key={member.id}>
                  <td data-label="Nombre">
                    <strong>{member.name}</strong>
                  </td>
                  <td data-label="Rol">{member.role}</td>
                  <td data-label="Orden">{member.sortOrder}</td>
                  <td className={styles.rowActions}>
                    <button type="button" onClick={() => setEditing(member)}>
                      Editar
                    </button>
                    <button type="button" disabled={deletingId === member.id} onClick={() => void handleDelete(member)}>
                      {deletingId === member.id ? 'Eliminando…' : 'Eliminar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function formDataToInput(data: FormData): CultureTeamMemberInput {
  return {
    name: String(data.get('name') ?? '').trim(),
    role: String(data.get('role') ?? '').trim(),
    neutralImage: String(data.get('neutralImage') ?? '').trim(),
    smilingImage: String(data.get('smilingImage') ?? '').trim(),
    alt: String(data.get('alt') ?? '').trim() || undefined,
    sortOrder: Number(data.get('sortOrder') ?? 0),
  };
}
