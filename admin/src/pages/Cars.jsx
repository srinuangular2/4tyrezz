import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import CarsManager from '../components/CarsManager';
import { PageHeader, btnPrimary } from '../components/admin/ui';

export default function Cars() {
  const role = useSelector((state) => state.auth.user?.role);
  const isExecutive = role === 'executive_agent';

  return (
    <div className="space-y-5">
      <PageHeader
        kicker={isExecutive ? 'My inventory' : 'Marketplace inventory'}
        title={isExecutive ? 'My vehicles' : 'Vehicle listings'}
        subtitle={isExecutive
          ? 'Only cars you uploaded. Approval and stock update here as the main admin reviews them.'
          : 'Published cars, plus executive and field-agent uploads waiting for your approval. Dealer bulk uploads stay in Listing moderation.'}
        actions={<Link to="/cars/add" className={btnPrimary}>{isExecutive ? 'Upload new car' : '+ Add car'}</Link>}
      />
      <CarsManager liveOnly={!isExecutive} />
    </div>
  );
}
