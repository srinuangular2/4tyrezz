import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import RequireDealer from './components/RequireDealer';
import DealerLogin from './pages/DealerLogin';
import DealerOnboarding from './pages/DealerOnboarding';
import DealerLayout from './pages/DealerLayout';
import DealerAnalytics from './pages/DealerAnalytics';
import DealerInventory from './pages/DealerInventory';
import DealerAddCar from './pages/DealerAddCar';
import DealerSettings from './pages/DealerSettings';
import DealerBulkUpload from './pages/DealerBulkUpload';
import DealerPromotions from './pages/DealerPromotions';
import DealerPerformance from './pages/DealerPerformance';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/dealer/login" replace />} />
        <Route path="/dealer" element={<Navigate to="/dealer/login" replace />} />
        <Route path="/dealer/login" element={<DealerLogin />} />
        <Route path="/dealer/register" element={<Navigate to="/dealer/login" replace />} />
        <Route path="/dealer/onboarding" element={<RequireDealer><DealerOnboarding /></RequireDealer>} />
        <Route path="/dealer/kyc" element={<Navigate to="/dealer/onboarding" replace />} />
        <Route
          path="/dealer/dashboard"
          element={(
            <RequireDealer>
              <DealerLayout />
            </RequireDealer>
          )}
        >
          <Route index element={<DealerAnalytics />} />
          <Route path="inventory" element={<DealerInventory />} />
          <Route path="inventory/add" element={<DealerAddCar />} />
          <Route path="inventory/edit/:id" element={<DealerAddCar />} />
          <Route path="inventory/bulk" element={<DealerBulkUpload />} />
          <Route path="bulk-upload" element={<Navigate to="/dealer/dashboard/inventory/bulk" replace />} />
          <Route path="add-car" element={<Navigate to="/dealer/dashboard/inventory/add" replace />} />
          <Route path="edit-car/:id" element={<DealerAddCar />} />
          <Route path="promotions" element={<DealerPromotions />} />
          <Route path="analytics" element={<DealerPerformance />} />
          <Route path="performance" element={<Navigate to="/dealer/dashboard/analytics" replace />} />
          <Route path="settings" element={<DealerSettings />} />
          <Route path="kyc" element={<Navigate to="/dealer/onboarding" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/dealer/login" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}
