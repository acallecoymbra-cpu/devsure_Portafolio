"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="state-page" role="alert">
      <p className="eyebrow">Algo no salió como esperábamos</p>
      <h1>Podemos intentarlo de nuevo.</h1>
      <button className="button button-primary" type="button" onClick={() => reset()}>
        Reintentar
      </button>
    </div>
  );
}
