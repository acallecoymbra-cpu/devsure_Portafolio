import type { TechnologyPublicationStatus } from '../../technologies/entities/technology.entity';

export interface TechnologySeedRecord {
  id: string;
  name: string;
  slug: string;
  category: string;
  summary: null;
  iconKey: string;
  featured: false;
  sortOrder: number;
  publicationStatus: TechnologyPublicationStatus;
  publishedAt: Date;
}

const PUBLISHED_AT = '2026-08-25T00:00:00.000Z';

const catalog = [
  ['Java', 'java', 'lenguajes-programacion', 'code'],
  ['C#', 'c-sharp', 'lenguajes-programacion', 'code'],
  ['PHP', 'php', 'lenguajes-programacion', 'code'],
  ['Python', 'python', 'lenguajes-programacion', 'code'],
  ['JavaScript', 'javascript', 'lenguajes-programacion', 'code'],
  ['TypeScript', 'typescript', 'lenguajes-programacion', 'code'],
  ['Selenium WebDriver', 'selenium-webdriver', 'automatizacion-pruebas', 'test-automation'],
  ['Appium', 'appium', 'automatizacion-pruebas', 'test-automation'],
  ['Cypress', 'cypress', 'automatizacion-pruebas', 'test-automation'],
  ['Playwright', 'playwright', 'automatizacion-pruebas', 'test-automation'],
  ['Serenity BDD', 'serenity-bdd', 'automatizacion-pruebas', 'test-automation'],
  ['Robot Framework', 'robot-framework', 'automatizacion-pruebas', 'test-automation'],
  ['WinAppDriver', 'winappdriver', 'automatizacion-pruebas', 'test-automation'],
  ['Robocorp', 'robocorp', 'rpa-low-code', 'automation'],
  ['Microsoft Power Automate', 'microsoft-power-automate', 'rpa-low-code', 'automation'],
  ['Laravel', 'laravel', 'backend-frameworks', 'backend'],
  ['Vue.js', 'vue-js', 'backend-frameworks', 'backend'],
  ['NestJS', 'nestjs', 'backend-frameworks', 'backend'],
  ['Next.js', 'next-js', 'backend-frameworks', 'backend'],
  ['Node.js', 'node-js', 'backend-frameworks', 'backend'],
  ['WordPress', 'wordpress', 'cms-comercio', 'web-platform'],
  ['WooCommerce', 'woocommerce', 'cms-comercio', 'web-platform'],
  ['Microservicios', 'microservicios', 'arquitectura-practicas', 'architecture'],
  ['APIs RESTful', 'apis-restful', 'arquitectura-practicas', 'architecture'],
  ['Principios SOLID', 'principios-solid', 'arquitectura-practicas', 'architecture'],
  ['Clean Code', 'clean-code', 'arquitectura-practicas', 'architecture'],
  [
    'Model Context Protocol (MCP)',
    'model-context-protocol-mcp',
    'arquitectura-practicas',
    'architecture',
  ],
  ['Jenkins Pipelines', 'jenkins-pipelines', 'devops-ci-cd', 'delivery'],
  ['GitHub Actions', 'github-actions', 'devops-ci-cd', 'delivery'],
  ['Docker', 'docker', 'devops-ci-cd', 'delivery'],
  ['Azure DevOps', 'azure-devops', 'devops-ci-cd', 'delivery'],
  ['New Relic', 'new-relic', 'observabilidad-cloud', 'observability'],
  ['Cloudflare Essentials', 'cloudflare-essentials', 'observabilidad-cloud', 'observability'],
  ['k6', 'k6', 'pruebas-rendimiento', 'performance'],
  ['JMeter', 'jmeter', 'pruebas-rendimiento', 'performance'],
  ['Artillery', 'artillery', 'pruebas-rendimiento', 'performance'],
  ['Scrum', 'scrum', 'metodologias-herramientas', 'collaboration'],
  ['Jira Agile', 'jira-agile', 'metodologias-herramientas', 'collaboration'],
  ['Estándares ISTQB', 'estandares-istqb', 'metodologias-herramientas', 'collaboration'],
  ['Git', 'git', 'metodologias-herramientas', 'collaboration'],
  ['Postman', 'postman', 'metodologias-herramientas', 'collaboration'],
] as const;

export const TECHNOLOGY_SEED_DATA: readonly TechnologySeedRecord[] = catalog.map(
  ([name, slug, category, iconKey], index) => {
    const sortOrder = index + 1;

    return {
      id: technologyId(sortOrder),
      name,
      slug,
      category,
      summary: null,
      iconKey,
      featured: false,
      sortOrder,
      publicationStatus: 'published',
      publishedAt: new Date(PUBLISHED_AT),
    };
  },
);

function technologyId(sortOrder: number): string {
  return `00000000-0000-4000-8000-${sortOrder.toString().padStart(12, '0')}`;
}
