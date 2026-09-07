import type { Metadata } from 'next';
import { StrengthEditor } from '@/features/admin/components/strength-form';

export const metadata: Metadata = {
  title: 'Editar fortaleza · Administración',
};

export default async function EditStrengthPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StrengthEditor id={id} />;
}
