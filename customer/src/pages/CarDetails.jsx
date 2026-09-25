import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/axios';
import toast from 'react-hot-toast';
import CarCard from '../components/CarCard';
import ImageLightbox from '../components/ImageLightbox';
import { formatPrice, formatKm } from '../utils/format';
import ScrollStrip from '../components/ScrollStrip';
import ReportAdModal from '../components/ReportAdModal';
import { Heart } from '../components/icons';
import { Phone, Share2 } from 'lucide-react';
import { toggleWishlist } from '../app/wishlistSlice';
import WhatsAppConnectButton from '../components/WhatsAppConnectButton';
import { useAuthGuard } from '../components/AuthGuardModal';
import { addCompare } from '../lib/compareTray';
import { rememberRecentlyViewed } from '../lib/recentlyViewed';
import { SHOW_TEST_DRIVE } from '../lib/featureFlags';
import { mediaUrl } from './profile/hubUtils';
import { COMPANY_NAME, COMPANY_PHONE_DIGITS, COMPANY_WHATSAPP } from '../lib/companyContact';

const glassCard = 'bg-white/70 backdrop-blur-md border border-white/20 shadow-[0_8px_24px_rgba(15,23,42,0.08)]';
const glassPanel = 'bg-white/80 backdrop-blur-md border border-white/20 shadow-[0_12px_32px_rgba(15,23,42,0.1)]';

const youtubeId = (url) => {
  const m = String(url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/);
  return m?.[1] || '';
};

const isMp4 = (url) => /\.mp4($|\?)/i.test(String(url || ''));

const TOKEN_CHOICES = [5000, 10000];

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Razorpay failed to load'));
    document.body.appendChild(script);
  });
}

