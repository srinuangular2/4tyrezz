import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Clock, Mail, MapPin, MessageCircle, Phone, PhoneOff, ShieldCheck, Users } from 'lucide-react';
import api from '../api/axios';
import DesignedPageBanner, { BannerActions, BannerButton } from '../components/DesignedPageBanner';
import { Card, Field, PrimaryButton, Section, inputClass } from '../components/PageShell';
import { COMPANY_PHONE_DISPLAY, COMPANY_PHONE_DIGITS, digitsOnly, isIndianMobile, whatsappUrl } from '../lib/companyContact';

// ==========================================
// UNIFIED CORPORATE PAGE SHELL
// ==========================================
function PageShell({ title, subtitle, badge, children }) {
  return (
    <div className="bg-slate-50/60 min-h-screen py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Hero Section */}
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#3083ff]/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            {badge && (
              <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-extrabold bg-[#3083ff] text-white tracking-widest uppercase">
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

const CompanyInventoryCard = () => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
    <div className="space-y-2 max-w-2xl">
      <p className="text-[#3083ff] font-black text-xs uppercase tracking-wider">Listed by 4tyrezz</p>
      <h2 className="text-xl sm:text-2xl font-black text-slate-900">Every car is sold through 4tyrezz</h2>
      <p className="text-sm text-slate-500 font-medium leading-relaxed">
        Partners upload inventory. 4tyrezz inspects, publishes and handles every buyer conversation — you never see a dealer name or number.
      </p>
    </div>
    <Link
      to="/cars"
      className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#3083ff] text-white text-xs font-black uppercase tracking-wider shrink-0"
    >
      Browse cars
    </Link>
  </div>
);

// ==========================================
// 1. ABOUT US PAGE
// ==========================================
export const About = () => {
  const teamMembers = [
    {
      name: 'Suresh Kumar',
      role: 'Founder & Technology Director',
      dept: 'Webteksoft IT Solutions',
      bio: 'Oversees core software development, database design, and real-time backend infrastructure for 4tyrezz.',
      avatar: 'SK',
    },
    {
      name: 'Rajesh Varma',
      role: 'Head of Technical Inspection',
      dept: 'Quality Operations',
      bio: 'Leads field inspection teams across regional hubs, ensuring adherence to the 15-point mechanical scorecard.',
      avatar: 'RV',
    },
    {
      name: 'Ananya Reddy',
      role: 'Dealer Relations Manager',
      dept: 'Business Development',
      bio: 'Manages partner dealer onboarding, credentials verification, and inventory quality standards.',
      avatar: 'AR',
    },
    {
      name: 'Vikram Sharma',
      role: 'Lead Frontend Engineer',
      dept: 'Engineering',
      bio: 'Focuses on user-facing React web applications, single-use OTP security logic, and a smooth buyer UI.',
      avatar: 'VS',
    },
  ];

  return (
    <div className="bg-slate-50">
      <DesignedPageBanner
        src="/about-us.png"
        alt="About 4tyrezz"
        eyebrow="About 4tyrezz"
        title="Redefining trust in"
        accent="used cars"
        subtitle="Physical inspection, clear asking prices, and one buying desk. Partners upload inventory — 4tyrezz inspects, publishes and sells."
        points={[
          { icon: ShieldCheck, label: '15-point inspection' },
          { icon: BadgeCheck, label: 'Verified papers' },
          { icon: PhoneOff, label: 'Talk to 4tyrezz' },
          { icon: Users, label: 'One buying desk' },
        ]}
      >
        <BannerActions>
          <BannerButton to="/cars">Browse inspected cars</BannerButton>
          <BannerButton to="/contact" ghost>Talk to us</BannerButton>
        </BannerActions>
      </DesignedPageBanner>

      <Section eyebrow="At a glance" title="Built for trusted used-car buying">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: ShieldCheck, label: '15-point inspection', hint: 'Every live listing is physically checked' },
            { icon: BadgeCheck, label: 'Verified papers', hint: 'RC, insurance and odometer reviewed' },
            { icon: Users, label: 'One buying desk', hint: 'You talk to 4tyrezz, not random sellers' },
            { icon: MapPin, label: 'Hyderabad first', hint: 'Doorstep test drives across the city' },
          ].map(({ icon: Icon, label, hint }) => (
            <Card key={label} className="p-5 flex gap-4">
              <span className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" strokeWidth={2.25} />
              </span>
              <div>
                <h3 className="font-black text-slate-900 text-sm">{label}</h3>
                <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">{hint}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="Who we are" title="A transparent used-car marketplace" bg>
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <Card className="p-6 sm:p-8 space-y-4">
            <p className="text-slate-600 text-sm leading-relaxed">
              4tyrezz is a verified pre-owned car marketplace operated by Webteksoft IT Solutions. Partners upload inventory.
              Our team inspects each car, publishes the listing, and handles every buyer enquiry, test drive and payment.
            </p>
            <p className="text-slate-600 text-sm leading-relaxed">
              That means you get inspected stock and a clear asking price — without dealer names, phone numbers or
              unsolicited calls. Finance, insurance and offers sit on the same desk, so the purchase is one conversation.
            </p>
          </Card>
          <Card className="p-6 sm:p-8 space-y-4">
            <h3 className="font-black text-slate-900 text-base">How a purchase works</h3>
            {[
              ['01', 'Browse inspected cars'],
              ['02', 'Call or WhatsApp 4tyrezz'],
              ['03', 'Test drive, finance & close'],
            ].map(([n, label]) => (
              <div key={n} className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#3083ff] text-white text-[11px] font-black flex items-center justify-center shrink-0">
                  {n}
                </span>
                <p className="text-sm font-bold text-slate-800">{label}</p>
              </div>
            ))}
          </Card>
        </div>
      </Section>

      <Section eyebrow="Purpose" title="Mission and vision">
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-8 space-y-3">
            <h3 className="text-xl font-extrabold text-slate-900">Our mission</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Give buyers objective inspection data, fair pricing and a single trusted desk — so mechanical risk and
              middleman markups stay off the table.
            </p>
          </Card>
          <Card className="p-8 space-y-3">
            <h3 className="text-xl font-extrabold text-slate-900">Our vision</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Make 4tyrezz the standard for verified used-car transactions in India, starting in Hyderabad and expanding
              through inspected partner inventory.
            </p>
          </Card>
        </div>
      </Section>

      <Section eyebrow="Why 4tyrezz" title="What sets us apart" bg>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            ['15-point check', 'Engine, chassis, brakes, tyres, electrics and RC are scored before a car goes live.'],
            ['Partner inventory', 'Verified dealers upload cars. 4tyrezz approves listings and owns the buyer relationship.'],
            ['Private buying', 'No public seller numbers. Call or WhatsApp 4tyrezz to enquire, book a drive or close.'],
            ['Finance & cover', 'Loan and insurance paperwork sit next to the car — one team, one timeline.'],
          ].map(([title, body], i) => (
            <Card key={title} className="p-6 space-y-2">
              <span className="font-black text-[#3083ff] text-xs uppercase tracking-wider">0{i + 1}</span>
              <h4 className="font-extrabold text-slate-900 text-sm">{title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="Vs the market" title="How we compare">
        <Card className="overflow-x-auto p-0" hover={false}>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-5 py-4 font-black text-xs uppercase tracking-wider">What you get</th>
                <th className="px-5 py-4 font-black text-xs uppercase tracking-wider text-white/60">Classifieds</th>
                <th className="px-5 py-4 font-black text-xs uppercase tracking-wider text-white/60">Typical dealer</th>
                <th className="px-5 py-4 font-black text-xs uppercase tracking-wider text-[#7ec4ff]">4tyrezz</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ['Who you talk to', 'Random sellers', 'Showroom staff', 'One 4tyrezz desk'],
                ['Inspection', 'Your own risk', 'Varies by yard', '15-point check before live'],
                ['Phone privacy', 'Number often public', 'Sales follow-ups', 'No dealer numbers shown'],
                ['Price', 'Guesswork', 'Opaque markup', 'Clear asking price'],
                ['Finance & insurance', 'You arrange it', 'In-house, mixed', 'Same desk as the car'],
                ['Payment', 'Peer-to-peer risk', 'Dealer collects', 'Pay 4tyrezz, we settle partners'],
              ].map(([item, a, b, c]) => (
                <tr key={item} className="bg-white">
                  <td className="px-5 py-3.5 font-extrabold text-slate-900">{item}</td>
                  <td className="px-5 py-3.5 text-slate-500">{a}</td>
                  <td className="px-5 py-3.5 text-slate-500">{b}</td>
                  <td className="px-5 py-3.5 font-bold text-[#1853ff]">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>

      <Section eyebrow="Inspection" title="What we check" bg>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            'Engine & gearbox',
            'Chassis & accident history',
            'Brakes & suspension',
            'Tyres & alignment',
            'Electricals & battery',
            'AC & interiors',
            'Paint & panels',
            'Odometer authenticity',
            'RC, insurance & hypothecation',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5 rounded-xl bg-white border border-slate-200 px-4 py-3">
              <BadgeCheck className="w-4 h-4 text-[#3083ff] shrink-0" strokeWidth={2.5} />
              <span className="text-sm font-bold text-slate-700">{item}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <Card className="p-6 sm:p-10" hover={false}>
          <CompanyInventoryCard />
        </Card>
      </Section>

      <Section eyebrow="People" title="Leadership team" bg>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {teamMembers.map((member) => (
            <Card key={member.name} className="p-6 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl mx-auto flex items-center justify-center font-black text-lg">
                {member.avatar}
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">{member.name}</h4>
                <p className="text-xs font-bold text-[#3083ff] mt-0.5">{member.role}</p>
                <p className="text-[11px] font-semibold text-slate-400">{member.dept}</p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed pt-3 border-t border-slate-100">{member.bio}</p>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
};

// ==========================================
// 2. CONTACT US PAGE
// ==========================================
export const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', category: 'listing', message: '', callback: 'anytime' });
  const [error, setError] = useState('');
  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!isIndianMobile(form.phone)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/support', {
        name: form.name,
        phone: form.phone,
        email: form.email,
        category: form.category,
        subject: `Contact: ${form.category}`,
        message: `${form.message}\n\nPreferred callback: ${form.callback}`,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit');
    } finally {
      setSubmitting(false);
    }
  };

  const channels = [
    {
      icon: Phone,
      label: 'Call us',
      value: COMPANY_PHONE_DISPLAY,
      hint: 'Mon – Sat, 9:00 AM – 7:00 PM IST',
      href: `tel:+91${COMPANY_PHONE_DIGITS}`,
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      value: COMPANY_PHONE_DISPLAY,
      hint: 'Fastest way to enquire on a car',
      href: whatsappUrl('Hi 4tyrezz, I need help with a used car.'),
    },
    {
      icon: Mail,
      label: 'Email',
      value: 'support@4tyrezz.com',
      hint: 'We reply within one business day',
      href: 'mailto:support@4tyrezz.com',
    },
    {
      icon: MapPin,
      label: 'Visit',
      value: 'Hyderabad, Telangana',
      hint: 'Test drives by appointment',
      href: '/cars',
    },
  ];

  const topics = [
    { id: 'listing', label: 'Buying a car' },
    { id: 'payment', label: 'Payment' },
    { id: 'general', label: 'General' },
    { id: 'kyc', label: 'Dealer partner' },
    { id: 'technical', label: 'Technical' },
    { id: 'complaint', label: 'Complaint' },
  ];

  return (
    <div className="bg-slate-50">
      <DesignedPageBanner
        src="/contact-us.png"
        alt="Contact 4tyrezz"
        eyebrow="Contact Desk"
        title="How can we help"
        accent="you today?"
        subtitle="Reach the 4tyrezz operations desk for a listing, test drive, finance, insurance or dealer onboarding. You always talk to us — never a random seller."
        points={[
          { icon: Phone, label: 'Call the desk' },
          { icon: MessageCircle, label: 'WhatsApp us' },
          { icon: Mail, label: 'Email support' },
          { icon: Clock, label: 'Mon–Sat, 9–7 IST' },
        ]}
      >
        <BannerActions>
          <BannerButton href={`tel:+91${COMPANY_PHONE_DIGITS}`}>Call {COMPANY_PHONE_DISPLAY}</BannerButton>
          <BannerButton href={whatsappUrl('Hi 4tyrezz, I need help with a used car.')} ghost>
            WhatsApp
          </BannerButton>
        </BannerActions>
      </DesignedPageBanner>

      <Section eyebrow="Reach us" title="Talk to the 4tyrezz desk">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {channels.map(({ icon: Icon, label, value, hint, href }) => {
            const Tag = href.startsWith('/') ? Link : 'a';
            const props = href.startsWith('/') ? { to: href } : { href, ...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {}) };
            return (
              <Tag key={label} {...props} className="block">
                <Card className="p-5 h-full">
                  <span className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                    <Icon className="w-5 h-5" strokeWidth={2.25} />
                  </span>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#3083ff] mt-4">{label}</p>
                  <p className="font-black text-slate-900 text-sm mt-1">{value}</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">{hint}</p>
                </Card>
              </Tag>
            );
          })}
        </div>
      </Section>

      <Section eyebrow="Write to us" title="Send a message" bg>
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <Card className="p-6 sm:p-8" highlighted>
            {submitted ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 bg-[#3083ff] text-white rounded-full flex items-center justify-center font-bold mx-auto text-xl">✓</div>
                <h3 className="font-black text-slate-900 text-lg">Message submitted</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Thank you. A 4tyrezz support representative will review your request and get back to you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full name">
                    <input required className={inputClass} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </Field>
                  <Field label="Mobile number">
                    <input
                      required
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      className={inputClass}
                      placeholder="10-digit number"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: digitsOnly(e.target.value) })}
                    />
                  </Field>
                </div>
                <Field label="Email address">
                  <input required type="email" className={inputClass} placeholder="you@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </Field>
                <Field label="Inquiry topic">
                  <div className="flex flex-wrap gap-2">
                    {topics.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setForm({ ...form, category: t.id })}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition ${
                          form.category === t.id
                            ? 'bg-[#3083ff] text-white border-[#3083ff]'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-[#3083ff]/40'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Preferred callback">
                  <select className={inputClass} value={form.callback} onChange={(e) => setForm({ ...form, callback: e.target.value })}>
                    <option value="anytime">Anytime during desk hours</option>
                    <option value="morning">Morning (9 AM – 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM – 4 PM)</option>
                    <option value="evening">Evening (4 PM – 7 PM)</option>
                  </select>
                </Field>
                <Field label="Details">
                  <textarea
                    required
                    rows="4"
                    className={inputClass}
                    placeholder="Tell us how we can help…"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </Field>
                <PrimaryButton type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Sending…' : 'Submit inquiry'}
                </PrimaryButton>
              </form>
            )}
          </Card>

          <div className="space-y-5">
            <Card className="p-6 space-y-3" hover={false}>
              <span className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <Clock className="w-5 h-5" strokeWidth={2.25} />
              </span>
              <h3 className="font-black text-slate-900 text-base">Desk hours</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Monday to Saturday, 9:00 AM – 7:00 PM IST. WhatsApp messages received after hours are answered the next working morning.
              </p>
            </Card>
            <Card className="p-6 space-y-3" hover={false}>
              <h3 className="font-black text-slate-900 text-base">What to include</h3>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>Car name or listing link if you are enquiring on a vehicle</li>
                <li>City and preferred time for a test drive</li>
                <li>Finance or insurance questions — our desk handles both</li>
              </ul>
              <Link to="/cars" className="inline-flex font-black text-sm text-[#3083ff] pt-2">
                Browse inspected cars →
              </Link>
            </Card>
          </div>
        </div>
      </Section>
    </div>
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
                  <span className="w-6 h-6 rounded-full bg-slate-100 group-open:bg-[#3083ff] group-open:text-white flex items-center justify-center text-slate-600 font-bold text-xs transition shrink-0 ml-2">
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
            <div className="flex items-center gap-2 text-xs font-bold text-[#3083ff]">
              <span>{job.dept}</span>
              <span>•</span>
              <span>{job.loc}</span>
            </div>
            <p className="text-xs text-slate-500 pt-1 max-w-xl">{job.desc}</p>
          </div>
          <a
            href={`mailto:info@webteksoft.com?subject=Application for ${job.role}`}
            className="inline-flex items-center justify-center bg-[#3083ff] text-white font-bold text-xs px-5 py-3 rounded-xl hover:brightness-95 transition shrink-0"
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
        <div key={index} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-[#3083ff]/40 transition">
          <div className="space-y-3">
            <div className="h-36 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-400 text-xs">
              Automotive Guide Cover
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-[#3083ff] uppercase tracking-wider">{post.tag}</span>
              <span className="text-slate-400">{post.time}</span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{post.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{post.desc}</p>
          </div>
          <button className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-slate-900 text-left hover:text-[#3083ff] transition">
            Read Full Article →
          </button>
        </div>
      ))}
    </div>
  </PageShell>
);