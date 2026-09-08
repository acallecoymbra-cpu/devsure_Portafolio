import type { Metadata } from 'next';
import Link from 'next/link';
import { getPortfolio } from '@/features/portfolio/api/get-portfolio';
import { getAllPublishedProjects } from '@/features/projects/api/get-projects';
import { ProjectsExplorer } from '@/features/projects/components/projects-explorer';

export const metadata: Metadata = {
  title: 'Casos de éxito',
  description: 'Proyectos que DevSure ya construyó y tiene en operación.',
  alternates: { canonical: '/casos-de-exito' },
};

export default async function CasosDeExitoPage() {
  const [projects, portfolio] = await Promise.all([getAllPublishedProjects(), getPortfolio()]);
  const locale = portfolio.profile.defaultLocale || 'es';

  return (
    <section className="section case-studies-page" aria-labelledby="case-studies-page-title">
      <div className="shell">
        <div className="section-heading section-heading-wide">
          <div>
            <p className="eyebrow">Casos de éxito</p>
            <h1 id="case-studies-page-title">Proyectos que ya están operando</h1>
          </div>
          <p>Una muestra de lo que hemos construido. Si tu reto se parece a alguno de estos, hablemos.</p>
        </div>

        {projects.length > 0 ? (
          <ProjectsExplorer projects={projects} locale={locale} />
        ) : (
          <div className="catalog-empty" role="status">
            <h3>Aún no hay casos publicados</h3>
            <p>Vuelve pronto — estamos documentando nuestros proyectos.</p>
          </div>
        )}

        <div className="cta-banner">
          <h2>¿Tienes un reto parecido?</h2>
          <Link className="button button-primary" href="/#contacto">
            Cuéntanos tu proyecto <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
