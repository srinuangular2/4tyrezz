import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWishlist } from '../../app/wishlistSlice';
import CarCard from '../../components/CarCard';
import { CarGridSkeleton } from '../../components/Skeletons';

export default function Wishlist() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.wishlist);

  useEffect(() => { dispatch(fetchWishlist()); }, [dispatch]);

  if (status === 'idle' || status === 'loading') return <CarGridSkeleton count={4} />;
  if (items.length === 0) return <p className="text-slate2 text-sm">Nothing saved yet — tap the heart on any car to add it here.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {items.map((c) => <CarCard key={c._id} car={c} />)}
    </div>
  );
}
