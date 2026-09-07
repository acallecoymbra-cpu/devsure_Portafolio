import type { Metadata } from 'next';
import { ProjectForm } from '@/features/admin/components/project-form';

export const metadata: Metadata = {
  title: 'Nuevo proyecto · Administración',
};

export default function NewProjectPage() {
  return <ProjectForm />;
}
