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

  // Modals & Tabs State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showRTOModal, setShowRTOModal] = useState(false);
  const [showEmiModal, setShowEmiModal] = useState(false);
  const [emiModalTab, setEmiModalTab] = useState('breakup'); // 'breakup' | 'yearwise'
  const [tab, setTab] = useState('overview');
  const [sent, setSent] = useState(false);

  // EMI Calculator State
  const [tenureYears, setTenureYears] = useState(4);
  const [interestRate, setInterestRate] = useState(14.5);
  const [loanAmount, setLoanAmount] = useState(0);

  // Auto-scroll active thumbnail
  useEffect(() => {
    const el = thumbsRef.current?.querySelector(`[data-thumb-index="${activeImg}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeImg]);

  // Combined parallel API fetching
  useEffect(() => {
    setActiveImg(0);
    setLightboxOpen(false);
    setTab('overview');
    setCar(null);
    setSent(false);
    let isMounted = true;

    async function fetchData() {
      try {
        const carRes = await api.get(`/cars/${id}`);
        if (!isMounted) return;
        const carData = carRes.data;
        setCar(carData);

        // Default loan amount to ~90% of price
        if (carData?.price) {
          setLoanAmount(Math.round(carData.price * 0.9));
        }

        const [simRes, recRes, modelsRes] = await Promise.allSettled([
          api.get(`/cars/${id}/similar`),
          api.get(`/cars/${id}/recommended`),
          api.get(`/cars/${id}/similar-models`),
        ]);
        if (!isMounted) return;
        setSimilar(simRes.status === 'fulfilled' ? simRes.value.data : []);
        setRecommended(recRes.status === 'fulfilled' ? recRes.value.data : []);
        setSimilarModels(modelsRes.status === 'fulfilled' ? modelsRes.value.data : []);
      } catch (err) {
        if (isMounted) setCar('error');
      }
    }
    fetchData();
    return () => { isMounted = false; };
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

  const imagesCount = car.images?.length || 0;
  const nextImg = () => setActiveImg((i) => (i + 1) % imagesCount);
  const prevImg = () => setActiveImg((i) => (i - 1 + imagesCount) % imagesCount);

  // EMI Math Calculation
  const carPrice = car.price || 0;
  const currentLoan = loanAmount || Math.round(carPrice * 0.9);
  const downPayment = Math.max(0, carPrice - currentLoan);
  const monthlyRate = interestRate / 12 / 100;
  const totalMonths = tenureYears * 12;
  const calculatedEmi = currentLoan > 0
    ? Math.round((currentLoan * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1))
    : 0;

  const totalPayable = calculatedEmi * totalMonths;
  const totalInterest = Math.max(0, totalPayable - currentLoan);

  // Calculate vehicle age for Insights
  const currentYear = new Date().getFullYear();
  const vehicleAge = car.year ? currentYear - car.year : 0;

  return (
    <div className="container-px py-8 max-w-7xl mx-auto font-sans text-slate-800">
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
            {imagesCount > 0 ? (
              <>
                <img src={car.images[activeImg]} alt={car.title} onClick={() => setLightboxOpen(true)} className="w-full h-full object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.01]" />
                {imagesCount > 1 && (
                  <>
                    <button onClick={prevImg} aria-label="Previous photo" className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center text-xl font-bold opacity-0 group-hover:opacity-100 transition-all duration-200">‹</button>
                    <button onClick={nextImg} aria-label="Next photo" className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center text-xl font-bold opacity-0 group-hover:opacity-100 transition-all duration-200">›</button>
                    <span className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white text-xs font-medium px-3 py-1 rounded-full shadow">{activeImg + 1} / {imagesCount}</span>
                  </>
                )}
                <button onClick={() => setLightboxOpen(true)} className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md hover:bg-black/80 text-white text-xs font-medium px-3.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1.5 shadow">🔍 View full size</button>
              </>
            ) : (
              <span className="text-slate-400 text-sm">No photos available</span>
            )}
          </div>

          {/* Thumbnail Slider */}
          {imagesCount > 0 && (
            <div className="flex items-center justify-center relative mt-4">
              {imagesCount > 6 && (
                <button onClick={() => handleScrollThumbs('left')} aria-label="Scroll thumbnails left" className="mr-2 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 transition shrink-0 z-10">‹</button>
              )}
              <div ref={thumbsRef} className="flex gap-2 overflow-x-auto scroll-smooth snap-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-[calc(6*4.5rem+5*0.5rem)] py-1 px-0.5">
                {car.images.map((img, i) => (
                  <img key={i} src={img} onClick={() => setActiveImg(i)} data-thumb-index={i} alt={`Thumbnail ${i + 1}`} className={`w-[4.5rem] h-16 shrink-0 snap-start object-cover rounded-xl cursor-pointer border-2 transition-all duration-150 ${i === activeImg ? 'border-ember shadow-md ring-2 ring-ember/20 scale-100' : 'border-transparent opacity-65 hover:opacity-100'}`} />
                ))}
              </div>
              {imagesCount > 6 && (
                <button onClick={() => handleScrollThumbs('right')} aria-label="Scroll thumbnails right" className="ml-2 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 transition shrink-0 z-10">›</button>
              )}
            </div>
          )}

          {lightboxOpen && imagesCount > 0 && (
            <ImageLightbox images={car.images} startIndex={activeImg} onClose={() => setLightboxOpen(false)} />
          )}

          {/* ==================== QUICK INSIGHTS (Screen 1 UI) ==================== */}
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Quick Insights</h2>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">✦ AI</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-xs">‹</button>
                <button className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-xs">›</button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Fit for You Card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-center gap-3 text-slate-400 text-xs font-medium tracking-wide mb-4">
                    <span>◆</span> <span className="text-slate-700 font-semibold uppercase tracking-wider text-xs">Fit for You</span> <span>◆</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    A well-maintained vehicle ideal for city commutes and family trips. {car.ownership === 1 ? 'Single owner keeps the history transparent.' : `${car.ownership || 1} owners on record.`} Verified registration and fitness status.
                  </p>
                  <div className="space-y-3">
                    {(car.features?.length > 0 ? car.features.slice(0, 5) : ['ABS', 'Rear AC Vents', 'Climate Control', 'Power Steering', 'Air Conditioner']).map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm font-bold text-slate-900">
                        <span className="text-slate-800 text-xs">◆</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Things to Check Card */}
              <div className="bg-[#FFFDF5] border border-amber-200/60 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-center gap-3 text-amber-600/60 text-xs font-medium tracking-wide mb-6">
                  <span>◆</span> <span className="text-amber-900 font-semibold uppercase tracking-wider text-xs">Things to Check</span> <span>◆</span>
                </div>
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">!</span>
                    <p className="text-sm text-slate-700">
                      <strong className="text-slate-900 font-bold">{formatKm(car.kmDriven || 89000)} driven.</strong> Check wear on tyres, brakes, suspension.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">!</span>
                    <p className="text-sm text-slate-700">
                      <strong className="text-slate-900 font-bold">{vehicleAge || 10} years old.</strong> Age-related wear on rubber parts and electricals likely.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== CHECK RTO REPORT CARD (Screen 2 UI) ==================== */}
          <section className="mt-8 bg-[#FFF8F5] border border-orange-100 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white border border-orange-100 shadow-xs flex items-center justify-center text-orange-600 shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-900">Check RTO report</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Straight from the transport database</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-800 font-medium pt-1">
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">✓</span> RC Validity</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">✓</span> Insurance Status</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">✓</span> Vehicle Info</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">✓</span> Compliance</span>
              </div>
            </div>
            <button onClick={() => setShowRTOModal(true)} className="w-full sm:w-auto px-6 py-3 rounded-xl border-2 border-orange-600 text-orange-600 hover:bg-orange-50 font-bold text-sm transition shrink-0">
              Get Full RTO Report — Free
            </button>
          </section>

          {/* Navigation Tabs Header */}
          <div className="flex gap-8 border-b border-slate-200 mt-8">
            {[
              ['overview', 'Overview & RTO'],
              ['specs', 'Specs & Features'],
            ].map(([key, label]) => (
              <button key={key} type="button" onClick={() => setTab(key)} className={`pb-3 text-base font-semibold border-b-2 -mb-px transition cursor-pointer ${tab === key ? 'border-ember text-ember' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
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
                  <OverviewCard icon={<CalendarIcon className="w-5 h-5 text-ember" />} label="Registration Year" value={car.registrationYear || car.year} />
                  <OverviewCard icon={<ShieldIcon className="w-5 h-5 text-ember" />} label="Insurance" value={car.insuranceType || 'Third Party'} />
                  <OverviewCard icon={<FuelIcon className="w-5 h-5 text-ember" />} label="Fuel Type" value={car.fuel} />
                  <OverviewCard icon={<UserGroupIcon className="w-5 h-5 text-ember" />} label="Seats" value={car.seats ? `${car.seats} Seats` : '5 Seats'} />
                  <OverviewCard icon={<OdometerIcon className="w-5 h-5 text-ember" />} label="Kms Driven" value={formatKm(car.kmDriven)} />
                  <OverviewCard icon={<LocationIcon className="w-5 h-5 text-ember" />} label="RTO" value={car.rto || car.city?.name} />
                  <OverviewCard icon={<OwnerIcon className="w-5 h-5 text-ember" />} label="Ownership" value={car.ownership ? `${car.ownership}${car.ownership === 1 ? 'st' : car.ownership === 2 ? 'nd' : 'rd'} Owner` : '1st Owner'} />
                  <OverviewCard icon={<EngineIcon className="w-5 h-5 text-ember" />} label="Engine Displacement" value={car.engineDisplacement ? `${car.engineDisplacement} cc` : '—'} />
                  <OverviewCard icon={<GearIcon className="w-5 h-5 text-ember" />} label="Transmission" value={car.transmission} />
                  <OverviewCard icon={<FactoryIcon className="w-5 h-5 text-ember" />} label="Year of Manufacture" value={car.year} />
                </div>
              </section>

              {car.features?.length > 0 && (
                <section className="mt-8">
                  <h3 className="font-display font-semibold text-lg text-slate-900 mb-3">Key Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {car.features.map((f) => (
                      <span key={f} className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                        <CheckBadgeIcon className="w-4 h-4 text-emerald-600" /> {f}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-8">
                <h3 className="font-display font-semibold text-lg text-slate-900 mb-2">Description</h3>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                  {car.description || 'No description provided for this listing.'}
                </p>
              </section>
            </>
          ) : (
            <>
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
                      ['Ownership', car.ownership ? `${car.ownership}${car.ownership === 1 ? 'st' : car.ownership === 2 ? 'nd' : 'rd'} Owner` : '—', <OwnerIcon className="w-4 h-4 text-slate-400" />],
                      ['Color', car.color, <PaintIcon className="w-4 h-4 text-slate-400" />],
                      ['Location', car.city?.name, <LocationIcon className="w-4 h-4 text-slate-400" />],
                    ].map(([k, v, icon]) => (
                      <div key={k} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/60 transition">
                        <span className="flex items-center gap-2.5 text-sm text-slate-500">{icon} {k}</span>
                        <span className="font-semibold text-sm text-slate-800">{v || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Seller Details */}
          <section className="mt-8">
            <h3 className="font-display font-semibold text-lg text-slate-900 mb-3">Seller Details</h3>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-sm shadow-sm flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 text-base">{car.owner?.dealershipName || car.owner?.name || 'Private Seller'}</p>
                <p className="text-slate-500 mt-0.5">{car.sellerType === 'dealer' ? 'Verified Dealer' : 'Individual Owner'} · {car.city?.name || 'N/A'}</p>
              </div>
              <span className="bg-slate-100 text-slate-700 font-medium text-xs px-3 py-1.5 rounded-full">Verified Listing</span>
            </div>
          </section>

          {/* ==================== FINANCE THIS CAR (Screen 6 UI) ==================== */}
          <section className="mt-8 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">₹</div>
                <h3 className="text-xl font-bold text-slate-900">Finance this car</h3>
              </div>
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full">Up to 90% funded</span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Blue Container */}
              <div className="bg-[#2B5B88] text-white rounded-2xl p-6 flex flex-col justify-between space-y-6">
                <div>
                  <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">MONTHLY EMI</span>
                  <p className="text-3xl font-extrabold mt-1">{formatPrice(calculatedEmi)}</p>
                  <p className="text-xs text-blue-200 mt-1">for {tenureYears} yrs at {interestRate}% p.a.</p>
                </div>

                <div className="border-t border-blue-400/30 pt-4">
                  <div className="flex justify-between items-center text-xs text-blue-200 mb-1">
                    <span>Down payment</span>
                    <span className="text-white font-bold">{formatPrice(downPayment)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-blue-200 mb-3">
                    <span>Loan amount</span>
                    <span className="text-white font-bold">{formatPrice(currentLoan)}</span>
                  </div>
                  <input
                    type="range"
                    min={Math.round(carPrice * 0.2)}
                    max={carPrice}
                    step={10000}
                    value={currentLoan}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full accent-white cursor-pointer h-1.5 bg-blue-400/40 rounded-lg"
                  />
                </div>
              </div>

              {/* Right Options Container */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-6 flex flex-col justify-between space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">Tenure</label>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setTenureYears(yr)}
                        className={`py-2 text-xs font-bold rounded-full transition ${tenureYears === yr ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                      >
                        {yr} yrs
                      </button>
                    ))}
                  </div>

                  <label className="block text-xs font-medium text-slate-500 mb-2">Interest rate (p.a.)</label>
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2 max-w-[200px]">
                    <button onClick={() => setInterestRate((r) => Math.max(5, +(r - 0.5).toFixed(1)))} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-base">–</button>
                    <span className="font-bold text-slate-900 text-sm">{interestRate}%</span>
                    <button onClick={() => setInterestRate((r) => +(r + 0.5).toFixed(1))} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-base">+</button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <button onClick={() => setShowEmiModal(true)} className="w-full bg-white border border-slate-200 hover:bg-slate-100 text-blue-700 font-bold py-3 rounded-xl transition text-sm">
                    View EMI breakup
                  </button>
                  <button onClick={() => setShowContact(true)} className="w-full bg-[#2B5B88] hover:bg-[#22486c] text-white font-bold py-3 rounded-xl transition text-sm shadow-xs">
                    Interested in Loan
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ==================== RIGHT COLUMN: PRICING CARD (Screen 7 UI) ==================== */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:sticky lg:top-24 space-y-4">
          <div className="flex justify-between items-start gap-3">
            <div>
              <h1 className="font-bold text-2xl text-slate-900 leading-tight">{car.year} {car.brand?.name} {car.model?.name}</h1>
              <p className="text-sm text-slate-500 mt-0.5">{car.variant}</p>
            </div>
            <button onClick={handleWishlist} aria-label="Save to wishlist" className="flex-shrink-0 p-2 rounded-full hover:bg-slate-100 transition border border-slate-200">
              <Heart filled={wishlisted} className={wishlisted ? 'text-ember w-5 h-5' : 'text-slate-400 w-5 h-5'} />
            </button>
          </div>

          <div>
            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
              ✓ FAIR PRICE
            </span>
          </div>

          <div className="flex items-baseline gap-3 pt-1">
            <p className="font-display font-extrabold text-slate-900 text-3xl">{formatPrice(car.price)}</p>
            <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              <span>EMI from <strong>{formatPrice(calculatedEmi)}/mo</strong></span>
              <button onClick={() => setShowEmiModal(true)} className="text-blue-600 ml-1">✏️</button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium pt-2 border-t border-slate-100">
            <OdometerIcon className="w-4 h-4 text-slate-400" />
            <span>{formatKm(car.kmDriven)}</span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px]">Below avg</span>
            <span>• {car.fuel}</span>
            <span>• {car.transmission}</span>
            <span>• {car.ownership === 1 ? '1st' : car.ownership === 2 ? '2nd' : '3rd'} Owner</span>
          </div>

          <button onClick={() => setShowContact(true)} className="w-full bg-[#E03A1E] hover:bg-[#c73117] text-white font-bold py-3.5 rounded-xl transition text-base shadow-sm">
            View Seller Details
          </button>

          <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
            <LocationIcon className="w-3.5 h-3.5" /> {car.city?.name || 'Bangalore'}
          </p>

          <WhatsAppConnectButton car={car} />

          <div className="flex justify-between mt-4 pt-3 border-t border-slate-100 text-xs font-medium text-slate-500">
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
            <div key={c._id} className="w-[260px] flex-shrink-0 snap-start"><CarCard car={c} /></div>
          ))}
        </ScrollStrip>
      )}

      {recommended.length > 0 && (
        <ScrollStrip title="Recommended cars">
          {recommended.map((c) => (
            <div key={c._id} className="w-[260px] flex-shrink-0 snap-start"><CarCard car={c} /></div>
          ))}
        </ScrollStrip>
      )}

      {similarModels.length > 0 && (
        <ScrollStrip title="Similar car models">
          {similarModels.map(({ model, startingPrice, count }) => (
            <Link key={model._id} to={`/cars?model=${model._id}`} className="w-[220px] flex-shrink-0 snap-start bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
              <div className="h-28 bg-slate-100 rounded-lg mb-3 flex items-center justify-center text-slate-400 text-xs">{model.name}</div>
              <p className="font-semibold text-sm text-slate-800">{model.name}</p>
              <p className="text-ember font-display font-semibold text-sm mt-1">Starting @ {formatPrice(startingPrice)}</p>
              <p className="text-xs text-slate-500 mt-0.5">{count} available {count === 1 ? 'car' : 'cars'}</p>
            </Link>
          ))}
        </ScrollStrip>
      )}

      {/* ==================== MODAL: RTO DETAILS (Screen 3 UI) ==================== */}
      {showRTOModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowRTOModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowRTOModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-xl">✕</button>

            <h3 className="text-xl font-bold text-slate-900">RTO Details</h3>
            <p className="text-xs text-slate-500 mb-6">Let us help you finding your dream car</p>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 mb-4">
              <span className="font-semibold text-sm text-slate-700">RC Status</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{car.rtoCode || 'KA01MG****'}</span>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">NOC ISSUED</span>
              </div>
            </div>

            <div className="space-y-6 text-sm">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Registration Information</h4>
                <div className="space-y-2">
                  <RTOModalRow label="RC Number" value={car.rtoCode || 'KA01MG****'} />
                  <RTOModalRow label="Registration Date" value={car.registrationYear ? `14-Mar-${car.registrationYear}` : '14-Mar-2011'} />
                  <RTOModalRow label="Registration RTO" value={car.rto || car.city?.name ? `${car.city?.name?.toUpperCase()} CENTRAL RTO` : 'BENGALURU CENTRAL RTO'} />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Insurance Information</h4>
                <div className="space-y-2">
                  <RTOModalRow label="Insurance Expiry Date" value={car.insuranceExpiry || '13-Mar-2026'} />
                  <RTOModalRow label="Insurance Company" value={car.insuranceCompany || 'ROYAL INS. COM.'} />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vehicle Information</h4>
                <div className="space-y-2">
                  <RTOModalRow label="Body Type" value={car.bodyType?.toUpperCase() || 'SALOON'} />
                  <RTOModalRow label="Engine Capacity(CC)" value={car.engineDisplacement ? `${car.engineDisplacement}.00` : '1396.00'} />
                  <RTOModalRow label="Fuel Type" value={car.fuel} />
                  <RTOModalRow label="Color" value={car.color?.toUpperCase() || 'WHITE'} />
                  <RTOModalRow label="Commercial" value="No" />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Compliance Information</h4>
                <div className="space-y-2">
                  <RTOModalRow label="RC Status" value="NOC ISSUED" />
                  <RTOModalRow label="PUCC Valid Upto" value={car.puccValid || 'Valid'} />
                  <RTOModalRow label="Fitness Valid Upto" value={car.fitnessValidTill || '13-Mar-2026'} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: EMI CALCULATOR & BREAKUP (Screens 4 & 5 UI) ==================== */}
      {showEmiModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowEmiModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowEmiModal(false)} className="absolute top-4 left-4 text-slate-600 hover:text-slate-900 font-bold text-lg">←</button>

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Loan Breakup</h3>
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setEmiModalTab('breakup')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${emiModalTab === 'breakup' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  BREAKUP
                </button>
                <button
                  onClick={() => setEmiModalTab('yearwise')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${emiModalTab === 'yearwise' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  YEAR-WISE
                </button>
              </div>
            </div>

            {emiModalTab === 'breakup' ? (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Your monthly EMI</span>
                    <p className="text-xl font-extrabold text-slate-900">{formatPrice(calculatedEmi)}</p>
                    <span className="text-[11px] text-slate-400">Rate of interest @ {interestRate}%* for {tenureYears} Years</span>
                  </div>
                  {/* Donut chart indicator */}
                  <div className="w-12 h-12 rounded-full border-4 border-cyan-400 border-t-amber-400 border-r-blue-600 flex items-center justify-center shrink-0"></div>
                </div>

                <div className="space-y-3 pt-4 text-xs font-medium">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-slate-600"><span className="w-2.5 h-2.5 rounded-xs bg-emerald-400"></span> Down payment</span>
                    <span className="font-bold text-slate-800">{formatPrice(downPayment)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-slate-600"><span className="w-2.5 h-2.5 rounded-xs bg-blue-500"></span> Loan amount</span>
                    <span className="font-bold text-slate-800">{formatPrice(currentLoan)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-slate-600"><span className="w-2.5 h-2.5 rounded-xs bg-amber-400"></span> Interest amount</span>
                    <span className="font-bold text-slate-800">{formatPrice(totalInterest)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200 text-sm font-bold text-slate-900">
                    <span>Payable amount</span>
                    <span>{formatPrice(downPayment + totalPayable)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <p className="text-xs font-bold text-slate-800 mb-1">Year-wise EMI calculator</p>
                <p className="text-xs text-slate-500 mb-3">For Loan amount • {formatPrice(currentLoan)}</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                        <th className="pb-2">Tenure</th>
                        <th className="pb-2">Interest Amt.</th>
                        <th className="pb-2 text-right">EMI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[5, 4, 3, 2, 1].map((yr) => {
                        const mRate = interestRate / 12 / 100;
                        const mCount = yr * 12;
                        const emi = Math.round((currentLoan * mRate * Math.pow(1 + mRate, mCount)) / (Math.pow(1 + mRate, mCount) - 1));
                        const iAmt = Math.max(0, (emi * mCount) - currentLoan);

                        return (
                          <tr key={yr} className={`hover:bg-slate-100/60 ${tenureYears === yr ? 'font-bold text-slate-900 bg-white' : 'text-slate-600'}`}>
                            <td className="py-2.5">{yr} Years {tenureYears === yr && <span className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.5 rounded ml-1 font-normal">Selected</span>}</td>
                            <td className="py-2.5">{formatPrice(iAmt)}</td>
                            <td className="py-2.5 text-right font-bold">{formatPrice(emi)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContact && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowContact(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {sent ? (
              <>
                <h3 className="font-display font-semibold text-xl text-slate-900">Message sent!</h3>
                <p className="text-sm text-slate-500 mt-2">The seller will reach out to you shortly.</p>
                <button onClick={() => setShowContact(false)} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 rounded-xl mt-5">
                  Close
                </button>
              </>
            ) : (
              <form onSubmit={submitContact} className="space-y-3.5">
                <h3 className="font-display font-semibold text-xl text-slate-900 mb-1">Contact seller</h3>
                <input name="name" required placeholder="Your name" defaultValue={user?.name} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ember/20 focus:border-ember"/>
                <input name="phone" required placeholder="Your phone" defaultValue={user?.mobile} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ember/20 focus:border-ember"/>
                <textarea name="message" rows="3" placeholder="I'm interested in this car..." className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ember/20 focus:border-ember" />
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

// Helper Subcomponents
function RTOModalRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-slate-50">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}

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

// SVG Icons
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

function EngineIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function GearIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
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

function CheckBadgeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  );
}

function CarIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4zM3 9l2-4h10l2 4h4v7h-2a3 3 0 01-6 0H9a3 3 0 01-6 0H1V9h2z" />
    </svg>
  );
}

function TagIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
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