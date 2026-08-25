import type { ReactNode } from 'react';

type Brand = { label: string; background: string; foreground?: string };

function brandMark({ label, background, foreground = '#ffffff' }: Brand): ReactNode {
  return (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" fill={background} stroke="none" />
      <text
        x="12"
        y="15"
        fill={foreground}
        fontFamily="Arial, sans-serif"
        fontSize={label.length > 3 ? '5.5' : '7'}
        fontWeight="700"
        textAnchor="middle"
        stroke="none"
      >
        {label}
      </text>
    </>
  );
}

const technologyBrands: Record<string, Brand> = {
  java: { label: 'Java', background: '#5382a1' },
  'c-sharp': { label: 'C#', background: '#68217a' },
  php: { label: 'PHP', background: '#777bb4' },
  python: { label: 'Py', background: '#3776ab' },
  javascript: { label: 'JS', background: '#f7df1e', foreground: '#111827' },
  typescript: { label: 'TS', background: '#3178c6' },
  'selenium-webdriver': { label: 'Se', background: '#43b02a' },
  appium: { label: 'Ap', background: '#662d91' },
  cypress: { label: 'Cy', background: '#17202c' },
  playwright: { label: 'Pw', background: '#2ead33' },
  'serenity-bdd': { label: 'Sb', background: '#15aabf' },
  'robot-framework': { label: 'Rf', background: '#c62828' },
  winappdriver: { label: 'Wa', background: '#0078d4' },
  robocorp: { label: 'Rc', background: '#f05a28' },
  'microsoft-power-automate': { label: 'Pa', background: '#0066ff' },
  laravel: { label: 'La', background: '#ff2d20' },
  'vue-js': { label: 'Vu', background: '#41b883' },
  nestjs: { label: 'Ne', background: '#e0234e' },
  'next-js': { label: 'Nx', background: '#111111' },
  'node-js': { label: 'No', background: '#339933' },
  wordpress: { label: 'Wp', background: '#21759b' },
  woocommerce: { label: 'Wc', background: '#96588a' },
  microservicios: { label: 'MS', background: '#334155' },
  'apis-restful': { label: 'API', background: '#0f766e' },
  'principios-solid': { label: 'So', background: '#475569' },
  'clean-code': { label: 'Cc', background: '#334155' },
  'model-context-protocol-mcp': { label: 'MCP', background: '#7c3aed' },
  'jenkins-pipelines': { label: 'Je', background: '#d24939' },
  'github-actions': { label: 'Ga', background: '#24292f' },
  docker: { label: 'Dc', background: '#2496ed' },
  'azure-devops': { label: 'Az', background: '#0078d4' },
  'new-relic': { label: 'Nr', background: '#1ce783', foreground: '#052e16' },
  'cloudflare-essentials': { label: 'Cf', background: '#f38020' },
  k6: { label: 'k6', background: '#7d64ff' },
  jmeter: { label: 'Jm', background: '#d22128' },
  artillery: { label: 'Ar', background: '#8b5cf6' },
  scrum: { label: 'Sc', background: '#2563eb' },
  'jira-agile': { label: 'Ji', background: '#0052cc' },
  'estandares-istqb': { label: 'IQ', background: '#0f766e' },
  git: { label: 'Gi', background: '#f05032' },
  postman: { label: 'Pm', background: '#ff6c37' },
};

const iconRegistry: Record<string, ReactNode> = {
  code: (
    <>
      <path d="m9 8-4 4 4 4" />
      <path d="m15 8 4 4-4 4" />
      <path d="m14 4-4 16" />
    </>
  ),
  'test-automation': (
    <>
      <path d="M9 4h6" />
      <path d="M10 4v4l-4.5 8.2A2.5 2.5 0 0 0 7.7 20h8.6a2.5 2.5 0 0 0 2.2-3.8L14 8V4" />
      <path d="m9 15 2 2 4-4" />
    </>
  ),
  automation: (
    <>
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="m4.2 7.5 2.6 1.5" />
      <path d="m17.2 15 2.6 1.5" />
      <path d="m4.2 16.5 2.6-1.5" />
      <path d="m17.2 9 2.6-1.5" />
      <circle cx="12" cy="12" r="4" />
    </>
  ),
  backend: (
    <>
      <ellipse cx="12" cy="5" rx="7" ry="3" />
      <path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />
      <path d="M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7" />
    </>
  ),
  'web-platform': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.4 2.5 3.5 5.5 3.5 9S14.4 18.5 12 21" />
      <path d="M12 3C9.6 5.5 8.5 8.5 8.5 12S9.6 18.5 12 21" />
    </>
  ),
  architecture: (
    <>
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="3" width="6" height="6" rx="1" />
      <rect x="9" y="15" width="6" height="6" rx="1" />
      <path d="M6 9v3h12V9" />
      <path d="M12 12v3" />
    </>
  ),
  delivery: (
    <>
      <path d="M4 15V5h10v10" />
      <path d="M14 8h3l3 4v3h-6" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
      <path d="M9 17h6" />
    </>
  ),
  observability: (
    <>
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  performance: (
    <>
      <path d="M5.6 18a8 8 0 1 1 12.8 0" />
      <path d="m12 14 4-5" />
      <circle cx="12" cy="14" r="1" />
    </>
  ),
  collaboration: (
    <>
      <circle cx="8" cy="9" r="3" />
      <circle cx="17" cy="8" r="2" />
      <path d="M3 20c0-3.3 2.2-6 5-6s5 2.7 5 6" />
      <path d="M14 14c3.8-.8 7 1.8 7 5" />
    </>
  ),
};

const fallbackIcon = (
  <>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M9 9h6v6H9z" />
  </>
);

export function getTechnologyIcon(iconKey: string, slug?: string): ReactNode {
  return (
    (slug && technologyBrands[slug] ? brandMark(technologyBrands[slug]) : iconRegistry[iconKey]) ??
    fallbackIcon
  );
}
