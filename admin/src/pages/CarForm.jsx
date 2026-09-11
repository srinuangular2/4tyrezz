import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AddCarWizard from '../components/common/AddCarWizard';
import api from '../api/axios';

export default function CarForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [owner, setOwner] = useState('');
  const [dealers, setDealers] = useState([]);

  useEffect(() => {
    api.get('/admin/users', { params: { role: 'dealer', limit: 100 } })
      .then((r) => setDealers(r.data.users || []))
      .catch(() => setDealers([]));
  }, []);

  return (
    <AddCarWizard
      variant="admin"
      editId={id}
      dealers={dealers}
      ownerId={owner}
      onOwnerChange={setOwner}
      afterSave={() => navigate('/cars')}
    />
  );
}
