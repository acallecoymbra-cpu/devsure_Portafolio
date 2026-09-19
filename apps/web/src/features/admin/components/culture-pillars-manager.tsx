'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  AdminApiError,
  createCulturePillar,
  deleteCulturePillar,
  listCulturePillars,
  updateCulturePillar,
} from '../api/admin-api';
import type { CulturePillar, CulturePillarInput, CulturePillarVisual } from '../types';
import styles from '../admin.module.css';

/** Labels for the six built-in illustrations a pillar can show (see `CulturePillarVisual`). */
const VISUAL_OPTIONS: readonly { value: CulturePillarVisual; label: string }[] = [
  { value: 'integrity', label: 'Escudo con verificación (integridad)' },
  { value: 'honesty', label: 'Capas transparentes (honestidad)' },
  { value: 'respect', label: 'Órbitas que coexisten (respeto)' },
  { value: 'teamwork', label: 'Red de nodos (trabajo en equipo)' },
  { value: 'humility', label: 'Escalera ascendente (humildad)' },
  { value: 'commitment', label: 'Anillo que se cierra (compromiso)' },
];

const VISUAL_LABELS = Object.fromEntries(VISUAL_OPTIONS.map((option) => [option.value, option.label])) as Record<
  CulturePillarVisual,
  string
>;

/**
 * Inline manager (list + add/edit form, no routed pages) for the "What we
 * value" pillars shown on `/cultura` (`CulturePillars`) — embedded in
 * `/admin/cultura` next to the manifesto form and the team manager, same
 * pattern as `CultureTeamManager`. Text is plain (Spanish) strings, like the
 * team; each pillar picks one of the six built-in illustrations.
 */
