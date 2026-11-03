import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export default function RequireAdmin({ children }) {
  const { user } = useSelector((s) => s.auth);
  const allowed = ['admin', 'field_agent', 'executive_agent'];
  if (!user || !allowed.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}
