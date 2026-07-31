import { Routes, Route } from 'react-router-dom';
import RequireAdmin from './components/RequireAdmin';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cars from './pages/Cars';
import Approvals from './pages/Approvals';
import Users from './pages/Users';
import Dealers from './pages/Dealers';
import Brands from './pages/Brands';
import Models from './pages/Models';
import Cities from './pages/Cities';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<Dashboard />} />
        <Route path="cars" element={<Cars />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="users" element={<Users />} />
        <Route path="dealers" element={<Dealers />} />
        <Route path="brands" element={<Brands />} />
        <Route path="models" element={<Models />} />
        <Route path="cities" element={<Cities />} />
      </Route>
    </Routes>
  );
}