export function CulturePillarsManager() {
  const router = useRouter();
  const [items, setItems] = useState<CulturePillar[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'forbidden'>('loading');
  const [editing, setEditing] = useState<CulturePillar | 'new' | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string>();
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string }>();

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await listCulturePillars();
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

  const editingPillar = editing && editing !== 'new' ? editing : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(undefined);
    const input = formDataToInput(new FormData(event.currentTarget));

    try {
      if (editingPillar) {
        await updateCulturePillar(editingPillar.id, input);
        setMessage({ kind: 'success', text: 'Pilar actualizado correctamente.' });
      } else {
        await createCulturePillar(input);
        setMessage({ kind: 'success', text: 'Pilar agregado correctamente.' });
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
            ? 'Revisa los campos: el nombre y la descripción son obligatorios (descripción de hasta 600 caracteres).'
            : 'No pudimos guardar los cambios. Inténtalo nuevamente.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(pillar: CulturePillar) {
    if (!window.confirm(`¿Eliminar el pilar "${pillar.title}"? Esta acción no se puede deshacer.`)) return;

    setDeletingId(pillar.id);
    setMessage(undefined);
    try {
      await deleteCulturePillar(pillar.id);
      if (editingPillar?.id === pillar.id) setEditing(undefined);
      await load();
      setMessage({ kind: 'success', text: 'Pilar eliminado correctamente.' });
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
    <section aria-labelledby="culture-pillars-title">
      <div className={styles.pageHeading}>
        <div>
          <h2 id="culture-pillars-title">Pilares</h2>
          <p className={styles.muted}>
            Los valores de &quot;03 — What we value&quot; en <code>/cultura</code>: se muestran en una lista con un
            panel que cambia al pasar el cursor o tocar cada pilar, en el orden indicado. Cada pilar elige una de
            las seis ilustraciones incluidas.
          </p>
        </div>
        {editing === undefined ? (
          <button className={styles.primaryButton} type="button" onClick={() => setEditing('new')}>
            <span aria-hidden="true">＋</span> Nuevo pilar
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
        <form key={editingPillar?.id ?? 'new'} className={styles.editorCard} onSubmit={handleSubmit}>
          <fieldset disabled={submitting}>
            <legend>{editingPillar ? `Editar "${editingPillar.title}"` : 'Nuevo pilar'}</legend>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Nombre <em aria-hidden="true">*</em></span>
                <input name="title" defaultValue={editingPillar?.title} maxLength={100} required autoComplete="off" />
              </label>
              <label className={styles.field}>
                <span>Palabras clave</span>
                <input
                  name="keywords"
                  defaultValue={editingPillar?.keywords}
                  maxLength={150}
                  autoComplete="off"
                  placeholder="Coherencia · Responsabilidad"
                />
              </label>
              <label className={styles.field}>
                <span>Ilustración</span>
                <select name="visual" defaultValue={editingPillar?.visual ?? nextFreeVisual(items)}>
                  {VISUAL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Orden</span>
                <input
                  type="number"
                  name="sortOrder"
                  min={0}
                  step={1}
                  defaultValue={editingPillar?.sortOrder ?? items.length}
                />
              </label>
              <label className={`${styles.field} ${styles.fullField}`}>
                <span>Descripción <em aria-hidden="true">*</em></span>
                <textarea
                  name="description"
                  defaultValue={editingPillar?.description}
                  maxLength={600}
                  rows={4}
                  required
                />
              </label>
            </div>
          </fieldset>

          <div className={styles.formActions}>
            <button className={styles.secondaryButton} type="button" onClick={() => setEditing(undefined)}>
              Cancelar
            </button>
            <button className={styles.primaryButton} type="submit" disabled={submitting}>
              {submitting ? 'Guardando…' : editingPillar ? 'Guardar cambios' : 'Agregar pilar'}
            </button>
          </div>
        </form>
      ) : null}

      {status === 'loading' ? (
        <div className={styles.skeletonPanel} role="status" aria-live="polite">
          <span className={styles.srOnly}>Cargando pilares…</span>
          <div />
          <div />
          <div />
        </div>
      ) : null}

      {status === 'error' ? (
        <div className={styles.stateCard} role="alert">
          <h3>No pudimos cargar los pilares</h3>
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
          <h3>Aún no hay pilares registrados</h3>
          <p>
            Sin ningún pilar, la sección &quot;What we value&quot; de <code>/cultura</code> no se muestra. Los seis
            valores originales se cargan con <code>pnpm --filter @devsure/api seed:culture-pillars</code>.
          </p>
        </div>
      ) : null}

      {status === 'ready' && items.length > 0 ? (
        <div className={styles.tableFrame}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>Listado de pilares administrables</caption>
            <thead>
              <tr>
                <th scope="col">Pilar</th>
                <th scope="col">Ilustración</th>
                <th scope="col">Orden</th>
                <th scope="col"><span className={styles.srOnly}>Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map((pillar) => (
                <tr key={pillar.id}>
                  <td data-label="Pilar">
                    <strong>{pillar.title}</strong>
                    {pillar.keywords ? <div className={styles.muted}>{pillar.keywords}</div> : null}
                  </td>
                  <td data-label="Ilustración">{VISUAL_LABELS[pillar.visual] ?? pillar.visual}</td>
                  <td data-label="Orden">{pillar.sortOrder}</td>
                  <td className={styles.rowActions}>
                    <button type="button" onClick={() => setEditing(pillar)}>
                      Editar
                    </button>
                    <button type="button" disabled={deletingId === pillar.id} onClick={() => void handleDelete(pillar)}>
                      {deletingId === pillar.id ? 'Eliminando…' : 'Eliminar'}
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

/** Default a new pillar to an illustration no other pillar uses yet, when one is left. */
function nextFreeVisual(items: readonly CulturePillar[]): CulturePillarVisual {
  const used = new Set(items.map((item) => item.visual));
  return VISUAL_OPTIONS.find((option) => !used.has(option.value))?.value ?? VISUAL_OPTIONS[0].value;
}

function formDataToInput(data: FormData): CulturePillarInput {
  return {
    title: String(data.get('title') ?? '').trim(),
    keywords: String(data.get('keywords') ?? '').trim(),
    description: String(data.get('description') ?? '').trim(),
    visual: String(data.get('visual') ?? 'integrity') as CulturePillarVisual,
    sortOrder: Number(data.get('sortOrder') ?? 0),
  };
}
