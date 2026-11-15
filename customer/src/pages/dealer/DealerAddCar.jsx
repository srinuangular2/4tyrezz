import { useNavigate, useParams } from 'react-router-dom';
import AddCarWizard from '../../components/common/AddCarWizard';

export default function DealerAddCar() {
  const navigate = useNavigate();
  const { id } = useParams();
  return (
    <AddCarWizard
      variant="dealer"
      editId={id}
      onExit={() => navigate('/dealer/dashboard/inventory')}
      afterSave={() => navigate('/dealer/dashboard/inventory')}
    />
  );
}
