import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/** Legacy /dashboard/* URLs redirect into the dealer sidebar or customer profile. */
export default function DashboardLayout() {
  const { user } = useSelector((s) => s.auth);
  const location = useLocation();

  if (user?.role === 'dealer') {
    let rest = location.pathname.replace(/^\/dashboard/, '') || '';
    if (rest === '/profile') rest = '/settings';
    return <Navigate to={`/dealer/dashboard${rest}${location.search}`} replace />;
  }

  if (location.pathname.includes('wishlist')) {
    return <Navigate to="/profile/wishlist" replace />;
  }

  return <Navigate to="/profile/orders" replace />;
}
