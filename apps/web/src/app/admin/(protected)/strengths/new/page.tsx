import type { Metadata } from 'next';
import { StrengthForm } from '@/features/admin/components/strength-form';

export const metadata: Metadata = {
  title: 'Nueva fortaleza · Administración',
};

export default function NewStrengthPage() {
  return <StrengthForm />;
}
