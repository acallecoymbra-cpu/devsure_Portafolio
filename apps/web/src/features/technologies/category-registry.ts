export const TECHNOLOGY_CATEGORIES = [
  { key: 'lenguajes-programacion', label: 'Lenguajes de programación' },
  { key: 'automatizacion-pruebas', label: 'Automatización de pruebas web y mobile' },
  { key: 'rpa-low-code', label: 'RPA y low-code' },
  { key: 'backend-frameworks', label: 'Backend y frameworks' },
  { key: 'cms-comercio', label: 'CMS y comercio electrónico' },
  { key: 'arquitectura-practicas', label: 'Arquitectura y prácticas' },
  { key: 'devops-ci-cd', label: 'DevOps y CI/CD' },
  { key: 'observabilidad-cloud', label: 'Observabilidad y cloud' },
  { key: 'pruebas-rendimiento', label: 'Pruebas de rendimiento' },
  { key: 'metodologias-herramientas', label: 'Metodologías y herramientas' },
] as const;

const categoryLabels = new Map<string, string>(
  TECHNOLOGY_CATEGORIES.map(({ key, label }) => [key, label]),
);

export function getCategoryLabel(category: string): string {
  return categoryLabels.get(category) ?? category.replaceAll('-', ' ');
}
