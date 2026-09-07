import type { Metadata } from 'next';
import { WorkStyleItemEditor } from '@/features/admin/components/work-style-item-form';

export const metadata: Metadata = {
  title: 'Editar bullet · Administración',
};

export default async function EditWorkStyleItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkStyleItemEditor id={id} />;
}
