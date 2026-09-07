import type { Metadata } from 'next';
import { TechnologyEditor } from '@/features/admin/components/technology-form';

export const metadata: Metadata = {
  title: 'Editar tecnología · Administración',
};

export default async function EditTechnologyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TechnologyEditor id={id} />;
}
