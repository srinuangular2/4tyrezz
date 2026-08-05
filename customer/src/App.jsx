import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { fetchWishlist } from './app/wishlistSlice';

import Home from './pages/Home';
import Listing from './pages/Listing';
import CarDetails from './pages/CarDetails';
import AddEditCar from './pages/AddEditCar';
import DealerLogin from './pages/DealerLogin';
import { About, Contact, FAQs, Blog,Careers,Terms,Privacy,CorporatePolicies } from './pages/Static';


import DashboardLayout from './pages/dashboard/DashboardLayout';
import MyCars from './pages/dashboard/MyCars';
import Wishlist from './pages/dashboard/Wishlist';
import Profile from './pages/dashboard/Profile';
import Leads from './pages/dashboard/Leads';
import { Toaster } from 'react-hot-toast';


export default function App() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  // Load wishlist once at app start (not just when the Wishlist page is
  // visited) so heart icons everywhere reflect saved state immediately.
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


          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            {/* Dealer-only: listing management */}
            <Route path="inventory" element={<ProtectedRoute roles={['dealer']}><MyCars /></ProtectedRoute>} />
            <Route path="add-car" element={<ProtectedRoute roles={['dealer']}><AddEditCar /></ProtectedRoute>} />
            <Route path="edit-car/:id" element={<ProtectedRoute roles={['dealer']}><AddEditCar /></ProtectedRoute>} />
            <Route path="leads" element={<ProtectedRoute roles={['dealer']}><Leads /></ProtectedRoute>} />
            {/* User-only */}
            <Route path="wishlist" element={<ProtectedRoute roles={['customer']}><Wishlist /></ProtectedRoute>} />
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
