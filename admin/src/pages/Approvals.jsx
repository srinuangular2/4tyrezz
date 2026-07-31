import CarsManager from '../components/CarsManager';

export default function Approvals() {
  return (
    <div className="space-y-4">
      <h1 className="font-display font-black text-2xl">Listing Approvals</h1>
      <p className="text-slate2 text-sm">New and edited listings land here first — approve before they go live on the customer site.</p>
      <CarsManager defaultStatus="pending" />
    </div>
  );
}