const resolveImage = (src) => {
  if (!src) return '';
  const rewritten = String(src).replace(/^https?:\/\/localhost(:\d+)?/i, '');
  if (/^https?:\/\//i.test(rewritten)) return rewritten;
  return rewritten.startsWith('/') ? rewritten : `/${rewritten}`;
};

const ownerLabel = (n) => {
  if (n === 1) return '1st Owner';
  if (n === 2) return '2nd Owner';
  if (n === 3) return '3rd Owner';
  return n ? `${n}th Owner` : '—';
};

const PRICE_BADGE = {
  great: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  fair: 'bg-sky-100 text-sky-800 border-sky-200',
  high: 'bg-amber-100 text-amber-800 border-amber-200',
};

export default function CarDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const wishlisted = useSelector((s) => s.wishlist.ids.includes(id));
  const { requireAuth } = useAuthGuard();
  const [driveSent, setDriveSent] = useState(false);

  const [car, setCar] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [similarModels, setSimilarModels] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const thumbsRef = useRef(null);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showTestDrive, setShowTestDrive] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showRTOModal, setShowRTOModal] = useState(false);
  const [showEmiModal, setShowEmiModal] = useState(false);
  const [showFinance, setShowFinance] = useState(false);
  const [showInsurance, setShowInsurance] = useState(false);
  const [showBook, setShowBook] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [driveMode, setDriveMode] = useState('dealer');
  const [tokenAmount, setTokenAmount] = useState(5000);
  const [emiModalTab, setEmiModalTab] = useState('breakup');
  const [tab, setTab] = useState('overview');
  const [sent, setSent] = useState(false);
  const touchStartX = useRef(null);

  const [tenureYears, setTenureYears] = useState(4);
  const [interestRate, setInterestRate] = useState(14.5);
  const [loanAmount, setLoanAmount] = useState(0);

  useEffect(() => {
    const el = thumbsRef.current?.querySelector(`[data-thumb-index="${activeImg}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeImg]);

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
        if (carData?.price) setLoanAmount(carData.emiDetails?.suggestedLoan || Math.round(carData.price * 0.9));
        if (carData?.emiDetails?.defaultRate) setInterestRate(carData.emiDetails.defaultRate);
        if (carData?.emiDetails?.defaultTenureMonths) setTenureYears(Math.max(1, Math.round(carData.emiDetails.defaultTenureMonths / 12)));

        const [simRes, recRes, modelsRes] = await Promise.allSettled([
          api.get(`/cars/${id}/similar`),
          api.get(`/cars/${id}/recommended`),
          api.get(`/cars/${id}/similar-models`),
        ]);
        if (!isMounted) return;
        setSimilar(simRes.status === 'fulfilled' ? simRes.value.data : []);
        setRecommended(recRes.status === 'fulfilled' ? recRes.value.data : []);
        setSimilarModels(modelsRes.status === 'fulfilled' ? modelsRes.value.data : []);
      } catch {
        if (isMounted) setCar('error');
      }
    }
    fetchData();
    return () => { isMounted = false; };
  }, [id]);

  useEffect(() => {
    if (!car || car === 'error') return;
    const uid = user?._id || user?.id;
    if (!uid) return;
    rememberRecentlyViewed(car, uid);
  }, [car, user?._id, user?.id]);

  const insights = car?.quickInsights || {};
  const rto = car?.rtoDetails || {};
  const condition = insights.condition || {};
  const priceVerdict = insights.priceVerdict;
  const images = useMemo(() => ((car?.photos?.length ? car.photos : car?.images) || []).map(resolveImage), [car]);
  const hasRtoFacts = Boolean(
    rto.rcNumber ||
    rto.rcStatus ||
    rto.registrationDate ||
    rto.rtoLocation ||
    rto.insuranceExpiryDate ||
    rto.insuranceCompany ||
    rto.puccValidUpto ||
    rto.fitnessValidUpto ||
    rto.engineCapacityCC ||
    car?.insuranceType ||
    car?.bodyType ||
    car?.fuel ||
    car?.color
  );

  const submitContact = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    requireAuth(async () => {
      try {
        await api.post('/leads/enquiry', {
          carId: id,
          name: form.get('name'),
          phone: form.get('phone'),
          email: form.get('email'),
          message: form.get('message'),
          enquiryType: 'enquiry',
        });
        setSent(true);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not send message');
      }
    });
  };

  const submitTestDrive = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const home = driveMode === 'home';
    requireAuth(async () => {
      try {
        await api.post('/test-drives/book', {
          vehicleId: id,
          customerName: form.get('name'),
          customerPhone: form.get('phone'),
          customerEmail: form.get('email') || user?.email || '',
          preferredDate: form.get('date'),
          preferredTime: form.get('time'),
          location: home ? form.get('address') : (car?.dealer?.address || form.get('message') || ''),
          address: home ? form.get('address') : '',
          dlNumber: home ? form.get('dlNumber') : '',
          homeTestDrive: home,
          notes: form.get('message'),
        });
        setDriveSent(true);
        toast.success(home ? 'Home test drive requested' : 'Test drive requested');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not schedule test drive');
      }
    });
  };

  const logInteraction = async (action, extra = {}) => {
    try {
      await api.post('/leads/interaction', {
        carId: id,
        name: user?.name || extra.name || 'Buyer',
        phone: user?.mobile || extra.phone || car?.dealer?.phone || '0000000000',
        email: user?.email || '',
        message: extra.message || action,
        action,
        enquiryType: action,
      });
    } catch {
      /* non-blocking */
    }
  };

  const handleWishlist = () => {
    requireAuth(() => {
      dispatch(toggleWishlist(id));
    });
  };

  const handleCallDealer = () => {
    const phone = String(car?.dealer?.phone || COMPANY_PHONE_DIGITS).replace(/\D/g, '');
    if (!phone) return toast.error('4tyrezz phone is not available');
    requireAuth(() => {
      logInteraction('call');
      window.location.href = `tel:+${phone.startsWith('91') ? phone : `91${phone}`}`;
    });
  };

  const handleWhatsApp = () => {
    requireAuth(() => {
      const phone = String(car?.dealer?.whatsapp || car?.dealer?.phone || COMPANY_WHATSAPP).replace(/\D/g, '');
      const ref = String(car?._id || id).slice(-6).toUpperCase();
      const text = `Hi, I am interested in ${car?.year || ''} ${car?.brand?.name || ''} ${car?.model?.name || car?.title || ''} (Ref: #4T${ref}). Is it available?`;
      logInteraction('whatsapp', { message: text });
      window.open(`https://wa.me/${phone.startsWith('91') ? phone : `91${phone}`}?text=${encodeURIComponent(text)}`, '_blank');
    });
  };

  const handleCompare = () => {
    const result = addCompare(car);
    if (result.full) toast.error('Compare tray is full (4 cars)');
    else if (result.already) toast.success('Already in compare');
    else toast.success('Added to compare');
  };

  const submitFinance = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    requireAuth(async () => {
      try {
        await api.post('/finance/apply', {
          type: 'finance',
          vehicleId: id,
          name: form.get('name'),
          phone: form.get('phone'),
          email: form.get('email'),
          loanAmount: currentLoan,
          downPayment,
          tenureMonths: tenureYears * 12,
          message: `Loan for ${car.title}`,
        });
        await logInteraction('finance');
        toast.success('Finance application submitted');
        setShowFinance(false);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not submit finance application');
      }
    });
  };

  const submitInsurance = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    requireAuth(async () => {
      try {
        await api.post('/insurance/quote', {
          type: 'insurance',
          vehicleId: id,
          name: form.get('name'),
          phone: form.get('phone'),
          email: form.get('email'),
          insuranceType: form.get('cover') || 'Comprehensive',
          message: `Insurance quote for ${car.title}`,
        });
        await logInteraction('insurance');
        toast.success('Insurance request submitted');
        setShowInsurance(false);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not request insurance');
      }
    });
  };

  const submitBooking = () => {
    requireAuth(async () => {
      try {
        const { data } = await api.post('/bookings', {
          vehicleId: id,
          amount: tokenAmount,
          tokenAmount,
          notes: `Token booking for ${car.title}`,
        });
        const payment = data.payment || {};
        const booking = data.data;
        if (payment.stub || !payment.keyId || String(payment.keyId).includes('stub')) {
          await api.post('/bookings/verify-payment', { bookingId: booking._id });
          toast.success('Vehicle reserved with token payment');
          setShowBook(false);
          return;
        }
        await loadRazorpay();
        const rzp = new window.Razorpay({
          key: payment.keyId,
          amount: payment.amount,
          currency: payment.currency || 'INR',
          name: '4TYREZZ',
          description: `Token for ${car.title}`,
          order_id: payment.orderId,
          handler: async (response) => {
            await api.post('/bookings/verify-payment', { bookingId: booking._id, ...response });
            toast.success('Token payment successful');
            setShowBook(false);
          },
        });
        rzp.open();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not start booking');
      }
    });
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
    thumbsRef.current.scrollBy({
      left: direction === 'left' ? -240 : 240,
      behavior: 'smooth',
    });
  };

  const onGalleryTouchStart = (e) => {
    touchStartX.current = e.changedTouches?.[0]?.clientX ?? null;
  };

  const onGalleryTouchEnd = (e) => {
    if (touchStartX.current == null || !images.length) return;
    const dx = (e.changedTouches?.[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 48) return;
    if (dx < 0) setActiveImg((i) => (i + 1) % images.length);
    else setActiveImg((i) => (i - 1 + images.length) % images.length);
  };

  if (!car) return <div className="container-px py-16 max-w-7xl mx-auto"><CarSkeleton /></div>;
  if (car === 'error') {
    return (
      <div className="container-px py-16 text-center text-slate-500 max-w-7xl mx-auto">
        This listing could not be loaded. It may have been removed.
      </div>
    );
  }

  const imagesCount = images.length;
  const nextImg = () => setActiveImg((i) => (i + 1) % imagesCount);
  const prevImg = () => setActiveImg((i) => (i - 1 + imagesCount) % imagesCount);

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

  const marketMin = insights.marketPriceMin;
  const marketMax = insights.marketPriceMax;
  const marketRange = marketMin != null && marketMax != null ? marketMax - marketMin : 0;
  const pricePosition = marketRange > 0
    ? Math.min(100, Math.max(0, ((carPrice - marketMin) / marketRange) * 100))
    : 50;

  const spec = car.specs || {};
  const compliance = car.compliance || {};
  const history = car.history || {};
  const inspection = car.inspection || {};
  const loc = car.location || {};
  const ytId = youtubeId(car.videoUrl);

  const overviewItems = [
    { label: 'Registration Year', value: spec.registrationYear || car.registrationYear || car.year },
    { label: 'Manufacture Year', value: spec.year || car.year },
    { label: 'Insurance', value: compliance.insuranceValidity || car.insuranceType || '—' },
    { label: 'PUC', value: compliance.pucValidity || '—' },
    { label: 'Fuel Type', value: spec.fuel || car.fuel },
    { label: 'Seats', value: car.seats ? `${car.seats} Seats` : '—' },
    { label: 'Kms Driven', value: formatKm(spec.kmDriven ?? car.kmDriven) },
    { label: 'RTO', value: spec.rto || car.rto || car.city?.name || '—' },
    { label: 'Registration State', value: spec.registrationState || loc.state || car.city?.state || '—' },
    { label: 'Locality', value: loc.area || loc.formattedAddress || '—' },
    { label: 'Ownership', value: ownerLabel(spec.ownerCount || car.ownership) },
    { label: 'Engine', value: car.engineDisplacement ? `${car.engineDisplacement} cc` : rto.engineCapacityCC ? `${rto.engineCapacityCC} cc` : '—' },
    { label: 'Transmission', value: spec.transmission || car.transmission },
    { label: 'Body Type', value: spec.bodyType || car.bodyType },
    { label: 'Color', value: spec.color || car.color || '—' },
  ].filter((item) => item.value && item.value !== '—');

  const specRows = [
    ['Brand', car.brand?.name],
    ['Model', car.model?.name],
    ['Variant', car.variant],
    ['Year', car.year],
    ['Fuel Type', car.fuel],
    ['KM Driven', formatKm(car.kmDriven)],
    ['Transmission', car.transmission],
    ['Body Type', car.bodyType],
    ['Ownership', ownerLabel(car.ownership)],
    ['Color', car.color],
    ['Location', loc.area ? `${loc.area}${car.city?.name ? `, ${car.city.name}` : ''}` : car.city?.name],
    ['Views', car.views != null ? `${car.views.toLocaleString('en-IN')} views` : null],
  ].filter(([, v]) => v);

  const conditionChecks = [
    { label: 'Accidental History', value: condition.accidental, ok: condition.accidental === 'No' },
    { label: 'Odometer Tampered', value: condition.odometerTampered, ok: condition.odometerTampered === 'No' },
    { label: 'Insurance', value: condition.insuranceStatus, ok: condition.insuranceStatus === 'Valid' },
    { label: 'KM Usage', value: condition.kmCondition, ok: condition.kmCondition !== 'Above average' },
  ].filter((c) => c.value);

  const thingsToCheck = (insights.thingsToCheck || []).filter(Boolean);
  const highlightFeatures = (car.features || []).slice(0, 8);

  return (
    <div className="bg-slate-50 lg:bg-cream min-h-screen overflow-x-clip w-full pb-[calc(4.5rem+4.75rem+env(safe-area-inset-bottom))] lg:pb-16">
      <div className="w-full overflow-x-clip lg:container-px lg:py-6 lg:max-w-7xl lg:mx-auto">
        {/* Breadcrumb — desktop only */}
        <nav className="hidden lg:flex text-sm text-slate2 mb-5 flex-wrap items-center gap-1 px-0">
          <Link to="/" className="hover:text-ember transition">Home</Link>
          <span>/</span>
          <Link to="/cars" className="hover:text-ember transition">Used Cars</Link>
          {car.city?.name && (
            <>
              <span>/</span>
              <Link to={`/cars?city=${car.city._id}`} className="hover:text-ember transition">{car.city.name}</Link>
            </>
          )}
          {car.brand?.name && (
            <>
              <span>/</span>
              <Link to={`/cars?brand=${car.brand._id}`} className="hover:text-ember transition">{car.brand.name}</Link>
            </>
          )}
          <span>/</span>
          <span className="text-ink font-medium truncate">{car.title}</span>
        </nav>

        <div className="grid lg:grid-cols-[1.55fr_1fr] lg:gap-8 items-start min-w-0 w-full">
          {/* LEFT */}
          <div className="space-y-0 lg:space-y-6 min-w-0 w-full max-w-full">
            {/* Gallery — full-bleed on mobile */}
            <div className="overflow-hidden bg-white lg:rounded-2xl lg:border lg:border-white/20 lg:bg-white/70 lg:backdrop-blur-md lg:shadow-[0_8px_24px_rgba(15,23,42,0.08)] w-full max-w-full">
              <div
                className="relative h-[220px] sm:h-[280px] lg:h-[420px] bg-slate-900 group w-full"
                onTouchStart={onGalleryTouchStart}
                onTouchEnd={onGalleryTouchEnd}
              >
                {showVideo && car.videoUrl ? (
                  ytId && !isMp4(car.videoUrl) ? (
                    <iframe
                      title="Vehicle walkaround"
                      src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                      className="w-full h-full"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={resolveImage(car.videoUrl)}
                      controls
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                  )
                ) : imagesCount > 0 ? (
                  <>
                    <img
                      src={images[activeImg]}
                      alt={car.title}
                      onClick={() => setLightboxOpen(true)}
                      className="w-full h-full object-cover cursor-zoom-in"
                    />
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 max-w-[70%]">
                      {(inspection.ratingScore || car.inspectionScore) && (
                        <span className="bg-emerald-950/90 text-emerald-300 text-[10px] font-bold px-2 py-1 rounded-md border border-emerald-800/50">
                          ★ {inspection.ratingScore || car.inspectionScore}/100
                        </span>
                      )}
                      {car.isFeatured && (
                        <span className="bg-ink/90 text-white text-[10px] font-bold px-2 py-1 rounded-md">Featured</span>
                      )}
                      {car.isPremium && (
                        <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">Premium</span>
                      )}
                    </div>
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 lg:hidden">
                      <button
                        type="button"
                        onClick={handleShare}
                        className="w-8 h-8 rounded-full bg-white/95 text-slate-800 shadow flex items-center justify-center"
                        aria-label="Share"
                      >
                        <Share2 className="w-3.5 h-3.5" strokeWidth={2.2} />
                      </button>
                      <button
                        type="button"
                        onClick={handleWishlist}
                        className="w-8 h-8 rounded-full bg-white/95 shadow flex items-center justify-center"
                        aria-label="Wishlist"
                      >
                        <Heart filled={wishlisted} className={wishlisted ? 'text-[#3083ff] w-3.5 h-3.5' : 'text-slate-500 w-3.5 h-3.5'} />
                      </button>
                    </div>
                    {car.videoUrl && (
                      <button
                        type="button"
                        onClick={() => setShowVideo(true)}
                        className="absolute bottom-2.5 left-2.5 bg-white/90 text-ink text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-md"
                      >
                        ▶ Video
                      </button>
                    )}
                    {imagesCount > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={prevImg}
                          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 text-ink shadow font-bold opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition"
                          aria-label="Previous photo"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={nextImg}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 text-ink shadow font-bold opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition"
                          aria-label="Next photo"
                        >
                          ›
                        </button>
                        <span className="absolute bottom-2.5 right-2.5 bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          {activeImg + 1}/{imagesCount}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No photos uploaded</div>
                )}
                {showVideo && car.videoUrl && (
                  <button
                    type="button"
                    onClick={() => setShowVideo(false)}
                    className="absolute top-2.5 right-2.5 bg-white/90 text-ink text-xs font-bold px-3 py-1.5 rounded-lg"
                  >
                    Photos
                  </button>
                )}
              </div>

              {/* Thumbnails — mobile + desktop */}
              {(imagesCount > 1 || car.videoUrl) && (
                <div className="px-3 lg:px-4 py-2.5 lg:py-3 border-t border-slate-100 lg:border-white/20 flex items-center gap-2 w-full max-w-full min-w-0">
                  {imagesCount > 5 && (
                    <button type="button" onClick={() => handleScrollThumbs('left')} className="hidden lg:flex w-8 h-8 rounded-full border border-white/30 bg-white/70 shrink-0 items-center justify-center">‹</button>
                  )}
                  <div ref={thumbsRef} className="flex gap-1.5 lg:gap-2 overflow-x-auto no-scrollbar scroll-smooth flex-1 min-w-0 py-0.5">
                    {car.videoUrl && (
                      <button
                        type="button"
                        onClick={() => setShowVideo(true)}
                        className={`w-14 h-11 lg:w-20 lg:h-14 shrink-0 rounded-md lg:rounded-lg overflow-hidden border-2 transition flex items-center justify-center bg-slate-900 text-white text-[9px] lg:text-[10px] font-bold ${showVideo ? 'border-[#3083ff] ring-2 ring-[#3083ff]/20' : 'border-transparent opacity-80'}`}
                      >
                        ▶ Video
                      </button>
                    )}
                    {images.map((img, i) => (
                      <button
                        type="button"
                        key={i}
                        data-thumb-index={i}
                        onClick={() => { setShowVideo(false); setActiveImg(i); }}
                        className={`w-14 h-11 lg:w-20 lg:h-14 shrink-0 rounded-md lg:rounded-lg overflow-hidden border-2 transition ${!showVideo && i === activeImg ? 'border-[#3083ff] ring-2 ring-[#3083ff]/20' : 'border-transparent opacity-70'}`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  {imagesCount > 5 && (
                    <button type="button" onClick={() => handleScrollThumbs('right')} className="hidden lg:flex w-8 h-8 rounded-full border border-white/30 bg-white/70 shrink-0 items-center justify-center">›</button>
                  )}
                </div>
              )}
            </div>

            {lightboxOpen && imagesCount > 0 && (
              <ImageLightbox images={images} startIndex={activeImg} onClose={() => setLightboxOpen(false)} />
            )}

            {/* Mobile: key info block (CarDekho-style — important data on top) */}
            <div className="lg:hidden bg-white border-b border-slate-100 w-full max-w-full overflow-hidden">
              <div className="px-4 pt-3.5 pb-3">
                {priceVerdict?.label && (
                  <span className={`inline-flex max-w-full truncate text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase mb-2 ${PRICE_BADGE[priceVerdict.tone] || PRICE_BADGE.fair}`}>
                    {priceVerdict.label}
                  </span>
                )}
                <h1 className="text-[17px] font-black text-slate-900 leading-snug break-words">
                  {car.year} {car.brand?.name} {car.model?.name}
                </h1>
                {car.variant && <p className="text-[12px] text-slate-500 mt-0.5 truncate">{car.variant}</p>}

                <div className="flex items-end justify-between gap-3 mt-2.5">
                  <p className="text-[22px] font-black text-slate-900 tracking-tight leading-none">{formatPrice(car.price)}</p>
                  <button
                    type="button"
                    onClick={handleCompare}
                    className="shrink-0 text-[11px] font-bold text-[#1853ff] px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-100"
                  >
                    + Compare
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEmiModal(true)}
                  className="mt-2.5 text-[12px] font-bold text-[#1853ff] bg-blue-50 px-3 py-2 rounded-lg w-full text-left"
                >
                  EMI from {formatPrice(calculatedEmi)}/mo · View breakup →
                </button>
              </div>

              {/* Key specs grid — always on top, no horizontal scroll */}
              <div className="grid grid-cols-2 border-t border-slate-100">
                {[
                  { label: 'Km driven', value: formatKm(car.kmDriven) },
                  { label: 'Fuel', value: car.fuel || '—' },
                  { label: 'Transmission', value: car.transmission || '—' },
                  { label: 'Owner', value: ownerLabel(car.ownership) },
                  { label: 'Year', value: car.year || '—' },
                  { label: 'Location', value: car.city?.name || loc.area || '—' },
                ].map((row, idx) => (
                  <div
                    key={row.label}
                    className={`px-4 py-2.5 min-w-0 ${idx % 2 === 0 ? 'border-r border-slate-100' : ''} ${idx < 4 ? 'border-b border-slate-100' : ''}`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{row.label}</p>
                    <p className="text-[13px] font-black text-slate-900 mt-0.5 truncate">{row.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-3 sm:px-4 lg:px-0 space-y-3 lg:space-y-6 pt-3 lg:pt-0 w-full max-w-full min-w-0 overflow-x-clip">
            {/* Why this car + market price */}
            <section className="bg-white rounded-2xl border border-slate-100 lg:border-slate-200 p-4 lg:p-6 shadow-sm lg:shadow-soft w-full max-w-full overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4 lg:mb-5">
                <div className="min-w-0">
                  <h2 className="text-[15px] lg:font-display lg:text-xl font-black lg:font-bold text-ink">Why consider this car?</h2>
                  {insights.goodBuyReason && (
                    <p className="text-[13px] lg:text-sm text-slate2 mt-2 leading-relaxed break-words">{insights.goodBuyReason}</p>
                  )}
                </div>
                {priceVerdict?.label && (
                  <span className={`hidden lg:inline text-xs font-bold px-3 py-1.5 rounded-full border uppercase tracking-wide ${PRICE_BADGE[priceVerdict.tone] || PRICE_BADGE.fair}`}>
                    {priceVerdict.label}
                  </span>
                )}
              </div>

              {marketMin != null && marketMax != null && (
                <div className="bg-slate-50 rounded-xl p-3.5 lg:p-4 border border-slate-100 overflow-hidden">
                  <div className="flex justify-between gap-2 text-xs font-semibold text-slate2 mb-2">
                    <span className="shrink-0">Market range</span>
                    <span className="truncate text-right">{formatPrice(marketMin)} – {formatPrice(marketMax)}</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-gradient-to-r from-emerald-200 via-sky-200 to-amber-200">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#3083ff] lg:bg-ember border-2 border-white shadow-md"
                      style={{ left: `min(calc(${pricePosition}% - 7px), calc(100% - 14px))` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-2 gap-2">
                    <span className="text-emerald-700 font-medium">Lower</span>
                    <span className="text-ink font-bold truncate">{formatPrice(carPrice)}</span>
                    <span className="text-amber-700 font-medium">Higher</span>
                  </div>
                  {insights.marketEstimated && (
                    <p className="text-[11px] text-slate-400 mt-2">Estimated from similar listings in inventory</p>
                  )}
                </div>
              )}
            </section>

            {/* Quick insights */}
            <section className="grid md:grid-cols-2 gap-3 lg:gap-4">
              <div className="bg-white rounded-2xl border border-slate-100 lg:border-slate-200 p-4 lg:p-5 shadow-sm lg:shadow-soft">
                <h3 className="text-[12px] lg:text-sm font-black lg:font-bold text-ink uppercase tracking-wide mb-2.5 lg:mb-3">Fit for you</h3>
                {insights.fitForYou ? (
                  <p className="text-sm text-slate2 leading-relaxed mb-4">{insights.fitForYou}</p>
                ) : (
                  <p className="text-sm text-slate-400 mb-4">No fit summary available.</p>
                )}
                {highlightFeatures.length > 0 && (
                  <div className="space-y-2">
                    {highlightFeatures.map((feat) => (
                      <div key={feat} className="flex items-center gap-2 text-sm font-semibold text-ink">
                        <span className="text-verify">✓</span>{feat}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-amber-50/80 rounded-2xl border border-amber-200/70 p-4 lg:p-5 shadow-sm lg:shadow-soft">
                <h3 className="text-[12px] lg:text-sm font-black lg:font-bold text-amber-900 uppercase tracking-wide mb-2.5 lg:mb-3">Things to check</h3>
                {thingsToCheck.length > 0 ? (
                  <ul className="space-y-3">
                    {thingsToCheck.map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-slate-700">
                        <span className="text-amber-600 font-bold shrink-0">!</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">{SHOW_TEST_DRIVE ? 'Schedule a test drive and physical inspection before purchase.' : 'Ask 4tyrezz for a physical inspection before purchase.'}</p>
                )}
              </div>
            </section>

            {/* Vehicle condition */}
            {conditionChecks.length > 0 && (
              <section className={`${glassCard} rounded-2xl p-5`}>
                <h3 className="font-display text-lg font-bold text-ink mb-4">Vehicle condition</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {conditionChecks.map(({ label, value, ok }) => (
                    <div key={label} className={`rounded-xl p-3 border border-white/20 backdrop-blur-md ${ok ? 'bg-emerald-50/70 border-emerald-200/60' : 'bg-amber-50/70 border-amber-200/60'}`}>
                      <p className="text-[11px] font-bold text-slate2 uppercase">{label}</p>
                      <p className={`text-sm font-bold mt-1 ${ok ? 'text-verify' : 'text-amber-800'}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className={`${glassCard} rounded-2xl p-5`}>
              <h3 className="font-display text-lg font-bold text-ink mb-4">Compliance & documents</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl p-3 bg-white/50 border border-white/20">
                  <p className="text-[11px] font-bold text-slate2 uppercase">Insurance validity</p>
                  <p className="text-sm font-bold text-ink mt-1">{compliance.insuranceValidity || car.insuranceType || 'Not listed'}</p>
                  {compliance.insuranceExpiry && <p className="text-xs text-slate2 mt-1">{compliance.insuranceExpiry}</p>}
                </div>
                <div className="rounded-xl p-3 bg-white/50 border border-white/20">
                  <p className="text-[11px] font-bold text-slate2 uppercase">PUC validity</p>
                  <p className="text-sm font-bold text-ink mt-1">{compliance.pucValidity || 'Not listed'}</p>
                  {compliance.pucExpiry && <p className="text-xs text-slate2 mt-1">{compliance.pucExpiry}</p>}
                </div>
              </div>
            </section>

            <section className={`${glassCard} rounded-2xl p-5`}>
              <h3 className="font-display text-lg font-bold text-ink mb-4">History & verification</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-white/60 border border-white/20">
                  {/^(no|none|zero)/i.test(String(history.accidentHistory || condition.accidental || ''))
                    ? 'Zero major accidents'
                    : (history.accidentHistory || 'Accident history not listed')}
                </span>
                {history.ownershipChain && (
                  <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-white/60 border border-white/20">
                    {history.ownershipChain}
                  </span>
                )}
              </div>
              {(history.serviceLogs || []).length > 0 ? (
                <ol className="space-y-3 border-l border-white/40 ml-2">
                  {history.serviceLogs.map((log, i) => (
                    <li key={`${log.date}-${i}`} className="pl-4 relative">
                      <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#3083ff] border-2 border-white" />
                      <p className="text-sm font-bold text-ink">{log.date || log.center || 'Service record'}</p>
                      <p className="text-xs text-slate2 mt-0.5">
                        {[log.odometer ? `${Number(log.odometer).toLocaleString('en-IN')} km` : '', log.center, log.notes].filter(Boolean).join(' · ')}
                      </p>
                      {log.authorized && (
                        <span className="inline-block mt-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-full">
                          Authorized service
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-slate-500">No service log has been uploaded for this listing.</p>
              )}
            </section>

            {(inspection.ratingScore || inspection.categories?.length || inspection.reportPdfUrl) && (
              <section className={`${glassCard} rounded-2xl p-5`}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-ink">4TYREZZ inspection report</h3>
                    <p className="text-xs text-slate2 mt-1">140+ point digital inspection — scores shown only where recorded</p>
                  </div>
                  {inspection.ratingScore != null && (
                    <p className="text-2xl font-extrabold text-verify">{inspection.ratingScore}<span className="text-sm">/100</span></p>
                  )}
                </div>
                {inspection.categories?.length > 0 && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {inspection.categories.map((row) => (
                      <div key={row.label} className="rounded-xl p-3 bg-white/50 border border-white/20">
                        <p className="text-[11px] font-bold text-slate2 uppercase">{row.label}</p>
                        <p className="text-sm font-bold text-ink mt-1">{row.value}</p>
                      </div>
                    ))}
                  </div>
                )}
                {inspection.reportPdfUrl && (
                  <a
                    href={mediaUrl(inspection.reportPdfUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex mt-4 text-sm font-bold text-[#3083ff] hover:underline"
                  >
                    Download inspection PDF
                  </a>
                )}
              </section>
            )}

            {/* RTO card */}
            <section className="bg-gradient-to-r from-blue-50 to-white lg:from-orange-50 lg:to-white rounded-2xl border border-blue-100 lg:border-orange-100 p-4 lg:p-6 shadow-sm lg:shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4 lg:gap-5">
              <div>
                <h3 className="text-[15px] lg:font-display lg:text-lg font-black lg:font-bold text-ink">RTO & document report</h3>
                <p className="text-[12px] lg:text-sm text-slate2 mt-1">Registration, insurance, and compliance details for this listing</p>
                <div className="flex flex-wrap gap-3 lg:gap-4 mt-3 lg:mt-4 text-sm">
                  {rto.rcNumber && <span className="font-semibold text-ink">RC: {rto.rcNumber}</span>}
                  {rto.rcStatus && (
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded uppercase">{rto.rcStatus}</span>
                  )}
                  {car.insuranceType && <span className="text-slate2">Insurance: {car.insuranceType}</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRTOModal(true)}
                className="px-5 py-3 rounded-xl border-2 border-[#3083ff] text-[#1853ff] lg:border-ember lg:text-ember hover:bg-[#3083ff]/5 lg:hover:bg-ember/5 font-bold text-sm shrink-0 transition"
              >
                View full RTO details
              </button>
            </section>

            {/* Tabs */}
            <div className={`${glassCard} rounded-2xl overflow-hidden w-full max-w-full`}>
              <div className="flex border-b border-slate-100 px-1 lg:px-2 overflow-x-auto no-scrollbar max-w-full">
                {[
                  ['overview', 'Overview'],
                  ['specs', 'Specifications'],
                  ['features', 'Features'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`px-3.5 lg:px-5 py-3.5 lg:py-4 text-[13px] lg:text-sm font-bold border-b-2 -mb-px transition shrink-0 ${tab === key ? 'border-[#3083ff] text-[#1853ff] lg:border-ember lg:text-ember' : 'border-transparent text-slate2 hover:text-ink'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="p-4 lg:p-6 overflow-x-clip">
                {tab === 'overview' && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {overviewItems.map(({ label, value }) => (
                      <OverviewCard key={label} label={label} value={value} />
                    ))}
                  </div>
                )}

                {tab === 'specs' && (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                    {specRows.map(([k, v]) => (
                      <div key={k} className="flex justify-between px-4 py-3 text-sm bg-white even:bg-slate-50/60">
                        <span className="text-slate2">{k}</span>
                        <span className="font-semibold text-ink">{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {tab === 'features' && (
                  car.features?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {car.features.map((f) => (
                        <span key={f} className="bg-verify-bg text-verify border border-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-full">
                          ✓ {f}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No features listed for this car.</p>
                  )
                )}
              </div>
            </div>

            {car.description && (
              <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
                <h3 className="font-display text-lg font-bold text-ink mb-3">Listing description</h3>
                <p className="text-sm text-slate2 leading-relaxed whitespace-pre-line">{car.description}</p>
              </section>
            )}

            {/* Seller */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
              <h3 className="font-display text-lg font-bold text-ink mb-3">Listed by 4tyrezz</h3>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-ink">{COMPANY_NAME}</p>
                  <p className="text-sm text-slate2 mt-0.5">
                    Inspected listing · Contact 4tyrezz only
                    {car.city?.name ? ` · ${car.city.name}` : ''}
                  </p>
                </div>
                <span className="text-xs font-bold bg-verify-bg text-verify px-3 py-1.5 rounded-full border border-emerald-200">
                  Verified listing
                </span>
              </div>
            </section>

            {/* Finance */}
            <FinanceSection
              carPrice={carPrice}
              currentLoan={currentLoan}
              downPayment={downPayment}
              calculatedEmi={calculatedEmi}
              tenureYears={tenureYears}
              interestRate={interestRate}
              setLoanAmount={setLoanAmount}
              setTenureYears={setTenureYears}
              setInterestRate={setInterestRate}
              onViewBreakup={() => setShowEmiModal(true)}
              onApply={() => requireAuth(() => setShowFinance(true))}
            />
            </div>
          </div>

          {/* RIGHT STICKY CARD — desktop only */}
          <aside className="hidden lg:block lg:sticky lg:top-24 space-y-4">
            <div className={`${glassPanel} rounded-2xl p-6`}>
              <div className="flex justify-between items-start gap-3 mb-3">
                <div>
                  <h1 className="font-display text-2xl font-bold text-ink leading-tight">
                    {car.year} {car.brand?.name} {car.model?.name}
                  </h1>
                  {car.variant && <p className="text-sm text-slate2 mt-1">{car.variant}</p>}
                </div>
                <button type="button" onClick={handleWishlist} className="p-2.5 rounded-full border border-slate-200 hover:bg-slate-50 transition">
                  <Heart filled={wishlisted} className={wishlisted ? 'text-ember w-5 h-5' : 'text-slate-400 w-5 h-5'} />
                </button>
              </div>

              {priceVerdict?.label && (
                <span className={`inline-flex text-[11px] font-bold px-2.5 py-1 rounded-md border mb-3 ${PRICE_BADGE[priceVerdict.tone] || PRICE_BADGE.fair}`}>
                  {priceVerdict.label}
                </span>
              )}

              <p className="font-display text-3xl font-extrabold text-ink">{formatPrice(car.price)}</p>

              {marketMin != null && marketMax != null && (
                <p className="text-xs text-slate2 mt-1">
                  Market estimate: {formatPrice(marketMin)} – {formatPrice(marketMax)}
                </p>
              )}

              <button
                type="button"
                onClick={() => setShowEmiModal(true)}
                className="mt-3 text-sm text-sky-700 font-semibold bg-sky-50 hover:bg-sky-100 px-3 py-2 rounded-lg w-full text-left transition"
              >
                EMI from <strong>{formatPrice(calculatedEmi)}/mo</strong> · View breakup →
              </button>

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                <SpecChip>{formatKm(car.kmDriven)}</SpecChip>
                {condition.kmCondition && <SpecChip tone={condition.kmCondition === 'Below average' ? 'good' : condition.kmCondition === 'Above average' ? 'warn' : 'neutral'}>{condition.kmCondition} usage</SpecChip>}
                <SpecChip>{car.fuel}</SpecChip>
                <SpecChip>{car.transmission}</SpecChip>
                <SpecChip>{ownerLabel(car.ownership)}</SpecChip>
              </div>

              <button
                type="button"
                onClick={() => requireAuth(() => setShowContact(true))}
                className="w-full mt-5 bg-brand-gradient hover:opacity-95 text-white font-bold py-3.5 rounded-xl transition shadow-sm"
              >
                Contact 4tyrezz
              </button>
              {SHOW_TEST_DRIVE && (
                <button
                  type="button"
                  onClick={() => requireAuth(() => { setDriveMode('dealer'); setDriveSent(false); setShowTestDrive(true); })}
                  className="w-full mt-2 border border-white/30 bg-white/50 text-slate-800 font-bold py-3.5 rounded-xl hover:bg-white/80"
                >
                  Schedule test drive
                </button>
              )}
              <div className={`${glassCard} rounded-2xl p-3 mt-3 grid grid-cols-2 gap-2`}>
                <button type="button" onClick={handleCallDealer} className="text-xs font-bold py-2.5 rounded-xl bg-white/70 border border-white/20 hover:bg-white">Call 4tyrezz</button>
                <button type="button" onClick={handleWhatsApp} className="text-xs font-bold py-2.5 rounded-xl bg-[#25D366]/90 text-white border border-white/20">WhatsApp</button>
                <button type="button" onClick={() => requireAuth(() => { setSent(false); setShowContact(true); })} className="text-xs font-bold py-2.5 rounded-xl bg-white/70 border border-white/20 hover:bg-white">Send enquiry</button>
                {SHOW_TEST_DRIVE && (
                  <button type="button" onClick={() => requireAuth(() => { setDriveMode('home'); setDriveSent(false); setShowTestDrive(true); })} className="text-xs font-bold py-2.5 rounded-xl bg-white/70 border border-white/20 hover:bg-white">Home test drive</button>
                )}
                <button type="button" onClick={() => requireAuth(() => setShowFinance(true))} className="text-xs font-bold py-2.5 rounded-xl bg-white/70 border border-white/20 hover:bg-white">Get finance</button>
                <button type="button" onClick={() => requireAuth(() => setShowInsurance(true))} className="text-xs font-bold py-2.5 rounded-xl bg-white/70 border border-white/20 hover:bg-white">Request insurance</button>
                <button type="button" onClick={() => requireAuth(() => setShowBook(true))} className="text-xs font-bold py-2.5 rounded-xl bg-ink text-white col-span-2">Book vehicle</button>
                <button type="button" onClick={handleCompare} className="text-xs font-bold py-2.5 rounded-xl bg-white/70 border border-white/20 hover:bg-white col-span-2">Add to compare</button>
              </div>

              {(car.city?.name || loc.area || loc.formattedAddress) && (
                <p className="text-center text-xs text-slate2 mt-3">📍 {[loc.area, car.city?.name, loc.state || car.city?.state].filter(Boolean).join(', ')}</p>
              )}

              <div className="mt-4">
                <WhatsAppConnectButton car={car} onOpen={() => logInteraction('whatsapp')} />
              </div>

              <div className="flex justify-between mt-4 pt-3 border-t border-slate-100 text-xs font-medium text-slate2">
                <button type="button" onClick={() => setShowReport(true)} className="hover:text-ember transition">Report ad</button>
                <button type="button" onClick={handleShare} className="hover:text-ember transition">Share listing</button>
              </div>
            </div>

            {car.inspectionScore && (
              <div className="bg-emerald-50/70 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                <p className="text-xs font-bold text-verify uppercase tracking-wide">4tyrezz Inspection</p>
                <p className="text-3xl font-display font-extrabold text-verify mt-1">{car.inspectionScore}<span className="text-lg">/100</span></p>
                <p className="text-xs text-slate2 mt-1">Manually inspected before listing</p>
              </div>
            )}
          </aside>
        </div>

        {/* Similar sections */}
        {similar.length > 0 && (
          <div className="mt-6 lg:mt-12 px-3 sm:px-4 lg:px-0 w-full max-w-full min-w-0 overflow-x-clip">
            <ScrollStrip title="Similar cars you may like">
              {similar.map((c) => (
                <div key={c._id} className="w-[168px] sm:w-[210px] lg:w-[260px] shrink-0 snap-start"><CarCard car={c} /></div>
              ))}
            </ScrollStrip>
          </div>
        )}

        {recommended.length > 0 && (
          <div className="mt-5 lg:mt-8 px-3 sm:px-4 lg:px-0 w-full max-w-full min-w-0 overflow-x-clip">
            <ScrollStrip title="Recommended in your budget">
              {recommended.map((c) => (
                <div key={c._id} className="w-[168px] sm:w-[210px] lg:w-[260px] shrink-0 snap-start"><CarCard car={c} /></div>
              ))}
            </ScrollStrip>
          </div>
        )}

        {similarModels.length > 0 && (
          <div className="mt-5 lg:mt-8 px-3 sm:px-4 lg:px-0 w-full max-w-full min-w-0 overflow-x-clip">
            <ScrollStrip title="Explore similar models">
              {similarModels.map(({ model, startingPrice, count }) => (
                <Link
                  key={model._id}
                  to={`/cars?model=${model._id}`}
                  className="w-[150px] sm:w-[180px] lg:w-[220px] shrink-0 snap-start bg-white border border-slate-200 rounded-2xl p-3.5 lg:p-4 shadow-soft hover:shadow-md transition"
                >
                  <p className="font-bold text-ink text-sm truncate">{model.name}</p>
                  <p className="text-[#3083ff] lg:text-ember font-display font-semibold text-sm mt-1">From {formatPrice(startingPrice)}</p>
                  <p className="text-xs text-slate2 mt-1">{count} {count === 1 ? 'listing' : 'listings'} available</p>
                </Link>
              ))}
            </ScrollStrip>
          </div>
        )}
      </div>

      {/* Mobile sticky CTA — above BottomNav */}
      <div className="lg:hidden fixed inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_-8px_24px_rgba(15,23,42,0.08)] bottom-[calc(62px+env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-3 gap-1.5 px-2.5 py-2">
          <button
            type="button"
            onClick={handleCallDealer}
            className="inline-flex flex-col items-center justify-center gap-0.5 h-12 rounded-xl border border-[#3083ff]/25 bg-blue-50 text-[#1853ff] text-[11px] font-black"
          >
            <Phone className="w-4 h-4" strokeWidth={2.4} />
            Call
          </button>
          <button
            type="button"
            onClick={handleWhatsApp}
            className="inline-flex flex-col items-center justify-center gap-0.5 h-12 rounded-xl bg-[#25D366] text-white text-[11px] font-black"
          >
            <span className="text-[13px] leading-none">WA</span>
            Chat
          </button>
          <button
            type="button"
            onClick={() => requireAuth(() => setShowContact(true))}
            className="inline-flex flex-col items-center justify-center gap-0.5 h-12 rounded-xl bg-[#3083ff] text-white text-[11px] font-black shadow-sm"
          >
            <span className="text-[13px] leading-none">✉</span>
            Contact
          </button>
        </div>
      </div>

      {/* RTO Modal */}
      {showRTOModal && (
        <ModalShell onClose={() => setShowRTOModal(false)}>
          <h3 className="text-lg sm:text-xl font-black text-ink pr-8">RTO details</h3>
          <p className="text-xs text-slate2 mb-4 leading-relaxed">Values from RC lookup and this listing — document scans stay private</p>

          {!hasRtoFacts ? (
            <p className="text-sm text-slate2 bg-slate-50 rounded-xl p-4">
              Full RC record is not on file for this listing yet. Contact 4tyrezz for verified registration details.
            </p>
          ) : (
            <div className="space-y-1 -mx-1">
              <RtoSection
                title="Registration"
                rows={[
                  ['RC Number', rto.rcNumber],
                  ['RC Status', rto.rcStatus],
                  ['Registration Date', formatDetailDate(rto.registrationDate)],
                  ['Registering RTO', rto.rtoLocation],
                ]}
              />
              <RtoSection
                title="Insurance"
                rows={[
                  ['Insurance Type', car.insuranceType || rto.insuranceType],
                  ['Expiry Date', formatDetailDate(rto.insuranceExpiryDate)],
                  ['Insurance Company', rto.insuranceCompany],
                ]}
              />
              <RtoSection
                title="Vehicle"
                rows={[
                  ['Body Type', car.bodyType || rto.bodyType],
                  ['Engine (CC)', rto.engineCapacityCC || car.engineDisplacement],
                  ['Fuel Type', car.fuel || rto.fuel],
                  ['Colour', car.color || rto.color],
                  ['Interior', car.interiorColor],
                ]}
              />
              <RtoSection
                title="Compliance"
                rows={[
                  ['PUCC Valid Upto', formatDetailDate(rto.puccValidUpto)],
                  ['Fitness Valid Upto', formatDetailDate(rto.fitnessValidUpto)],
                ]}
              />
            </div>
          )}
        </ModalShell>
      )}

      {/* EMI Modal */}
      {showEmiModal && (
        <ModalShell onClose={() => setShowEmiModal(false)} wide={false}>
          <button type="button" onClick={() => setShowEmiModal(false)} className="absolute top-4 left-4 text-slate-600 font-bold">←</button>
          <div className="text-center mb-5 pt-2">
            <h3 className="text-xl font-bold text-ink">Loan breakup</h3>
            <div className="flex justify-center gap-2 mt-4">
              {['breakup', 'yearwise'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEmiModalTab(key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold ${emiModalTab === key ? 'bg-ink text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  {key === 'breakup' ? 'BREAKUP' : 'YEAR-WISE'}
                </button>
              ))}
            </div>
          </div>

          {emiModalTab === 'breakup' ? (
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3 text-sm">
              <div className="pb-3 border-b border-slate-200">
                <p className="text-xs text-slate2">Monthly EMI</p>
                <p className="text-2xl font-extrabold text-ink">{formatPrice(calculatedEmi)}</p>
                <p className="text-[11px] text-slate-400">@ {interestRate}% for {tenureYears} years</p>
              </div>
              <EmiRow label="Down payment" value={formatPrice(downPayment)} />
              <EmiRow label="Loan amount" value={formatPrice(currentLoan)} />
              <EmiRow label="Total interest" value={formatPrice(totalInterest)} />
              <EmiRow label="Total payable" value={formatPrice(downPayment + totalPayable)} bold />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-200">
                    <th className="pb-2">Tenure</th>
                    <th className="pb-2">Interest</th>
                    <th className="pb-2 text-right">EMI</th>
                  </tr>
                </thead>
                <tbody>
                  {[5, 4, 3, 2, 1].map((yr) => {
                    const mRate = interestRate / 12 / 100;
                    const mCount = yr * 12;
                    const emi = Math.round((currentLoan * mRate * Math.pow(1 + mRate, mCount)) / (Math.pow(1 + mRate, mCount) - 1));
                    const iAmt = Math.max(0, emi * mCount - currentLoan);
                    return (
                      <tr key={yr} className={`border-b border-slate-50 ${tenureYears === yr ? 'font-bold bg-white' : ''}`}>
                        <td className="py-2">{yr} yrs</td>
                        <td className="py-2">{formatPrice(iAmt)}</td>
                        <td className="py-2 text-right">{formatPrice(emi)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ModalShell>
      )}

      {/* Contact Modal */}
      {showContact && (
        <ModalShell onClose={() => setShowContact(false)} wide={false}>
          {sent ? (
            <>
              <h3 className="font-display text-xl font-bold text-ink">Message sent</h3>
              <p className="text-sm text-slate2 mt-2">4tyrezz will contact you shortly.</p>
              <button type="button" onClick={() => setShowContact(false)} className="w-full bg-ink text-white font-semibold py-2.5 rounded-xl mt-5">Close</button>
            </>
          ) : (
            <form onSubmit={submitContact} className="space-y-3">
              <h3 className="font-display text-xl font-bold text-ink">Contact 4tyrezz</h3>
              <input name="name" required placeholder="Your name" defaultValue={user?.name} className="w-full border border-white/30 bg-white/70 rounded-xl px-3.5 py-2.5 text-sm focus:border-ember focus:ring-2 focus:ring-ember/20 outline-none" />
              <input name="phone" required placeholder="Your phone" defaultValue={user?.mobile} className="w-full border border-white/30 bg-white/70 rounded-xl px-3.5 py-2.5 text-sm focus:border-ember focus:ring-2 focus:ring-ember/20 outline-none" />
              <input name="email" type="email" placeholder="Your email" defaultValue={user?.email} className="w-full border border-white/30 bg-white/70 rounded-xl px-3.5 py-2.5 text-sm focus:border-ember focus:ring-2 focus:ring-ember/20 outline-none" />
              <textarea name="message" rows="3" placeholder={`I'm interested in ${car.title}...`} className="w-full border border-white/30 bg-white/70 rounded-xl px-3.5 py-2.5 text-sm focus:border-ember focus:ring-2 focus:ring-ember/20 outline-none" />
              <button className="w-full bg-brand-gradient text-white font-semibold py-2.5 rounded-xl">Send message</button>
            </form>
          )}
        </ModalShell>
      )}

      {showTestDrive && (
        <ModalShell onClose={() => setShowTestDrive(false)} wide={false}>
          {driveSent ? (
            <>
              <h3 className="font-display text-xl font-bold text-ink">Test drive requested</h3>
              <p className="text-sm text-slate2 mt-2">4tyrezz will confirm a slot shortly.</p>
              <button type="button" onClick={() => setShowTestDrive(false)} className="w-full bg-ink text-white font-semibold py-2.5 rounded-xl mt-5">Close</button>
            </>
          ) : (
            <form onSubmit={submitTestDrive} className="space-y-3">
              <h3 className="font-display text-xl font-bold text-ink">{driveMode === 'home' ? 'Request home test drive' : 'Book test drive'}</h3>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setDriveMode('dealer')} className={`text-xs font-bold py-2 rounded-xl border ${driveMode === 'dealer' ? 'bg-ink text-white border-ink' : 'bg-white/70 border-white/30'}`}>At dealership</button>
                <button type="button" onClick={() => setDriveMode('home')} className={`text-xs font-bold py-2 rounded-xl border ${driveMode === 'home' ? 'bg-ink text-white border-ink' : 'bg-white/70 border-white/30'}`}>Home test drive</button>
              </div>
              {driveMode === 'dealer' && car.dealer?.address && (
                <p className="text-xs text-slate2 bg-white/60 border border-white/20 rounded-xl px-3 py-2">{car.dealer.address}</p>
              )}
              <input name="name" required placeholder="Your name" defaultValue={user?.name} className="w-full border border-white/30 bg-white/70 rounded-xl px-3.5 py-2.5 text-sm outline-none" />
              <input name="phone" required placeholder="Your phone" defaultValue={user?.mobile} className="w-full border border-white/30 bg-white/70 rounded-xl px-3.5 py-2.5 text-sm outline-none" />
              <input name="email" type="email" placeholder="Your email" defaultValue={user?.email} className="w-full border border-white/30 bg-white/70 rounded-xl px-3.5 py-2.5 text-sm outline-none" />
              <input name="date" type="date" required className="w-full border border-white/30 bg-white/70 rounded-xl px-3.5 py-2.5 text-sm outline-none" />
              <input name="time" type="time" required className="w-full border border-white/30 bg-white/70 rounded-xl px-3.5 py-2.5 text-sm outline-none" />
              {driveMode === 'home' && (
                <>
                  <textarea name="address" required rows="2" placeholder="Delivery address" className="w-full border border-white/30 bg-white/70 rounded-xl px-3.5 py-2.5 text-sm outline-none" />
                  <input name="dlNumber" required placeholder="Driving licence number" className="w-full border border-white/30 bg-white/70 rounded-xl px-3.5 py-2.5 text-sm outline-none uppercase" />
                </>
              )}
              <textarea name="message" rows="2" placeholder="Preferred location or notes" className="w-full border border-white/30 bg-white/70 rounded-xl px-3.5 py-2.5 text-sm outline-none" />
              <button className="w-full bg-brand-gradient text-white font-semibold py-2.5 rounded-xl">Request slot</button>
            </form>
          )}
        </ModalShell>
      )}

      {showReport && <ReportAdModal carId={id} onClose={() => setShowReport(false)} />}

      {showFinance && (
        <ModalShell onClose={() => setShowFinance(false)} wide={false}>
          <form onSubmit={submitFinance} className="space-y-3">
            <h3 className="font-display text-xl font-bold text-ink">Get finance</h3>
            <p className="text-sm text-slate2">Vehicle price {formatPrice(carPrice)} · suggested EMI {formatPrice(calculatedEmi)}/mo</p>
            <input name="name" required placeholder="Your name" defaultValue={user?.name} className="w-full border border-white/30 bg-white/70 rounded-xl px-3.5 py-2.5 text-sm outline-none" />
            <input name="phone" required placeholder="Your phone" defaultValue={user?.mobile} className="w-full border border-white/30 bg-white/70 rounded-xl px-3.5 py-2.5 text-sm outline-none" />
            <input name="email" type="email" placeholder="Your email" defaultValue={user?.email} className="w-full border border-white/30 bg-white/70 rounded-xl px-3.5 py-2.5 text-sm outline-none" />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/60 border border-white/20 rounded-xl p-3"><p className="text-slate2">Loan</p><p className="font-bold">{formatPrice(currentLoan)}</p></div>
              <div className="bg-white/60 border border-white/20 rounded-xl p-3"><p className="text-slate2">Down payment</p><p className="font-bold">{formatPrice(downPayment)}</p></div>
            </div>
            <button className="w-full bg-brand-gradient text-white font-semibold py-2.5 rounded-xl">Submit application</button>
          </form>
        </ModalShell>
      )}

      {showInsurance && (
        <ModalShell onClose={() => setShowInsurance(false)} wide={false}>
          <form onSubmit={submitInsurance} className="space-y-3">
            <h3 className="font-display text-xl font-bold text-ink">Request insurance</h3>
            <p className="text-sm text-slate2">Quote for {car.year} {car.brand?.name} {car.model?.name}</p>
            <input name="name" required placeholder="Your name" defaultValue={user?.name} className="w-full border border-white/30 bg-white/70 rounded-xl px-3.5 py-2.5 text-sm outline-none" />
            <input name="phone" required placeholder="Your phone" defaultValue={user?.mobile} className="w-full border border-white/30 bg-white/70 rounded-xl px-3.5 py-2.5 text-sm outline-none" />
            <input name="email" type="email" placeholder="Your email" defaultValue={user?.email} className="w-full border border-white/30 bg-white/70 rounded-xl px-3.5 py-2.5 text-sm outline-none" />
            <select name="cover" className="w-full border border-white/30 bg-white/70 rounded-xl px-3.5 py-2.5 text-sm outline-none">
              <option>Comprehensive</option>
              <option>Third Party</option>
              <option>Zero Depreciation</option>
            </select>
            <button className="w-full bg-brand-gradient text-white font-semibold py-2.5 rounded-xl">Request quote</button>
          </form>
        </ModalShell>
      )}

      {showBook && (
        <ModalShell onClose={() => setShowBook(false)} wide={false}>
          <h3 className="font-display text-xl font-bold text-ink">Book this vehicle</h3>
          <p className="text-sm text-slate2 mt-1">Pay a refundable token to reserve {car.title}.</p>
          <div className="grid grid-cols-2 gap-2 my-4">
            {TOKEN_CHOICES.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setTokenAmount(amt)}
                className={`py-3 rounded-xl border text-sm font-bold ${tokenAmount === amt ? 'bg-ink text-white border-ink' : 'bg-white/70 border-white/30'}`}
              >
                {formatPrice(amt)}
              </button>
            ))}
          </div>
          <button type="button" onClick={submitBooking} className="w-full bg-brand-gradient text-white font-semibold py-2.5 rounded-xl">
            Pay token {formatPrice(tokenAmount)}
          </button>
        </ModalShell>
      )}
    </div>
  );
}

function FinanceSection({
  carPrice, currentLoan, downPayment, calculatedEmi, tenureYears, interestRate,
  setLoanAmount, setTenureYears, setInterestRate, onViewBreakup, onApply,
}) {
  return (
    <section className="bg-white lg:bg-white/70 backdrop-blur-md border border-slate-100 lg:border-white/20 shadow-sm lg:shadow-[0_8px_24px_rgba(15,23,42,0.08)] rounded-2xl p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4 lg:mb-5 gap-2">
        <h3 className="text-[15px] lg:font-display lg:text-lg font-black lg:font-bold text-ink">Finance this car</h3>
        <span className="text-[10px] lg:text-xs font-bold bg-sky-50 text-sky-700 px-2.5 lg:px-3 py-1 rounded-full shrink-0">Up to 90% funded</span>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-ink text-white rounded-2xl p-5 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-300">Monthly EMI</p>
            <p className="text-3xl font-extrabold">{formatPrice(calculatedEmi)}</p>
            <p className="text-xs text-slate-400 mt-1">{tenureYears} yrs @ {interestRate}% p.a.</p>
          </div>
          <div className="border-t border-white/10 pt-3 space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-slate-300">Down payment</span><span className="font-bold">{formatPrice(downPayment)}</span></div>
            <div className="flex justify-between"><span className="text-slate-300">Loan amount</span><span className="font-bold">{formatPrice(currentLoan)}</span></div>
          </div>
          <input
            type="range"
            min={Math.round(carPrice * 0.2)}
            max={carPrice}
            step={10000}
            value={currentLoan}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            className="w-full accent-ember"
          />
        </div>
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
          <div>
            <p className="text-xs font-bold text-slate2 mb-2">Tenure</p>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setTenureYears(yr)}
                  className={`py-2 text-xs font-bold rounded-lg border ${tenureYears === yr ? 'bg-white border-ember text-ember' : 'border-slate-200 text-slate-600'}`}
                >
                  {yr}y
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate2 mb-2">Interest rate</p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setInterestRate((r) => Math.max(5, +(r - 0.5).toFixed(1)))} className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-bold">−</button>
              <span className="font-bold">{interestRate}%</span>
              <button type="button" onClick={() => setInterestRate((r) => +(r + 0.5).toFixed(1))} className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-bold">+</button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button type="button" onClick={onViewBreakup} className="w-full py-2.5 rounded-xl border border-white/30 bg-white/70 font-bold text-sm text-sky-700">View EMI breakup</button>
            <button type="button" onClick={onApply} className="w-full py-2.5 rounded-xl bg-ink text-white font-bold text-sm">Apply for finance</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function OverviewCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/60 backdrop-blur-md p-3.5">
      <p className="text-[11px] font-bold text-slate2 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold text-ink mt-1">{value}</p>
    </div>
  );
}

function SpecChip({ children, tone = 'neutral' }) {
  const tones = {
    good: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warn: 'bg-amber-50 text-amber-800 border-amber-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${tones[tone]}`}>
      {children}
    </span>
  );
}

function ModalShell({ children, onClose, wide = true }) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-ink/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white sm:bg-white/95 backdrop-blur-md border-0 sm:border border-white/20 rounded-t-3xl sm:rounded-2xl w-full ${wide ? 'sm:max-w-lg' : 'sm:max-w-md'} p-5 sm:p-6 shadow-[0_12px_40px_rgba(15,23,42,0.16)] relative max-h-[88vh] overflow-y-auto overflow-x-hidden pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-0.5 pb-3">
          <span className="h-1.5 w-10 rounded-full bg-slate-300" />
        </div>
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-ink font-bold w-8 h-8 flex items-center justify-center" aria-label="Close">✕</button>
        {children}
      </div>
    </div>
  );
}

function ModalSection({ title, children }) {
  return (
    <div className="mb-5">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function formatDetailDate(value) {
  if (!value && value !== 0) return '';
  const s = String(value).trim();
  if (!s || /^01-Jan-\d{4}$/i.test(s)) return '';
  const parsed = Date.parse(s);
  if (!Number.isNaN(parsed) && /\d{4}/.test(s)) {
    return new Date(parsed).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return s;
}

function RtoSection({ title, rows }) {
  const visible = (rows || []).filter(([, value]) => value || value === 0);
  if (!visible.length) return null;
  return (
    <ModalSection title={title}>
      {visible.map(([label, value]) => (
        <RTORow key={label} label={label} value={value} />
      ))}
    </ModalSection>
  );
}

function RTORow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between gap-3 py-2.5 border-b border-slate-100 text-sm min-w-0">
      <span className="text-slate2 shrink-0">{label}</span>
      <span className="font-semibold text-ink text-right break-words min-w-0">{value}</span>
    </div>
  );
}

function EmiRow({ label, value, bold }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-bold text-ink pt-2 border-t border-slate-200' : ''}`}>
      <span className="text-slate2">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function CarSkeleton() {
  return (
    <div className="grid lg:grid-cols-[1.55fr_1fr] gap-8">
      <div className="h-[420px] skeleton rounded-2xl" />
      <div className="h-72 skeleton rounded-2xl" />
    </div>
  );
}
