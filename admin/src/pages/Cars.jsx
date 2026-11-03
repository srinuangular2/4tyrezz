import { Link } from 'react-router-dom';
import CarsManager from '../components/CarsManager';
import { PageHeader, btnPrimary } from '../components/admin/ui';

export default function Cars() {
  return (
    <div className="space-y-5">
      <PageHeader
        kicker="Marketplace inventory"
        title="Vehicle listings"
        subtitle="Inspected and published cars only. Dealer bulk uploads stay in Listing moderation until you approve them."
        actions={<Link to="/cars/add" className={btnPrimary}>+ Add car</Link>}
      />
      <CarsManager liveOnly />
    </div>
  );
}
