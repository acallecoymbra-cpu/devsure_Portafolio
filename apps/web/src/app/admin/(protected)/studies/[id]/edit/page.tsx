import type { Metadata } from 'next';
import { StudyEditor } from '@/features/admin/components/study-form';

export const metadata: Metadata = {
  title: 'Editar educación · Administración',
};

export default async function EditStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudyEditor id={id} />;
}
