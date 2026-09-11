import CarsManager from '../components/CarsManager';
import { PageHeader } from '../components/admin/ui';

export default function Approvals() {
  return (
    <div className="space-y-4">
      <PageHeader kicker="Queue" title="Listing approvals" subtitle="Pending listings before they go live. Prefer the full inspection tools under Listing moderation." />
      <CarsManager defaultStatus="pending" />
    </div>
  );
}
