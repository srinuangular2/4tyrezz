import { useState } from 'react';
import Brands from './Brands';
import Models from './Models';
import Cities from './Cities';
import CarsManager from '../components/CarsManager';
import { FilterPills, PageHeader } from '../components/admin/ui';

export default function InventoryEngine() {
  const [tab, setTab] = useState('brands');
  return (
    <div className="space-y-4">
      <PageHeader kicker="Catalog" title="Master inventory engine" subtitle="Platform-wide brands, models, and cities used by every listing wizard." />
      <FilterPills
        value={tab}
        onChange={setTab}
        options={[
          { value: 'brands', label: 'Brands' },
          { value: 'models', label: 'Models' },
          { value: 'cities', label: 'Cities' },
          { value: 'stock', label: 'Dealer stock' },
        ]}
      />
      {tab === 'brands' && <Brands />}
      {tab === 'models' && <Models />}
      {tab === 'cities' && <Cities />}
      {tab === 'stock' && <CarsManager />}
    </div>
  );
}
