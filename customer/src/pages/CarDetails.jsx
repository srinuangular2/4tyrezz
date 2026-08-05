import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/axios';
import CarCard from '../components/CarCard';
import ImageLightbox from '../components/ImageLightbox';
import { formatPrice, formatKm } from '../utils/format';
import ScrollStrip from '../components/ScrollStrip';
import ReportAdModal from '../components/ReportAdModal';
import { Heart } from '../components/icons';
import { toggleWishlist } from '../app/wishlistSlice';
import WhatsAppConnectButton from '../components/WhatsAppConnectButton';

export default function CarDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const wishlisted = useSelector((s) => s.wishlist.ids.includes(id));
  const [car, setCar] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [similarModels, setSimilarModels] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const thumbsRef = useRef(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [tab, setTab] = useState('overview');
  const [sent, setSent] = useState(false);

  // EMI Calculator State
  const [tenureYears, setTenureYears] = useState(5);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const interestRate = 9.5; // Annual rate in %

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    const el = thumbsRef.current?.querySelector(`[data-thumb-index="${activeImg}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeImg]);

  useEffect(() => {
    setActiveImg(0);
    setLightboxOpen(false);
    setTab('overview');
    setCar(null);
    api.get(`/cars/${id}`).then((r) => setCar(r.data)).catch(() => setCar('error'));
    api.get(`/cars/${id}/similar`).then((r) => setSimilar(r.data)).catch(() => setSimilar([]));
    api.get(`/cars/${id}/recommended`).then((r) => setRecommended(r.data)).catch(() => setRecommended([]));
    api.get(`/cars/${id}/similar-models`).then((r) => setSimilarModels(r.data)).catch(() => setSimilarModels([]));
  }, [id]);

  const submitContact = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    await api.post('/leads', {
      carId: id,
      name: form.get('name'),
      phone: form.get('phone'),
      message: form.get('message'),
    });
    setSent(true);
  };

  const handleWishlist = () => {
    if (!user) return;
    dispatch(toggleWishlist(id));
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: car?.title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard');
    }
  };

  const handleScrollThumbs = (direction) => {
    if (!thumbsRef.current) return;
    const scrollAmount = 240;
    thumbsRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!car) return <div className="container-px py-16 max-w-7xl mx-auto"><CarSkeleton /></div>;
  if (car === 'error') return <div className="container-px py-16 text-center text-slate-500">This listing couldn't be loaded. It may have been removed.</div>;

  const nextImg = () => setActiveImg((i) => (i + 1) % car.images.length);
  const prevImg = () => setActiveImg((i) => (i - 1 + car.images.length) % car.images.length);

  // EMI Math Calculation
  const price = car.price || 0;
  const downPayment = Math.round((price * downPaymentPct) / 100);
  const loanAmount = Math.max(0, price - downPayment);
  const monthlyRate = interestRate / 12 / 100;
  const totalMonths = tenureYears * 12;
  const calculatedEmi = loanAmount > 0 
    ? Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1))
    : 0;

  return (
    <div className="container-px py-8 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <p className="text-sm text-slate-500 mb-4">
        <Link to="/cars" className="hover:text-ember transition">Used cars</Link>
        {car.city?.name && <> / <Link to={`/cars?city=${car.city._id}`} className="hover:text-ember transition">Used cars in {car.city.name}</Link></>}
        {car.brand?.name && <> / <Link to={`/cars?brand=${car.brand._id}`} className="hover:text-ember transition">Used {car.brand.name} cars</Link></>}
        {' '}/ <span className="text-slate-800 font-medium">{car.title}</span>
      </p>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
        {/* Left Column */}
        <div>
          {/* Main Image Container */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-[420px] bg-slate-900 flex items-center justify-center group shadow-sm">
            {car.images?.length ? (
              <>
                <img
                  src={car.images[activeImg]}
                  alt={car.title}
                  onClick={() => setLightboxOpen(true)}
                  className="w-full h-full object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.01]"
                />

                {car.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImg}
                      aria-label="Previous photo"
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center text-xl font-bold opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      ‹
                    </button>
                    <button
                      onClick={nextImg}
                      aria-label="Next photo"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center text-xl font-bold opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      ›
                    </button>
                    <span className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white text-xs font-medium px-3 py-1 rounded-full shadow">
                      {activeImg + 1} / {car.images.length}
                    </span>
                  </>
                )}

                <button
                  onClick={() => setLightboxOpen(true)}
                  className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md hover:bg-black/80 text-white text-xs font-medium px-3.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1.5 shadow"
                >
                  🔍 View full size
                </button>
              </>
            ) : (
              <span className="text-slate-400 text-sm">No photos available</span>
            )}
          </div>

          {/* Thumbnail Slider */}
          {car.images?.length > 0 && (
            <div className="flex items-center justify-center relative mt-4">
              {car.images.length > 6 && (
                <button
                  onClick={() => handleScrollThumbs('left')}
                  aria-label="Scroll thumbnails left"
                  className="mr-2 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 transition shrink-0 z-10"
                >
                  ‹
                </button>
              )}

              <div
                ref={thumbsRef}
                className="flex gap-2 overflow-x-auto scroll-smooth snap-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-[calc(6*4.5rem+5*0.5rem)] py-1 px-0.5"
              >
                {car.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    onClick={() => setActiveImg(i)}
                    data-thumb-index={i}
                    alt={`Thumbnail ${i + 1}`}
                    className={`w-[4.5rem] h-16 shrink-0 snap-start object-cover rounded-xl cursor-pointer border-2 transition-all duration-150 ${
                      i === activeImg
                        ? 'border-ember shadow-md ring-2 ring-ember/20 scale-100'
                        : 'border-transparent opacity-65 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>

              {car.images.length > 6 && (
                <button
                  onClick={() => handleScrollThumbs('right')}
                  aria-label="Scroll thumbnails right"
                  className="ml-2 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 transition shrink-0 z-10"
                >
                  ›
                </button>
              )}
            </div>
          )}

          {lightboxOpen && car.images?.length > 0 && (
            <ImageLightbox images={car.images} startIndex={activeImg} onClose={() => setLightboxOpen(false)} />
          )}

          {/* Navigation Tabs Header */}
          <div className="flex gap-8 border-b border-slate-200 mt-8">
            {[
              ['overview', 'Overview'],
              ['specs', 'Specs & Features'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`pb-3 text-base font-semibold border-b-2 -mb-px transition cursor-pointer ${
                  tab === key
                    ? 'border-ember text-ember'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === 'overview' ? (
            <>
              {/* Car Overview */}
              <section className="mt-6">
                <h3 className="font-display font-semibold text-lg text-slate-900 mb-4">Car Overview</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <OverviewCard
                    icon={<CalendarIcon className="w-5 h-5 text-ember" />}
                    label="Registration Year"
                    value={car.registrationYear || car.year}
                  />
                  <OverviewCard
                    icon={<ShieldIcon className="w-5 h-5 text-ember" />}
                    label="Insurance"
                    value={car.insuranceType || 'Third Party'}
                  />
                  <OverviewCard
                    icon={<FuelIcon className="w-5 h-5 text-ember" />}
                    label="Fuel Type"
                    value={car.fuel}
                  />
                  <OverviewCard
                    icon={<UserGroupIcon className="w-5 h-5 text-ember" />}
                    label="Seats"
                    value={car.seats ? `${car.seats} Seats` : '5 Seats'}
                  />
                  <OverviewCard
                    icon={<OdometerIcon className="w-5 h-5 text-ember" />}
                    label="Kms Driven"
                    value={formatKm(car.kmDriven)}
                  />
                  <OverviewCard
                    icon={<LocationIcon className="w-5 h-5 text-ember" />}
                    label="RTO"
                    value={car.rto || car.city?.name}
                  />
                  <OverviewCard
                    icon={<OwnerIcon className="w-5 h-5 text-ember" />}
                    label="Ownership"
                    value={
                      car.ownership
                        ? `${car.ownership}${car.ownership === 1 ? 'st' : car.ownership === 2 ? 'nd' : 'rd'} Owner`
                        : '1st Owner'
                    }
                  />
                  <OverviewCard
                    icon={<EngineIcon className="w-5 h-5 text-ember" />}
                    label="Engine Displacement"
                    value={car.engineDisplacement ? `${car.engineDisplacement} cc` : '—'}
                  />
                  <OverviewCard
                    icon={<GearIcon className="w-5 h-5 text-ember" />}
                    label="Transmission"
                    value={car.transmission}
                  />
                  <OverviewCard
                    icon={<FactoryIcon className="w-5 h-5 text-ember" />}
                    label="Year of Manufacture"
                    value={car.year}
                  />
                </div>
              </section>

              {/* Key Features */}
              {car.features?.length > 0 && (
                <section className="mt-8">
                  <h3 className="font-display font-semibold text-lg text-slate-900 mb-3">Key Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {car.features.map((f) => (
                      <span
                        key={f}
                        className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1.5"
                      >
                        <CheckBadgeIcon className="w-4 h-4 text-emerald-600" />
                        {f}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Description */}
              <section className="mt-8">
                <h3 className="font-display font-semibold text-lg text-slate-900 mb-2">Description</h3>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                  {car.description || 'No description provided for this listing.'}
                </p>
              </section>
            </>
          ) : (
            <>
              {/* Detailed Specs Tab */}
              <section className="mt-6">
                <h3 className="font-display font-semibold text-lg text-slate-900 mb-3">Specifications</h3>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="divide-y divide-slate-100">
                    {[
                      ['Brand', car.brand?.name, <CarIcon className="w-4 h-4 text-slate-400" />],
                      ['Model', car.model?.name, <CarIcon className="w-4 h-4 text-slate-400" />],
                      ['Variant', car.variant, <TagIcon className="w-4 h-4 text-slate-400" />],
                      ['Year', car.year, <CalendarIcon className="w-4 h-4 text-slate-400" />],
                      ['Fuel Type', car.fuel, <FuelIcon className="w-4 h-4 text-slate-400" />],
                      ['KM Driven', formatKm(car.kmDriven), <OdometerIcon className="w-4 h-4 text-slate-400" />],
                      ['Transmission', car.transmission, <GearIcon className="w-4 h-4 text-slate-400" />],
                      ['Body Type', car.bodyType, <CarIcon className="w-4 h-4 text-slate-400" />],
                      [
                        'Ownership',
                        car.ownership ? `${car.ownership}${car.ownership === 1 ? 'st' : car.ownership === 2 ? 'nd' : 'rd'} Owner` : '—',
                        <OwnerIcon className="w-4 h-4 text-slate-400" />
                      ],
                      ['Color', car.color, <PaintIcon className="w-4 h-4 text-slate-400" />],
                      ['Location', car.city?.name, <LocationIcon className="w-4 h-4 text-slate-400" />],
                    ].map(([k, v, icon]) => (
                      <div key={k} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/60 transition">
                        <span className="flex items-center gap-2.5 text-sm text-slate-500">
                          {icon}
                          {k}
                        </span>
                        <span className="font-semibold text-sm text-slate-800">{v || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Features Grid */}
              {car.features?.length > 0 && (
                <section className="mt-8">
                  <h3 className="font-display font-semibold text-lg text-slate-900 mb-3">Features & Comfort</h3>
                  <div className="grid sm:grid-cols-2 gap-3 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    {car.features.map((f) => (
                      <span key={f} className="text-sm text-slate-700 flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <span className="text-emerald-700 text-xs font-bold">✓</span>
                        </div>
                        {f}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Seller Details */}
          <section className="mt-8">
            <h3 className="font-display font-semibold text-lg text-slate-900 mb-3">Seller Details</h3>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-sm shadow-sm flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 text-base">
                  {car.owner?.dealershipName || car.owner?.name || 'Private Seller'}
                </p>
                <p className="text-slate-500 mt-0.5">
                  {car.sellerType === 'dealer' ? 'Verified Dealer' : 'Individual Owner'} · {car.city?.name || 'N/A'}
                </p>
              </div>
              <span className="bg-slate-100 text-slate-700 font-medium text-xs px-3 py-1.5 rounded-full">
                Verified Listing
              </span>
            </div>
          </section>

          {/* Redesigned Professional EMI Calculator */}
          <section className="mt-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <CalculatorIcon className="w-5 h-5 text-ember" />
                  <h3 className="font-display font-semibold text-lg text-slate-900">EMI Calculator</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Customise loan tenure and down payment to fit your budget</p>
              </div>
              <span className="bg-amber-50 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-lg border border-amber-200">
                @ {interestRate}% Interest
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="space-y-5">
                {/* Down Payment Slider */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-slate-600">Down Payment ({downPaymentPct}%)</span>
                    <span className="text-slate-900 font-bold">{formatPrice(downPayment)}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="5"
                    value={downPaymentPct}
                    onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                    className="w-full accent-ember cursor-pointer h-2 bg-slate-100 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>10%</span>
                    <span>60%</span>
                  </div>
                </div>

                {/* Tenure Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Loan Tenure</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5, 7].map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setTenureYears(yr)}
                        className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                          tenureYears === yr
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {yr} {yr === 1 ? 'Yr' : 'Yrs'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* EMI Highlight Card */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col justify-between h-full">
                <div>
                  <span className="text-xs text-slate-500 font-medium">Estimated Monthly Installment</span>
                  <p className="font-display font-extrabold text-3xl text-slate-900 mt-1">
                    {formatPrice(calculatedEmi)} <span className="text-sm font-normal text-slate-500">/ mo</span>
                  </p>
                  <div className="mt-3 text-xs text-slate-500 space-y-1 border-t border-slate-200/60 pt-3">
                    <div className="flex justify-between">
                      <span>Loan Amount:</span>
                      <span className="font-semibold text-slate-700">{formatPrice(loanAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-semibold text-slate-700">{tenureYears * 12} Months</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowContact(true)}
                  className="w-full mt-4 bg-slate-900 hover:bg-black text-white text-xs font-semibold py-2.5 rounded-lg transition"
                >
                  Apply for Loan
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Pricing & Contact Action Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:sticky lg:top-24">
          <div className="flex justify-between items-start gap-3">
            <h1 className="font-semibold text-xl text-slate-900 leading-snug">{car.title}</h1>
            <button
              onClick={handleWishlist}
              aria-label="Save to wishlist"
              className="flex-shrink-0 p-2 rounded-full hover:bg-slate-50 transition"
            >
              <Heart filled={wishlisted} className={wishlisted ? 'text-ember w-6 h-6' : 'text-slate-300 hover:text-slate-400 w-6 h-6'} />
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-1.5 font-medium">
            {car.transmission} · {car.fuel} · {car.ownership === 1 ? '1st' : car.ownership === 2 ? '2nd' : '3rd'} Owner · {formatKm(car.kmDriven)}
          </p>

          <p className="font-display font-bold text-ember text-3xl mt-4">{formatPrice(car.price)}</p>

          <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-md mt-2.5 capitalize border border-emerald-100">
            {car.status}
          </span>

          {car.inspectionScore && (
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3.5 mt-4 border border-slate-100">
              <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-display font-bold text-sm shrink-0">
                {car.inspectionScore}
              </div>
              <div>
                <p className="text-emerald-700 text-xs font-bold">Verified — {car.inspectionScore}/100 inspection score</p>
                <p className="text-xs text-slate-500 mt-0.5">15-point check by inspection experts</p>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowContact(true)}
            className="w-full bg-ember hover:bg-ember-dark text-white font-semibold py-3.5 rounded-xl mt-6 shadow-sm transition"
          >
            Contact seller
          </button>

          <WhatsAppConnectButton car={car} />
          {/* <button className="w-full border-2 border-slate-800 text-slate-800 font-semibold py-3 rounded-xl mt-3 hover:bg-slate-800 hover:text-white transition">
            Book a physical inspection
          </button> */}

          <div className="flex justify-between mt-6 pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
            <button onClick={() => setShowReport(true)} className="hover:text-ember transition flex items-center gap-1">
              🚩 Report ad
            </button>
            <button onClick={handleShare} className="hover:text-ember transition flex items-center gap-1">
              ↗ Share
            </button>
          </div>
        </div>
      </div>

      {/* Recommendations & Similar Listings */}
      {similar.length > 0 && (
        <ScrollStrip title="Similar cars">
          {similar.map((c) => (
            <div key={c._id} className="w-[260px] flex-shrink-0 snap-start">
              <CarCard car={c} />
            </div>
          ))}
        </ScrollStrip>
      )}

      {recommended.length > 0 && (
        <ScrollStrip title="Recommended cars">
          {recommended.map((c) => (
            <div key={c._id} className="w-[260px] flex-shrink-0 snap-start">
              <CarCard car={c} />
            </div>
          ))}
        </ScrollStrip>
      )}

      {similarModels.length > 0 && (
        <ScrollStrip title="Similar car models">
          {similarModels.map(({ model, startingPrice, count }) => (
            <Link
              key={model._id}
              to={`/cars?model=${model._id}`}
              className="w-[220px] flex-shrink-0 snap-start bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="h-28 bg-slate-100 rounded-lg mb-3 flex items-center justify-center text-slate-400 text-xs">
                {model.name}
              </div>
              <p className="font-semibold text-sm text-slate-800">{model.name}</p>
              <p className="text-ember font-display font-semibold text-sm mt-1">
                Starting @ {formatPrice(startingPrice)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {count} available {count === 1 ? 'car' : 'cars'}
              </p>
            </Link>
          ))}
        </ScrollStrip>
      )}

      {/* Contact Seller Modal */}
      {showContact && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowContact(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {sent ? (
              <>
                <h3 className="font-display font-semibold text-xl text-slate-900">Message sent!</h3>
                <p className="text-sm text-slate-500 mt-2">The seller will reach out to you shortly.</p>
                <button
                  onClick={() => setShowContact(false)}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 rounded-xl mt-5"
                >
                  Close
                </button>
              </>
            ) : (
              <form onSubmit={submitContact} className="space-y-3.5">
                <h3 className="font-display font-semibold text-xl text-slate-900 mb-1">Contact seller</h3>
                <input
                  name="name"
                  required
                  placeholder="Your name"
                  defaultValue={user?.name}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ember/20 focus:border-ember"
                />
                <input
                  name="phone"
                  required
                  placeholder="Your phone"
                  defaultValue={user?.mobile}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ember/20 focus:border-ember"
                />
                <textarea
                  name="message"
                  rows="3"
                  placeholder="I'm interested in this car..."
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ember/20 focus:border-ember"
                />
                <button className="w-full bg-ember hover:bg-ember-dark text-white font-semibold py-2.5 rounded-xl transition shadow-sm">
                  Send message
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {showReport && <ReportAdModal carId={id} onClose={() => setShowReport(false)} />}
    </div>
  );
}

// Subcomponent: Overview Card with SVG Icon
function OverviewCard({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3.5 bg-slate-50/70 rounded-xl p-3.5 border border-slate-100 hover:border-slate-200 transition">
      <div className="w-10 h-10 rounded-lg bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400 truncate">{label}</p>
        <p className="text-sm font-semibold text-slate-800 truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

function CarSkeleton() {
  return (
    <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8">
      <div className="h-[420px] skeleton rounded-2xl" />
      <div className="h-64 skeleton rounded-2xl" />
    </div>
  );
}

// Inline SVG Icon Components
function CalendarIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ShieldIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function FuelIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function UserGroupIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function OdometerIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function LocationIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function OwnerIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function GearIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EngineIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function FactoryIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4" />
    </svg>
  );
}

function CarIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4zM3 9l2-4h10l2 4M3 9h18v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    </svg>
  );
}

function TagIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a1 1 0 01.707.293l7 7a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-7-7A1 1 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function PaintIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  );
}

function CheckBadgeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  );
}

function CalculatorIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m-6 4h6m-6 4h6M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}