import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children, roles, requiredPermission }) {
  const { user } = useSelector((s) => s.auth);
  const location = useLocation();
  if (!user) {
    const dealerOnly = Array.isArray(roles) && roles.length === 1 && roles[0] === 'dealer';
    return <Navigate to={dealerOnly ? '/dealer/login' : '/login'} state={{ from: location.pathname }} replace />;
  }
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  if (requiredPermission) {
    const perms = user.permissions || [];
    const ok =
      user.role === 'admin' ||
      user.role === 'super_admin' ||
      perms.includes(requiredPermission);
    if (!ok) return <Navigate to="/" replace />;
  }
  return children;
}
