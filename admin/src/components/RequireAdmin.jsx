import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export default function RequireAdmin({ children }) {
  const { user } = useSelector((s) => s.auth);
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;
  return children;
}
