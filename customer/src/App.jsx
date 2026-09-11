import { useEffect } from 'react';
import { Navigate, Routes, Route, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';

import Header from './components/Header';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import CompareTray from './components/CompareTray';
import ProtectedRoute from './components/ProtectedRoute';
import { fetchWishlist } from './app/wishlistSlice';
import { RealtimeAlertsProvider } from './hooks/useRealtimeAlerts';

import Home from './pages/Home';
import Brands from './pages/Brands';
import Listing from './pages/Listing';
import CarDetails from './pages/CarDetails';
import Login from './pages/Login';
import DealerLogin from './pages/DealerLogin';
import DealerOnboarding from './pages/dealer/DealerOnboarding';
import DealerLayout from './pages/dealer/DealerLayout';
import DealerAnalytics from './pages/dealer/DealerAnalytics';
import DealerInventory from './pages/dealer/DealerInventory';
import DealerAddCar from './pages/dealer/DealerAddCar';
import DealerLeads from './pages/dealer/DealerLeads';
import DealerSettings from './pages/dealer/DealerSettings';
import DealerBulkUpload from './pages/dealer/DealerBulkUpload';
import DealerLeadCrm from './pages/dealer/DealerLeadCrm';
import DealerTestDrives from './pages/dealer/DealerTestDrives';
import DealerBookings from './pages/dealer/DealerBookings';
import DealerPromotions from './pages/dealer/DealerPromotions';
import DealerPerformance from './pages/dealer/DealerPerformance';
import Compare from './pages/Compare';
import SellCar from './pages/SellCar';
import Finance from './pages/Finance';
import Insurance from './pages/Insurance';
import Offers from './pages/Offers';
import Valuation from './pages/Valuation';
import { DealersList, DealerProfile } from './pages/DealersPages';
import { About, Contact, FAQs, Blog, Careers, Terms, Privacy, CorporatePolicies } from './pages/Static';

import DashboardLayout from './pages/dashboard/DashboardLayout';
import ProfileLayout from './pages/profile/ProfileLayout';
import ProfileWishlist from './pages/profile/Wishlist';
import MyVehicles from './pages/profile/MyVehicles';
import Garage from './pages/profile/Garage';
import Consents from './pages/profile/Consents';
import Settings from './pages/profile/Settings';
import Enquiries from './pages/profile/Enquiries';
import SavedSearches from './pages/profile/SavedSearches';
import Comparisons from './pages/profile/Comparisons';
import TestDrives from './pages/profile/TestDrives';
import Bookings from './pages/profile/Bookings';
import FinanceApplications from './pages/profile/FinanceApplications';
import InsuranceEnquiries from './pages/profile/InsuranceEnquiries';
import Notifications from './pages/profile/Notifications';
import SupportTickets from './pages/profile/SupportTickets';
import CustomerRegister from './pages/auth/CustomerRegister';
import CustomerLogin from './pages/auth/CustomerLogin';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

export const notifyNewCarAdded = (car) => {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex border border-slate-200 p-4 transition-all duration-300`}
      >
        <div className="flex-1 flex items-center gap-3">
          <img
            className="h-14 w-14 rounded-xl object-cover border border-slate-100 shrink-0"
            src={car?.image || car?.images?.[0] || 'https://via.placeholder.com/150'}
            alt="Car Preview"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                New Inventory Added!
              </p>
            </div>
            <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
              {car?.year || ''} {car?.title || car?.name || 'New Vehicle Listing'}
            </p>
            <p className="text-xs font-semibold text-slate-500">
              Price: <span className="text-slate-900 font-bold">₹{car?.price || 'N/A'} Lakhs</span>
            </p>
          </div>
        </div>
      </div>
    ),
    { duration: 5000 }
  );
};

if (typeof window !== 'undefined') {
  window.notifyNewCarAdded = notifyNewCarAdded;
}

function DashboardIndex() {
  const { user } = useSelector((s) => s.auth);
  if (user?.role === 'dealer') return <Navigate to="/dealer/dashboard" replace />;
  return <Navigate to="/profile/settings" replace />;
}

function InventoryEditAlias() {
  const { id } = useParams();
  return <Navigate to={`/dealer/dashboard/inventory/edit/${id}`} replace />;
}

export default function App() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    if (user) dispatch(fetchWishlist());
  }, [user, dispatch]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const alertsEnabled = Boolean(user && token && (user.role === 'dealer' || user.role === 'customer'));
  const alertsVariant = user?.role === 'dealer' ? 'dealer' : 'customer';

  return (
    <RealtimeAlertsProvider token={token} enabled={alertsEnabled} variant={alertsVariant}>
      <div className="min-h-screen flex flex-col">
        <div className="w-full flex flex-col flex-1">
          <Header />
          <main className="flex-1 pb-20 lg:pb-0">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/cars" element={<Listing />} />
              <Route path="/buy-cars" element={<Listing />} />
              <Route path="/cars/:id" element={<CarDetails />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/sell" element={<SellCar />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/insurance" element={<Insurance />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/valuation" element={<Valuation />} />
              <Route path="/dealers" element={<DealersList />} />
              <Route path="/dealers/:id" element={<DealerProfile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Navigate to="/customer/register" replace />} />
              <Route path="/forgot-password" element={<Navigate to="/customer/forgot-password" replace />} />
              <Route path="/customer/register" element={<CustomerRegister />} />
              <Route path="/customer/login" element={<CustomerLogin />} />
              <Route path="/customer/forgot-password" element={<ForgotPassword />} />
              <Route path="/customer/reset-password" element={<ResetPassword />} />
              <Route path="/customer/verify-email" element={<VerifyEmail />} />
              <Route path="/dealer/login" element={<DealerLogin />} />
              <Route path="/dealer/register" element={<Navigate to="/dealer/onboarding" replace />} />
              <Route path="/dealer/onboarding" element={<DealerOnboarding />} />
              <Route
                path="/dealer/kyc"
                element={
                  <ProtectedRoute roles={['dealer']}>
                    <Navigate to="/dealer/onboarding" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dealer/add-car"
                element={
                  <ProtectedRoute roles={['dealer']}>
                    <Navigate to="/dealer/dashboard/inventory/add" replace />
                  </ProtectedRoute>
                }
              />
              <Route path="/dealer/inventory" element={<ProtectedRoute roles={['dealer']}><Navigate to="/dealer/dashboard/inventory" replace /></ProtectedRoute>} />
              <Route path="/dealer/inventory/add" element={<ProtectedRoute roles={['dealer']}><Navigate to="/dealer/dashboard/inventory/add" replace /></ProtectedRoute>} />
              <Route path="/dealer/inventory/edit/:id" element={<ProtectedRoute roles={['dealer']}><InventoryEditAlias /></ProtectedRoute>} />
              <Route path="/dealer/inventory/bulk" element={<ProtectedRoute roles={['dealer']}><Navigate to="/dealer/dashboard/inventory/bulk" replace /></ProtectedRoute>} />
              <Route path="/dealer/bulk-upload" element={<ProtectedRoute roles={['dealer']}><Navigate to="/dealer/dashboard/inventory/bulk" replace /></ProtectedRoute>} />
              <Route path="/dealer/leads" element={<ProtectedRoute roles={['dealer']}><Navigate to="/dealer/dashboard/leads" replace /></ProtectedRoute>} />
              <Route path="/dealer/leads-crm" element={<ProtectedRoute roles={['dealer']}><Navigate to="/dealer/dashboard/leads" replace /></ProtectedRoute>} />
              <Route path="/dealer/test-drives" element={<ProtectedRoute roles={['dealer']}><Navigate to="/dealer/dashboard/test-drives" replace /></ProtectedRoute>} />
              <Route path="/dealer/bookings" element={<ProtectedRoute roles={['dealer']}><Navigate to="/dealer/dashboard/bookings" replace /></ProtectedRoute>} />
              <Route path="/dealer/promotions" element={<ProtectedRoute roles={['dealer']}><Navigate to="/dealer/dashboard/promotions" replace /></ProtectedRoute>} />
              <Route path="/dealer/analytics" element={<ProtectedRoute roles={['dealer']}><Navigate to="/dealer/dashboard/analytics" replace /></ProtectedRoute>} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faqs" element={<FAQs />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/corporate-policies" element={<CorporatePolicies />} />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute roles={['customer']}>
                    <ProfileLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="settings" replace />} />
                <Route path="settings" element={<Settings />} />
                <Route path="enquiries" element={<Enquiries />} />
                <Route path="wishlist" element={<ProfileWishlist />} />
                <Route path="saved-searches" element={<SavedSearches />} />
                <Route path="comparisons" element={<Comparisons />} />
                <Route path="test-drives" element={<TestDrives />} />
                <Route path="bookings" element={<Bookings />} />
                <Route path="finance-applications" element={<FinanceApplications />} />
                <Route path="insurance-enquiries" element={<InsuranceEnquiries />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="support-tickets" element={<SupportTickets />} />
                <Route path="orders" element={<Navigate to="/profile/bookings" replace />} />
                <Route path="activity" element={<Navigate to="/profile/notifications" replace />} />
                <Route path="my-vehicles" element={<MyVehicles />} />
                <Route path="garage" element={<Garage />} />
                <Route path="consents" element={<Consents />} />
              </Route>

              <Route
                path="/dealer/dashboard"
                element={
                  <ProtectedRoute roles={['dealer']}>
                    <DealerLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DealerAnalytics />} />
                <Route path="inventory" element={<DealerInventory />} />
                <Route path="inventory/add" element={<DealerAddCar />} />
                <Route path="inventory/edit/:id" element={<DealerAddCar />} />
                <Route path="inventory/bulk" element={<DealerBulkUpload />} />
                <Route path="bulk-upload" element={<Navigate to="/dealer/dashboard/inventory/bulk" replace />} />
                <Route path="add-car" element={<Navigate to="/dealer/dashboard/inventory/add" replace />} />
                <Route path="edit-car/:id" element={<InventoryEditAlias />} />
                <Route path="leads" element={<DealerLeadCrm />} />
                <Route path="sell-leads" element={<DealerLeads mode="seller" />} />
                <Route path="leads-crm" element={<Navigate to="/dealer/dashboard/leads" replace />} />
                <Route path="finance-leads" element={<DealerLeads mode="finance" />} />
                <Route path="test-drives" element={<DealerTestDrives />} />
                <Route path="bookings" element={<DealerBookings />} />
                <Route path="promotions" element={<DealerPromotions />} />
                <Route path="analytics" element={<DealerPerformance />} />
                <Route path="performance" element={<Navigate to="/dealer/dashboard/analytics" replace />} />
                <Route path="kyc" element={<Navigate to="/dealer/onboarding" replace />} />
                <Route path="settings" element={<DealerSettings />} />
              </Route>

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardIndex />} />
                <Route path="*" element={<DashboardLayout />} />
              </Route>
            </Routes>
          </main>
          <Footer />
          <BottomNav />
          <CompareTray />
        </div>
      </div>
      <Toaster position="top-right" reverseOrder={false} />
    </RealtimeAlertsProvider>
  );
}
