import { Navigate, Route, Routes } from 'react-router-dom';
import RequireAdmin from './components/RequireAdmin';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cars from './pages/Cars';
import Approvals from './pages/Approvals';
import Banners from './pages/Banners';
import Analytics from './pages/Analytics';
import CarForm from './pages/CarForm';
import Users from './pages/Users';
import Dealers from './pages/Dealers';
import Brands from './pages/Brands';
import Models from './pages/Models';
import Cities from './pages/Cities';
import ContentCMS from './pages/ContentCMS';
import Commissions from './pages/Commissions';
import FinanceHub from './pages/FinanceHub';
import InsuranceLeads from './pages/InsuranceLeads';
import SellExchange from './pages/SellExchange';
import InventoryEngine from './pages/InventoryEngine';
import Leads from './pages/Leads';
import TestDrives from './pages/TestDrives';
import BookingsAdmin from './pages/BookingsAdmin';
import Payments from './pages/Payments';
import Promotions from './pages/Promotions';
import ReviewsAdmin from './pages/ReviewsAdmin';
import Support from './pages/Support';
import Settings from './pages/Settings';
import Moderation from './pages/Moderation';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<Dashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<Navigate to="/analytics" replace />} />
          <Route path="customers" element={<Users />} />
          <Route path="users" element={<Users />} />
          <Route path="dealers" element={<Dealers />} />
          <Route path="cars" element={<Cars />} />
          <Route path="cars/add" element={<CarForm />} />
          <Route path="add-car" element={<CarForm />} />
          <Route path="cars/edit/:id" element={<CarForm />} />
          <Route path="inventory" element={<InventoryEngine />} />
          <Route path="brands" element={<Brands />} />
          <Route path="models" element={<Models />} />
          <Route path="cities" element={<Cities />} />
          <Route path="leads" element={<Leads />} />
          <Route path="test-drives" element={<TestDrives />} />
          <Route path="bookings" element={<BookingsAdmin />} />
          <Route path="payments" element={<Payments />} />
          <Route path="commissions" element={<Commissions />} />
          <Route path="finance" element={<FinanceHub />} />
          <Route path="insurance" element={<InsuranceLeads />} />
          <Route path="sell-exchange" element={<SellExchange />} />
          <Route path="promotions" element={<Promotions />} />
          <Route path="banners" element={<Banners />} />
          <Route path="listings/moderation" element={<Moderation />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="reviews" element={<ReviewsAdmin />} />
          <Route path="support" element={<Support />} />
          <Route path="content" element={<ContentCMS />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{ style: { background: '#0f172a', color: '#e2e8f0', border: '1px solid #1e293b' } }}
      />
    </>
  );
}
