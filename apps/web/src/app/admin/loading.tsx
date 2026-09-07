import styles from '@/features/admin/admin.module.css';

export default function AdminLoading() {
  return (
    <div className={styles.centerState} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <p>Cargando administración…</p>
    </div>
  );
}
