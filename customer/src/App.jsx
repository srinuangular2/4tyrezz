import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';

import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { fetchWishlist } from './app/wishlistSlice';

import Home from './pages/Home';
import Listing from './pages/Listing';
import CarDetails from './pages/CarDetails';
import AddEditCar from './pages/AddEditCar';
import DealerLogin from './pages/DealerLogin';
import { About, Contact, FAQs, Blog, Careers, Terms, Privacy, CorporatePolicies } from './pages/Static';

import DashboardLayout from './pages/dashboard/DashboardLayout';
import MyCars from './pages/dashboard/MyCars';
import Wishlist from './pages/dashboard/Wishlist';
import Profile from './pages/dashboard/Profile';
import Leads from './pages/dashboard/Leads';

/**
 * Global helper to trigger a live toast notification during client demos
 * usage anywhere in code or console: window.notifyNewCarAdded({ title: 'Hyundai Creta', year: 2023, price: 14.5, image: '...' })
 */
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

// Make it accessible globally for quick console/demo triggers
if (typeof window !== 'undefined') {
  window.notifyNewCarAdded = notifyNewCarAdded;
}

export default function App() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  // Load wishlist once at app start so heart icons reflect saved state immediately
  useEffect(() => {
    if (user) dispatch(fetchWishlist());
  }, [user, dispatch]);

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cars" element={<Listing />} />
            <Route path="/cars/:id" element={<CarDetails />} />
            <Route path="/dealer/login" element={<DealerLogin />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/corporate-policies" element={<CorporatePolicies />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Dealer-only: listing management */}
              <Route
                path="inventory"
                element={
                  <ProtectedRoute roles={['dealer']}>
                    <MyCars />
                  </ProtectedRoute>
                }
              />
              <Route
                path="add-car"
                element={
                  <ProtectedRoute roles={['dealer']}>
                    <AddEditCar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="edit-car/:id"
                element={
                  <ProtectedRoute roles={['dealer']}>
                    <AddEditCar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="leads"
                element={
                  <ProtectedRoute roles={['dealer']}>
                    <Leads />
                  </ProtectedRoute>
                }
              />
              {/* User-only */}
              <Route
                path="wishlist"
                element={
                  <ProtectedRoute roles={['customer']}>
                    <Wishlist />
                  </ProtectedRoute>
                }
              />
              {/* Shared */}
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </main>
        <Footer />
      </div>
      <Toaster position="top-right" reverseOrder={false} />
    </>
  );
}