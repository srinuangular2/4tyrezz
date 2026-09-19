import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export default function RequireDealer({ children }) {
  const { user, token } = useSelector((s) => s.auth);
  if (!token || user?.role !== 'dealer') return <Navigate to="/dealer/login" replace />;
  return children;
}
