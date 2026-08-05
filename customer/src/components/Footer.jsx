import { Link } from 'react-router-dom';

const col = (title, links) => ({ title, links });

const COLUMNS = [
  col('Buy', [
    ['Used Cars', '/cars'],
    ['SUVs', '/cars?bodyType=SUV'],
    ['Sedans', '/cars?bodyType=Sedan'],
    ['Electric Cars', '/cars?fuel=Electric']
  ]),
  col('Sell', [
    ['Sell your car', '/dashboard/add-car'],
    ['Dealer login', '/dealer/login']
  ]),
  col('Company', [
    ['About us', '/about'],
    ['Contact', '/contact'],
    ['Blog', '/blog'],
    ['FAQs', '/faqs'],
    ['Careers', '/careers'],
    ['Terms', '/terms'],
    ['Privacy', '/privacy'],
    ['Corporate Policies', '/corporate-policies']
  ]),
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16 relative">
      {/* Top accent line */}
      <div style={{ backgroundColor: '#fe0100' }} className="absolute top-0 left-0 right-0 h-1" />

      <div className="container-px mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <span className="font-black text-2xl text-white">
            4tyre<span style={{ color: '#fe0100' }}>zz</span>
          </span>
          <p className="text-xs sm:text-sm mt-3 max-w-xs text-slate-400 font-medium leading-relaxed">
            Every car goes through a 15-point manual inspection before it reaches you — tyre to tyre.
          </p>
        </div>

        {COLUMNS.map((c) => (
          <div key={c.title}>
            <h5 className="text-white text-sm font-black mb-3">{c.title}</h5>
            <ul className="space-y-2">
              {c.links.map(([label, to]) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-xs sm:text-sm text-slate-400 hover:text-[#fe0100] transition-colors font-semibold block"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom copyright bar */}
      <div className="border-t border-slate-800 py-5 text-xs text-slate-500 font-medium">
        <div className="container-px mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-between items-center gap-2">
          <span>© {new Date().getFullYear()} 4tyrezz. All rights reserved.</span>
          <span>
            Built by <span className="text-slate-300 font-bold">Webteksoft</span>
          </span>
        </div>
      </div>
    </footer>
  );
}