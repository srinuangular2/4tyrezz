export const About = () => (
  <PageShell title="About 4tyrezz">
    <p>4tyrezz is a used-car marketplace built around one idea: every car should be inspected before it's sold, not after something goes wrong.</p>
    <p>We connect individual sellers, buyers, and verified dealers across three models — owner-to-buyer, dealer-to-buyer, and owner-to-dealer — with a 15-point manual inspection behind every listing.</p>
  </PageShell>
);

export const Contact = () => (
  <PageShell title="Contact us">
    <p>Phone: <a href="tel:9160415851" className="text-ember font-semibold">9160415851</a></p>
    <p>Email: <a href="mailto:info@webteksoft.com" className="text-ember font-semibold">info@webteksoft.com</a></p>
  </PageShell>
);

export const FAQs = () => (
  <PageShell title="Frequently asked questions">
    {[
      ['How does the inspection work?', 'Every car is checked across 15 points by a 4tyrezz inspector before it can be listed.'],
      ['Can dealers list here?', 'Yes — dealers get their own login and inventory dashboard, separate from the OTP-based customer login.'],
      ['Is my number kept private?', 'Your number is only shared with a seller when you send a contact request.'],
    ].map(([q, a]) => (
      <details key={q} className="bg-white border border-slate-100 rounded-xl p-5 mb-3">
        <summary className="font-semibold cursor-pointer">{q}</summary>
        <p className="text-sm text-slate2 mt-2">{a}</p>
      </details>
    ))}
  </PageShell>
);

export const Blog = () => (
  <PageShell title="4tyrezz Blog">
    <div className="grid sm:grid-cols-2 gap-5">
      {['5 things to check before buying a used SUV', 'How our 15-point inspection actually works', 'Selling to a dealer vs. listing it yourself'].map((t) => (
        <div key={t} className="bg-white border border-slate-100 rounded-xl p-5">
          <div className="h-32 bg-slate-100 rounded-lg mb-3" />
          <h3 className="font-semibold">{t}</h3>
          <p className="text-xs text-slate-400 mt-1">5 min read</p>
        </div>
      ))}
    </div>
  </PageShell>
);

function PageShell({ title, children }) {
  return (
    <div className="container-px py-14 max-w-2xl mx-auto space-y-4 text-slate2 text-sm">
      <h1 className="font-display font-black text-3xl text-ink">{title}</h1>
      {children}
    </div>
  );
}
