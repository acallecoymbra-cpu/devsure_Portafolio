import type { Metadata } from 'next';
import { StudyForm } from '@/features/admin/components/study-form';

export const metadata: Metadata = {
  title: 'Nueva educación · Administración',
};

export default function NewStudyPage() {
  return <StudyForm />;
}
