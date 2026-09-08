import type { Metadata } from 'next';
import { FaqEditor } from '@/features/admin/components/faq-form';

export const metadata: Metadata = {
  title: 'Editar pregunta · Administración',
};

export default async function EditFaqPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FaqEditor id={id} />;
}
