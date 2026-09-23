export const CarCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-soft">
    <div className="h-44 skeleton" />
    <div className="p-4 space-y-2">
      <div className="h-4 w-3/4 skeleton" />
      <div className="h-6 w-1/2 skeleton" />
      <div className="h-3 w-2/3 skeleton" />
    </div>
  </div>
);

export const CarGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-5">
    {Array.from({ length: count }).map((_, i) => <CarCardSkeleton key={i} />)}
  </div>
);
