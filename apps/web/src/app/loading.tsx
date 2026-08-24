export default function Loading() {
  return (
    <div className="state-page" role="status" aria-live="polite">
      <span className="loader" aria-hidden="true" />
      <p>Cargando la experiencia…</p>
    </div>
  );
}
