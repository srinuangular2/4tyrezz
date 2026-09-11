import { Link } from 'react-router-dom';
import CarsManager from '../components/CarsManager';
import { PageHeader, btnPrimary } from '../components/admin/ui';

export default function Cars() {
  return (
    <div className="space-y-5">
      <PageHeader
        kicker="Marketplace inventory"
        title="Vehicle listings"
        subtitle="Live inventory with status filters, featured flags, and approval actions."
        actions={<Link to="/cars/add" className={btnPrimary}>+ Add car</Link>}
      />
      <CarsManager />
    </div>
  );
}
