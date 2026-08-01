import { Link } from 'react-router-dom';
import CarsManager from '../components/CarsManager';

export default function Cars() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="font-display font-bold text-2xl">Car Management</h1>
        <Link to="/cars/add" className="bg-ember hover:bg-ember-dark text-white text-sm font-semibold px-4 py-2 rounded-lg">+ Add Car</Link>
      </div>
      <CarsManager />
    </div>
  );
}
