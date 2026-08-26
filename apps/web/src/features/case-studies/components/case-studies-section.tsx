'use client';

import { useEffect, useRef, useState } from 'react';

const projectImage = '/case-studies/akkikb.jpg';

export function CaseStudiesSection() {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <section
      className="section case-studies-section"
      id="trabajos-realizados"
      aria-labelledby="case-studies-title"
    >
      <div className="shell">
        <div className="section-heading-wide case-studies-heading">
          <div>
            <p className="eyebrow">Portafolio</p>
            <h2 id="case-studies-title">Trabajos realizados</h2>
          </div>
          <p>
            Una muestra de proyectos en los que convertimos necesidades concretas en soluciones
            digitales.
          </p>
        </div>
        <div className="case-study-grid">
          <button className="case-study-card" type="button" onClick={() => setIsOpen(true)}>
            <span className="case-study-image-wrap">
              <img src={projectImage} alt="Logotipo de AKKIKB" loading="lazy" />
            </span>
            <span className="case-study-card-content">
              <span className="case-study-kicker">Caso de éxito · México</span>
              <strong>AKKIKB</strong>
              <span>
                Ver detalle del trabajo realizado <span aria-hidden="true">↗</span>
              </span>
            </span>
          </button>
        </div>
      </div>
      {isOpen ? (
        <div
          className="case-study-modal-backdrop"
          role="presentation"
          onMouseDown={() => setIsOpen(false)}
        >
          <div
            className="case-study-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="akkikb-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setIsOpen(false)}
              ref={closeButtonRef}
            >
              <span aria-hidden="true">×</span> Cerrar
            </button>
            <div className="case-study-modal-image">
              <img src={projectImage} alt="Logotipo de AKKIKB" />
            </div>
            <div className="case-study-modal-body">
              <p className="eyebrow">Caso de éxito</p>
              <h2 id="akkikb-modal-title">AKKIKB</h2>
              <p className="case-study-description">
                Proyecto realizado para AKKIKB, con foco en construir una presencia digital clara,
                confiable y alineada con las necesidades de su operación.
              </p>
              <dl className="case-study-facts">
                <div>
                  <dt>País</dt>
                  <dd>México</dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>Trabajo realizado</dd>
                </div>
              </dl>
              <div className="case-study-comments">
                <h3>Comentarios</h3>
                <p className="comment-placeholder">
                  Este espacio queda disponible para compartir comentarios y aprendizajes del
                  proyecto.
                </p>
                <textarea
                  aria-label="Comentario sobre AKKIKB"
                  placeholder="Escribe un comentario…"
                  rows={4}
                />
                <button className="button button-secondary" type="button">
                  Enviar comentario
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
