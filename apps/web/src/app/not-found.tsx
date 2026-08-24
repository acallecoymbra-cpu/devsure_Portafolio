import Link from "next/link";

export default function NotFound() {
  return (
    <div className="state-page">
      <p className="eyebrow">404 · ruta no encontrada</p>
      <h1>Este espacio todavía no existe.</h1>
      <p>Vuelve al inicio para continuar explorando.</p>
      <Link className="button button-primary" href="/">
        Ir al inicio
      </Link>
    </div>
  );
}
