import type { Metadata } from 'next';
import { ExperienceEditor } from '@/features/admin/components/experience-form';

export const metadata: Metadata = {
  title: 'Editar experiencia · Administración',
};

export default async function EditExperiencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ExperienceEditor id={id} />;
}
