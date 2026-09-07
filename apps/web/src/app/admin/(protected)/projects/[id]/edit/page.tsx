import type { Metadata } from 'next';
import { ProjectEditor } from '@/features/admin/components/project-form';

export const metadata: Metadata = {
  title: 'Editar proyecto · Administración',
};

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectEditor id={id} />;
}
