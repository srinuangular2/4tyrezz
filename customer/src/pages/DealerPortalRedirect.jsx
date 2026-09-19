import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { openDealerPortal } from '../lib/dealerPortal';

export default function DealerPortalRedirect() {
  const location = useLocation();

  useEffect(() => {
    openDealerPortal(`${location.pathname}${location.search || ''}`);
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <p className="text-sm font-semibold text-slate-500">Opening the dealer portal…</p>
    </div>
  );
}
