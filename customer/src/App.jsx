import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Listing from './pages/Listing';
import CarDetails from './pages/CarDetails';
import AddEditCar from './pages/AddEditCar';
import DealerLogin from './pages/DealerLogin';
import { About, Contact, FAQs, Blog } from './pages/Static';

import DashboardLayout from './pages/dashboard/DashboardLayout';
import MyCars from './pages/dashboard/MyCars';
import Wishlist from './pages/dashboard/Wishlist';
import Profile from './pages/dashboard/Profile';
import Leads from './pages/dashboard/Leads';
import { Toaster } from 'react-hot-toast';

export default function App() {
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

          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="my-cars" element={<MyCars />} />
            <Route path="inventory" element={<MyCars />} />
            <Route path="add-car" element={<AddEditCar />} />
            <Route path="edit-car/:id" element={<AddEditCar />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="leads" element={<Leads />} />
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
