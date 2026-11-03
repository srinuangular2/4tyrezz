import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatINR } from '../../components/PageShell';
import { EmptyNote, ProfileCard } from './ProfileLayout';
import { VehicleCard } from './hubUtils';
import { readCart, removeFromCart, subscribeCart } from '../../lib/cart';

export default function Cart() {
  const [rows, setRows] = useState(() => readCart());

  useEffect(() => subscribeCart(setRows), []);

  const total = rows.reduce((sum, row) => sum + (Number(row.price) || 0), 0);

  return (
    <ProfileCard eyebrow="Checkout" title="My Cart">
      {rows.length === 0 && (
        <EmptyNote>
          Your cart is empty.{' '}
          <Link to="/cars" className="text-[#3083ff] font-black">Browse cars</Link>
        </EmptyNote>
      )}
      {rows.length > 0 && (
        <>
          <div className="space-y-3">
            {rows.map((row) => (
              <VehicleCard
                key={row.id}
                image={row.thumb}
                title={row.title || 'Car'}
                price={row.price ? formatINR(row.price) : ''}
                facts={[row.year, row.fuel].filter(Boolean).join(' · ')}
              >
                <Link to={`/cars/${row.id}`} className="text-[12px] font-semibold text-[#3083ff]">View car</Link>
                <button type="button" onClick={() => removeFromCart(row.id)} className="text-[12px] font-semibold text-rose-500">Remove</button>
              </VehicleCard>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-white px-4 py-3 border border-slate-100">
            <p className="text-[13px] font-medium text-slate-600">{rows.length} {rows.length === 1 ? 'car' : 'cars'}</p>
            <p className="text-[14px] font-bold text-[#1853ff]">{formatINR(total)}</p>
          </div>
        </>
      )}
    </ProfileCard>
  );
}
