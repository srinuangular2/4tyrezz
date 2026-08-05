import React, { useState, useEffect } from 'react';

// ==========================================
// UNIFIED CORPORATE PAGE SHELL
// ==========================================
function PageShell({ title, subtitle, badge, children }) {
  return (
    <div className="bg-slate-50/60 min-h-screen py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Hero Section */}
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#fe0100]/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            {badge && (
              <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-extrabold bg-[#fe0100] text-white tracking-widest uppercase">
                {badge}
              </span>
            )}
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-slate-300 text-sm sm:text-base font-normal leading-relaxed max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Dynamic Body Content */}
        <div className="space-y-10 text-slate-700 text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// DEALERS MULTI-ITEM SLIDER COMPONENT
// ==========================================
const DealerSlider = () => {
  const dealers = [
    { name: "Metro Auto Hub", city: "Hyderabad", inventory: "42 Vehicles", rating: "4.9 ★", badge: "Premium Partner" },
    { name: "Apex Pre-Owned Cars", city: "Bangalore", inventory: "38 Vehicles", rating: "4.8 ★", badge: "Verified Dealer" },
    { name: "Royal Motor World", city: "Mumbai", inventory: "55 Vehicles", rating: "4.9 ★", badge: "Platinum Partner" },
    { name: "Deccan Wheels & Co.", city: "Secunderabad", inventory: "29 Vehicles", rating: "4.7 ★", badge: "Verified Dealer" },
    { name: "Speedway Automobiles", city: "Chennai", inventory: "34 Vehicles", rating: "4.8 ★", badge: "Verified Dealer" },
    { name: "Elite Car Studio", city: "Pune", inventory: "23 Vehicles", rating: "4.9 ★", badge: "Premium Partner" },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % (dealers.length - 2));
    }, 4000);
    return () => clearInterval(timer);
  }, [dealers.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, dealers.length - 3));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#fe0100] font-black text-xs uppercase tracking-wider">
            <span>Verified Partners</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Featured Commercial Dealer Network
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center font-black text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
          >
            ←
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex >= dealers.length - 3}
            className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center font-black text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
          >
            →
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl py-2">
        <div
          className="flex gap-5 transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * (100 / 3 + 1.2)}%)` }}
        >
          {dealers.map((dealer, idx) => (
            <div
              key={idx}
              className="min-w-[85%] sm:min-w-[45%] md:min-w-[31%] bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#fe0100]/50 transition shrink-0"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                    {dealer.badge}
                  </span>
                  <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md">
                    {dealer.rating}
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base leading-snug">{dealer.name}</h4>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">{dealer.city}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">{dealer.inventory}</span>
                <span className="font-black text-[#fe0100] hover:underline cursor-pointer">
                  View Showroom →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 1. ABOUT US PAGE
// ==========================================
export const About = () => {
  const teamMembers = [
    {
      name: "Suresh Kumar",
      role: "Founder & Technology Director",
      dept: "Webteksoft IT Solutions",
      bio: "Oversees core software development, database design, and real-time backend infrastructure for 4tyrezz.",
      avatar: "SK"
    },
    {
      name: "Rajesh Varma",
      role: "Head of Technical Inspection",
      dept: "Quality Operations",
      bio: "Leads field inspection teams across regional hubs, ensuring adherence to the 15-point mechanical scorecard.",
      avatar: "RV"
    },
    {
      name: "Ananya Reddy",
      role: "Dealer Relations Manager",
      dept: "Business Development",
      bio: "Manages partner dealer onboarding, credentials verification, and B2C / C2B auction operations.",
      avatar: "AR"
    },
    {
      name: "Vikram Sharma",
      role: "Lead Frontend Engineer",
      dept: "Engineering",
      bio: "Focuses on user-facing React web applications, single-use OTP security logic, and smooth buyer UI.",
      avatar: "VS"
    }
  ];

  return (
    <PageShell
      badge="About 4tyrezz"
      title="Redefining Trust in Pre-Owned Automotive Commerce"
      subtitle="Engineered to provide physical transparency, empirical vehicle evaluation, and seamless transactions for buyers, sellers, and dealer networks."
    >
      {/* 1. ABOUT COMPANY OVERVIEW */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-[#fe0100] font-black text-xs uppercase tracking-wider">
          <span>01</span>
          <span>—</span>
          <span>Company Overview</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          A Transparent Ecosystem Built Tyre-to-Tyre
        </h2>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          4tyrezz is an automotive marketplace platform designed to eradicate information asymmetry in the pre-owned vehicle market. Engineered and operated by Webteksoft IT solutions, 4tyrezz connects individual car owners, prospective buyers, and verified commercial dealers.
        </p>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Whether facilitating Customer-to-Customer (C2C) private sales, Dealer-to-Customer (B2C) showroom inventory, or Customer-to-Dealer (C2B) instant liquidations, every listing on 4tyrezz is verified through a physical 15-point inspection before appearing on the portal.
        </p>
      </div>

      {/* 2. MISSION & VISION */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs space-y-3 relative overflow-hidden">
          <div className="w-12 h-12 bg-[#fe0100]/10 text-[#fe0100] rounded-2xl flex items-center justify-center font-black text-xl mb-4">
            🎯
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">Our Mission</h3>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            To empower vehicle buyers and sellers with objective inspection data, complete phone privacy controls, and direct channel negotiations—eliminating undisclosed mechanical risks and unearned middleman markups.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs space-y-3 relative overflow-hidden">
          <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl mb-4">
            👁️
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">Our Vision</h3>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            To establish 4tyrezz as India's premier standard for verified pre-owned car transactions, expanding digital inspection infrastructure across regional dealer networks and retail hubs.
          </p>
        </div>
      </div>

      {/* 3. WHY CHOOSE 4TYREZZ */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#fe0100] font-black text-xs uppercase tracking-wider">
            <span>02</span>
            <span>—</span>
            <span>Key Differentiators</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Why Choose 4tyrezz?
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2 border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
            <span className="font-black text-[#fe0100] text-lg">01. 15-Point Check</span>
            <h4 className="font-extrabold text-slate-900 text-sm">Empirical Evaluation</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every vehicle undergoes physical evaluations covering engine health, frame structural integrity, braking, and RC documentation.
            </p>
          </div>

          <div className="space-y-2 border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
            <span className="font-black text-[#fe0100] text-lg">02. Triple Trade Model</span>
            <h4 className="font-extrabold text-slate-900 text-sm">C2C, B2C & C2B</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Flexible transaction routes allowing buyers to purchase directly from private owners or verified dealer inventory.
            </p>
          </div>

          <div className="space-y-2 border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
            <span className="font-black text-[#fe0100] text-lg">03. Shielded Privacy</span>
            <h4 className="font-extrabold text-slate-900 text-sm">Masked Contact Info</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Phone numbers remain private. Contact details are shared only when you explicitly approve a connection request.
            </p>
          </div>

          <div className="space-y-2 border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
            <span className="font-black text-[#fe0100] text-lg">04. Dedicated Portals</span>
            <h4 className="font-extrabold text-slate-900 text-sm">Pro Dealer Dashboards</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Commercial dealers get separate, secured portal credentials to manage stock, post bids, and handle client inquiries.
            </p>
          </div>
        </div>
      </div>

      {/* 4. MULTI-ITEM DEALERS SLIDER */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xs">
        <DealerSlider />
      </div>

      {/* 5. TEAM DETAILS */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#fe0100] font-black text-xs uppercase tracking-wider">
            <span>03</span>
            <span>—</span>
            <span>Leadership & Key Personnel</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Meet Our Leadership Team
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member, i) => (
            <div key={i} className="border border-slate-200/80 rounded-2xl p-5 text-center space-y-3 bg-white hover:shadow-md transition">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl mx-auto flex items-center justify-center font-black text-lg shadow-sm">
                {member.avatar}
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">{member.name}</h4>
                <p className="text-xs font-bold text-[#fe0100] mt-0.5">{member.role}</p>
                <p className="text-[11px] font-semibold text-slate-400">{member.dept}</p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed pt-1 border-t border-slate-100">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
};

// ==========================================
// 2. CONTACT US PAGE
// ==========================================
export const Contact = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <PageShell
      badge="Contact Desk"
      title="How Can We Help You Today?"
      subtitle="Reach out to our operations team for technical support, inspection schedules, or dealer portal onboarding."
    >
      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2 shadow-xs">
            <span className="text-[10px] font-black uppercase text-[#fe0100] tracking-wider block">Direct Telephone</span>
            <a href="tel:9160415851" className="font-black text-slate-900 text-base block hover:text-[#fe0100] transition">
              +91 9160415851
            </a>
            <p className="text-xs text-slate-500">Operating hours: Mon – Sat (9:00 AM – 7:00 PM IST)</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2 shadow-xs">
            <span className="text-[10px] font-black uppercase text-[#fe0100] tracking-wider block">Official Email</span>
            <a href="mailto:info@webteksoft.com" className="font-black text-slate-900 text-sm block hover:text-[#fe0100] transition">
              info@webteksoft.com
            </a>
            <p className="text-xs text-slate-500">Inquiries processed within 24 business hours.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2 shadow-xs">
            <span className="text-[10px] font-black uppercase text-[#fe0100] tracking-wider block">Technical Division</span>
            <p className="font-bold text-slate-900 text-xs">Webteksoft IT Solutions</p>
            <p className="text-xs text-slate-500">Infrastructure & platform engineering headquarters.</p>
          </div>
        </div>

        <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs">
          {submitted ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 bg-[#fe0100] text-white rounded-full flex items-center justify-center font-bold mx-auto text-xl">✓</div>
              <h3 className="font-black text-slate-900 text-lg">Message Submitted</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Thank you for contacting 4tyrezz. A customer support representative will evaluate your request and respond shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">Send an Official Message</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input required type="text" placeholder="Your name" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#fe0100]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input required type="tel" placeholder="10-digit number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#fe0100]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input required type="email" placeholder="you@domain.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#fe0100]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Inquiry Topic *</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#fe0100]">
                  <option>15-Point Inspection Schedule</option>
                  <option>Dealer Partnership / Portal Access</option>
                  <option>Listing & Phone Privacy Inquiry</option>
                  <option>General Support</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Details *</label>
                <textarea required rows="4" placeholder="Describe your inquiry..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#fe0100]"></textarea>
              </div>
              <button type="submit" className="w-full bg-[#fe0100] text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl hover:brightness-95 transition cursor-pointer">
                Submit Inquiry
              </button>
            </form>
          )}
        </div>
      </div>
    </PageShell>
  );
};

// ==========================================
// 3. FAQS PAGE
// ==========================================
export const FAQs = () => {
  const categories = [
    {
      cat: "Inspections & Quality Verification",
      items: [
        ["What is covered in the 15-point inspection?", "Our technicians evaluate engine performance, transmission feedback, braking wear, suspension response, frame structural integrity, tire tread, AC efficiency, electrical diagnostics, battery life, fluid levels, paint gauge readings, steering alignment, exhaust checks, interior condition, and RC/insurance authenticity."],
        ["Can a car be listed without an inspection?", "No. Physical evaluation by a 4tyrezz technician is required before a listing goes live to protect buyers."]
      ]
    },
    {
      cat: "Buying, Selling & Contact Privacy",
      items: [
        ["How is my mobile number protected?", "Your number is hidden behind platform encryption and is only shared with another user when you explicitly approve a connection request."],
        ["What is the difference between C2C, B2C, and C2B?", "C2C is owner-to-buyer direct sales. B2C allows commercial dealers to list pre-inspected inventory. C2B enables car owners to receive direct trade-in offers from verified dealers."]
      ]
    },
    {
      cat: "Commercial Dealer Portal",
      items: [
        ["How do dealers access their portal?", "Dealers use dedicated portal credentials separate from single-use OTP consumer logins to manage inventory, bidding, and customer responses."],
        ["What documents are needed for dealer registration?", "Dealers must submit business trade certificates, GST identification, and owner credentials for platform approval."]
      ]
    }
  ];

  return (
    <PageShell
      badge="Knowledge Base"
      title="Frequently Asked Questions"
      subtitle="Find answers to common questions regarding vehicle listings, inspection procedures, and dealer credentials."
    >
      <div className="space-y-8">
        {categories.map((group) => (
          <div key={group.cat} className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 px-1">{group.cat}</h3>
            {group.items.map(([q, a]) => (
              <details key={q} className="bg-white border border-slate-200 rounded-2xl p-5 group cursor-pointer shadow-xs [&_summary::-webkit-details-marker]:none">
                <summary className="font-bold text-slate-900 flex justify-between items-center text-sm">
                  <span>{q}</span>
                  <span className="w-6 h-6 rounded-full bg-slate-100 group-open:bg-[#fe0100] group-open:text-white flex items-center justify-center text-slate-600 font-bold text-xs transition shrink-0 ml-2">
                    +
                  </span>
                </summary>
                <p className="text-xs sm:text-sm text-slate-600 mt-3 pt-3 border-t border-slate-100 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        ))}
      </div>
    </PageShell>
  );
};

// ==========================================
// 4. CAREERS WITH US PAGE
// ==========================================
export const Careers = () => (
  <PageShell
    badge="Careers"
    title="Build the Future of Vehicle Verification"
    subtitle="Join our engineering, technical inspection, and dealer relationship teams."
  >
    <div className="grid sm:grid-cols-3 gap-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
        <span className="font-extrabold text-slate-900 text-sm block">Technical Growth</span>
        <span className="text-xs text-slate-500">Modern technology stacks and operations.</span>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
        <span className="font-extrabold text-slate-900 text-sm block">Market Competitive Pay</span>
        <span className="text-xs text-slate-500">Structured salary and performance bonuses.</span>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
        <span className="font-extrabold text-slate-900 text-sm block">Collaborative Environment</span>
        <span className="text-xs text-slate-500">Direct impact across software and field operations.</span>
      </div>
    </div>

    <div className="space-y-4">
      <h3 className="text-base font-extrabold text-slate-900 px-1">Current Openings</h3>
      {[
        { role: 'Field Vehicle Inspector', dept: 'Operations', loc: 'Multi-City / On-Site', desc: 'Perform physical 15-point evaluations on pre-owned cars and publish verification scorecards.' },
        { role: 'Frontend React Developer', dept: 'Engineering', loc: 'Hybrid / Remote', desc: 'Develop responsive frontend web applications using React, Tailwind CSS, and REST/WebSocket APIs.' },
        { role: 'Dealer Relations Manager', dept: 'Business Development', loc: 'Regional Office', desc: 'Onboard commercial automotive dealers, oversee inventory portal integration, and maintain platform standards.' },
      ].map((job) => (
        <div key={job.role} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <h4 className="font-extrabold text-slate-900 text-base">{job.role}</h4>
            <div className="flex items-center gap-2 text-xs font-bold text-[#fe0100]">
              <span>{job.dept}</span>
              <span>•</span>
              <span>{job.loc}</span>
            </div>
            <p className="text-xs text-slate-500 pt-1 max-w-xl">{job.desc}</p>
          </div>
          <a
            href={`mailto:info@webteksoft.com?subject=Application for ${job.role}`}
            className="inline-flex items-center justify-center bg-[#fe0100] text-white font-bold text-xs px-5 py-3 rounded-xl hover:brightness-95 transition shrink-0"
          >
            Apply via Email
          </a>
        </div>
      ))}
    </div>
  </PageShell>
);

// ==========================================
// 5. TERMS & CONDITIONS PAGE
// ==========================================
export const Terms = () => (
  <PageShell
    badge="Legal Terms"
    title="Terms and Conditions of Operating"
    subtitle="Operating conditions, platform governance, and user responsibilities for the 4tyrezz marketplace."
  >
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 space-y-8 shadow-xs">
      <section className="space-y-2">
        <h3 className="text-base font-extrabold text-slate-900">1. User Verification & Account Terms</h3>
        <p className="text-xs sm:text-sm text-slate-600">
          Consumer access relies on verified single-use OTP validation linked to registered Indian phone numbers. Users must provide accurate vehicle identification numbers (VIN), registration certificates (RC), and seller details.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-extrabold text-slate-900">2. 15-Point Inspection Advisory Scope</h3>
        <p className="text-xs sm:text-sm text-slate-600">
          The 15-point vehicle check is an empirical evaluation performed by 4tyrezz field inspectors at the time of review. The report serves as an advisory evaluation and does not constitute a perpetual mechanical warranty or guarantee.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-extrabold text-slate-900">3. Commercial Dealer Obligations</h3>
        <p className="text-xs sm:text-sm text-slate-600">
          Commercial dealers receive separate administrative dashboard access. Dealers must maintain valid trade licenses, honor binding purchase quotes submitted through the C2B module, and observe platform policies.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-extrabold text-slate-900">4. Misuse & Account Delisting</h3>
        <p className="text-xs sm:text-sm text-slate-600">
          4tyrezz reserves the right to immediately suspend or restrict accounts engaged in odometer rollback, forged registration documents, or unauthorized contact harvesting.
        </p>
      </section>
    </div>
  </PageShell>
);

// ==========================================
// 6. PRIVACY POLICY PAGE
// ==========================================
export const Privacy = () => (
  <PageShell
    badge="Privacy Policy"
    title="Data Protection and Privacy Policy"
    subtitle="Standards regarding personal data collection, contact shielding, and security protocols."
  >
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 space-y-8 shadow-xs">
      <section className="space-y-2">
        <h3 className="text-base font-extrabold text-slate-900">1. Data Collection Standards</h3>
        <p className="text-xs sm:text-sm text-slate-600">
          We collect personal phone numbers for OTP authentication, vehicle registration details, listing photos, and technical inspection reports necessary to facilitate vehicle buying and selling.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-extrabold text-slate-900">2. Phone Number Confidentiality</h3>
        <p className="text-xs sm:text-sm text-slate-600">
          Mobile numbers remain masked on public listings. Your phone number is only disclosed to another verified user when an explicit contact request is submitted and authorized.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-extrabold text-slate-900">3. Support & Inquiry Logs</h3>
        <p className="text-xs sm:text-sm text-slate-600">
          Communications submitted via telephone (+91 9160415851) or email (info@webteksoft.com) are maintained securely within Webteksoft administrative systems to handle support cases.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-extrabold text-slate-900">4. Third-Party Sharing Rules</h3>
        <p className="text-xs sm:text-sm text-slate-600">
          We do not sell, rent, or distribute consumer contact information to third-party telemarketing databases or unverified commercial buyers.
        </p>
      </section>
    </div>
  </PageShell>
);

// ==========================================
// 7. CORPORATE POLICIES PAGE
// ==========================================
export const CorporatePolicies = () => (
  <PageShell
    badge="Governance"
    title="Corporate Policies & Integrity Mandates"
    subtitle="Operational governance, anti-fraud rules, and technical oversight standards."
  >
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 space-y-8 shadow-xs">
      <section className="space-y-2">
        <h3 className="text-base font-extrabold text-slate-900">1. Anti-Fraud & Vehicle Tampering Mandate</h3>
        <p className="text-xs sm:text-sm text-slate-600">
          4tyrezz maintains a zero-tolerance policy regarding odometer tampering, concealed structural damage, or forged vehicle papers. Vehicles violating these rules are permanently delisted.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-extrabold text-slate-900">2. Dealer Onboarding Standards</h3>
        <p className="text-xs sm:text-sm text-slate-600">
          Commercial automotive entities operating within the B2C or C2B channels must undergo identity and business verification to confirm clear legal titles and transparent transaction processing.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-extrabold text-slate-900">3. Infrastructure & Platform Governance</h3>
        <p className="text-xs sm:text-sm text-slate-600">
          Webteksoft IT solutions manages and maintains all platform architecture, cloud server security, software updates, and database safety for 4tyrezz.
        </p>
      </section>
    </div>
  </PageShell>
);

// ==========================================
// 8. BLOG PAGE
// ==========================================
export const Blog = () => (
  <PageShell
    badge="Automotive Journal"
    title="4tyrezz Insights & Buying Guides"
    subtitle="Automotive inspection tips, used car evaluations, and market analysis."
  >
    <div className="grid md:grid-cols-3 gap-6">
      {[
        {
          title: "5 Key Mechanical Areas to Check Before Purchasing a Used SUV",
          tag: "Inspection Guide",
          time: "5 min read",
          desc: "A breakdown of suspension wear, transmission checks, and structural rust evaluation."
        },
        {
          title: "How the 15-Point Inspection Verification Works On-Site",
          tag: "Quality Control",
          time: "6 min read",
          desc: "An inside look at how field technicians perform physical checks before approving a car listing."
        },
        {
          title: "Direct Retail Sale vs. Selling to a Dealer (C2C vs. C2B)",
          tag: "Sellers Guide",
          time: "4 min read",
          desc: "Comparing private buyer sales timelines against dealer liquidation options."
        }
      ].map((post, index) => (
        <div key={index} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-[#fe0100]/40 transition">
          <div className="space-y-3">
            <div className="h-36 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-400 text-xs">
              Automotive Guide Cover
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-[#fe0100] uppercase tracking-wider">{post.tag}</span>
              <span className="text-slate-400">{post.time}</span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{post.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{post.desc}</p>
          </div>
          <button className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-slate-900 text-left hover:text-[#fe0100] transition">
            Read Full Article →
          </button>
        </div>
      ))}
    </div>
  </PageShell>
);