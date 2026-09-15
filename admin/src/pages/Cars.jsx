import { Link } from 'react-router-dom';
import CarsManager from '../components/CarsManager';
import { PageHeader, btnPrimary } from '../components/admin/ui';

export default function Cars() {
  return (
    <div className="space-y-5">
      <PageHeader
        kicker="Marketplace inventory"
        title="Vehicle listings"
        subtitle="Newest listings first. Premium means ask price of ₹15 Lakh or more."
        actions={<Link to="/cars/add" className={btnPrimary}>+ Add car</Link>}
      />
      <CarsManager />
    </div>
  );
}
