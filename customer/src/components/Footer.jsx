import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="relative bg-slate-950 text-slate-400 text-xs border-t border-[#3083ff]/30 pt-16 pb-8 overflow-hidden">
      {/* Background Subtle Radial Glow FX */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-[#3083ff]/10 blur-[120px] pointer-events-none rounded-full" 
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section: Quick Support & Assistance Highlight */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-[#3083ff]/30 backdrop-blur-xl mb-12 shadow-[0_10px_30px_rgba(48,131,255,0.1)] flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <img src="/blue-logo.png" alt="4TYREZZ" className="h-10 w-auto bg-white rounded-lg px-2 py-1" />
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-[#3083ff]/20 text-sky-300 border border-[#3083ff]/40">
                24/7 Support
              </span>
            </span>
            <p className="text-slate-300 text-xs font-medium">
              Need assistance choosing the right tyres or scheduling doorstep fitting in Hyderabad?
            </p>
          </div>

          {/* Direct Contact Actions */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <a 
              href="tel:+919160415851" 
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#3083ff] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-lg shadow-[#3083ff]/30 text-center cursor-pointer"
            >
              Call +91 79939 80559
            </a>
            <Link 
              to="/contact" 
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-black text-xs uppercase tracking-wider backdrop-blur-md text-center transition-all duration-300 cursor-pointer"
            >
              Request Callback
            </Link>
          </div>
        </div>

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800/80">
          
          {/* Brand Info */}
          <div className="space-y-3">
            <h4 className="font-black text-white text-sm tracking-wider uppercase flex items-center gap-2">
              About 4Tyrezz
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">
              Hyderabad’s premier marketplace for top-brand tyres, instant doorstep fitting, free 3D wheel alignment, and certified warranty coverage.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-300">Mobile Van Service Available</span>
            </div>
          </div>

          {/* Quick Links (Matched to Top Header Nav) */}
          <div>
            <h4 className="font-black text-white text-sm mb-4 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/cars" className="hover:text-[#3083ff] transition-colors">Buy Cars</Link></li>
              <li><Link to="/brands" className="hover:text-[#3083ff] transition-colors">All Brands</Link></li>
              <li><Link to="/sell" className="hover:text-[#3083ff] transition-colors">Sell / Exchange Car</Link></li>
              <li><Link to="/compare" className="hover:text-[#3083ff] transition-colors">Compare</Link></li>
              <li><Link to="/finance" className="hover:text-[#3083ff] transition-colors">Finance</Link></li>
              <li><Link to="/insurance" className="hover:text-[#3083ff] transition-colors">Insurance</Link></li>
              <li><Link to="/dealers" className="hover:text-[#3083ff] transition-colors">Dealers</Link></li>
              <li><Link to="/offers" className="hover:text-[#3083ff] transition-colors">Offers</Link></li>
              <li><Link to="/valuation" className="hover:text-[#3083ff] transition-colors">Car Valuation</Link></li>
              <li><Link to="/dealer/onboarding" className="hover:text-[#3083ff] transition-colors">Dealer onboarding</Link></li>
          
            </ul>
          </div>

          {/* Support & Legal Links */}
          <div>
            <h4 className="font-black text-white text-sm mb-4 uppercase tracking-wider">Legal & Support</h4>
            <ul className="space-y-2.5 font-medium">
            <li><Link to="/about" className="hover:text-[#3083ff] transition-colors">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-[#3083ff] transition-colors">Contact Us</Link></li>
              <li><Link to="/terms" className="hover:text-[#3083ff] transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-[#3083ff] transition-colors">Privacy Policy</Link></li>
              <li><Link to="/corporate-policies" className="hover:text-[#3083ff] transition-colors">Refund & Return Policy</Link></li>
              <li><Link to="/faqs" className="hover:text-[#3083ff] transition-colors">Help & FAQs</Link></li>
            
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="font-black text-white text-sm mb-4 uppercase tracking-wider">Contact Us</h4>
            <p className="text-slate-300 font-medium flex items-center gap-2">
              <span>📍</span> Hyderabad, Telangana, India
            </p>
            <p className="text-slate-300 font-medium flex items-center gap-2">
              <span>📧</span> support@4tyrezz.com
            </p>
            <p className="text-slate-300 font-medium flex items-center gap-2">
              <span>📞</span> +91 91604 15851
            </p>
          </div>

        </div>

        {/* Bottom Copyright & Webteksoft Credit */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-medium">
          <p>© {new Date().getFullYear()} 4TYREZZ. All rights reserved.</p>
          
          <p className="text-slate-400">
            Designed & Developed by{' '}
            <a 
              href="https://webteksoft.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#3083ff] hover:underline font-bold"
            >
              Webteksoft
            </a>
          </p>
        </div>

      </div>
    </footer>
  );
}