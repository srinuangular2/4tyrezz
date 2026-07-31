import { Link } from 'react-router-dom';

const col = (title, links) => ({ title, links });
const COLUMNS = [
  col('Buy', [['Used Cars', '/cars'], ['SUVs', '/cars?bodyType=SUV'], ['Sedans', '/cars?bodyType=Sedan'], ['Electric Cars', '/cars?fuel=Electric']]),
  col('Sell', [['Sell your car', '/dashboard/add-car'], ['Dealer login', '/dealer/login']]),
  col('Company', [['About us', '/about'], ['Contact', '/contact'], ['Blog', '/blog'], ['FAQs', '/faqs']]),
];

export default function Footer() {
  return (
    <footer className="bg-ink text-slate-300 mt-16 relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-red-gradient" />
      <div className="container-px py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <span className="font-display font-black text-2xl text-white">4tyre<span className="text-ember">zz</span></span>
          <p className="text-sm mt-3 max-w-xs">
            Every car goes through a 15-point manual inspection before it reaches you — tyre to tyre.
          </p>
        </div>
        {COLUMNS.map((c) => (
          <div key={c.title}>
            <h5 className="text-white text-sm font-semibold mb-3 font-display">{c.title}</h5>
            <ul className="space-y-2">
              {c.links.map(([label, to]) => (
                <li key={label}><Link to={to} className="text-sm hover:text-ember transition">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-5 text-xs text-slate-400">
        <div className="container-px flex flex-wrap justify-between gap-2">
          <span>© {new Date().getFullYear()} 4tyrezz. All rights reserved.</span>
          <span>Built by Webteksoft</span>
        </div>
      </div>
    </footer>
  );
}
