import { Routes, Route } from 'react-router-dom';
import RequireAdmin from './components/RequireAdmin';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cars from './pages/Cars';
import Approvals from './pages/Approvals';
import Banners from './pages/Banners';
import Reports from './pages/Reports';
import CarForm from './pages/CarForm';
import Users from './pages/Users';
import Dealers from './pages/Dealers';
import Brands from './pages/Brands';
import Models from './pages/Models';
import Cities from './pages/Cities';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<Dashboard />} />
        <Route path="cars" element={<Cars />} />
        <Route path="cars/add" element={<CarForm />} />
        <Route path="cars/edit/:id" element={<CarForm />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="banners" element={<Banners />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<Users />} />
        <Route path="dealers" element={<Dealers />} />
        <Route path="brands" element={<Brands />} />
        <Route path="models" element={<Models />} />
        <Route path="cities" element={<Cities />} />
      </Route>
    </Routes>
    <Toaster position="top-right" reverseOrder={false} />
    </>
  );
}
