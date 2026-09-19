import { CultureForm } from '@/features/admin/components/culture-form';
import { CulturePillarsManager } from '@/features/admin/components/culture-pillars-manager';
import { CultureTeamManager } from '@/features/admin/components/culture-team-manager';

export default function AdminCulturePage() {
  return <><CultureForm /><CulturePillarsManager /><CultureTeamManager /></>;
}
