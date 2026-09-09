import React from 'react';

export default function WhatsAppFloat() {
  const whatsappNumber = '919160415851';
  const defaultMessage = encodeURIComponent(
    'Hi 4TYREZZ team, I am interested in buying/selling a used car and exploring your tyre offers & doorstep fitting services.'
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${defaultMessage}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 group">
      {/* Tooltip Label (Appears on Hover) */}
      <span className="opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-semibold border border-[#3083ff]/40 backdrop-blur-md shadow-lg shadow-black/30">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        Chat on WhatsApp
      </span>

      {/* WhatsApp Floating Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with 4TYREZZ on WhatsApp"
        className="relative p-3.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-[0_10px_25px_rgba(37,211,102,0.4)] hover:shadow-[0_15px_30px_rgba(37,211,102,0.6)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer"
      >
        {/* Pulse Effect */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366]/30 animate-ping pointer-events-none" />

        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="relative z-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12.012 2C6.486 2 2 6.479 2 12c0 2.152.68 4.144 1.838 5.776L2 22l4.354-1.787A9.957 9.957 0 0012.012 22c5.525 0 10.012-4.479 10.012-10s-4.487-10-10.012-10zm5.942 14.22c-.252.708-1.26 1.302-2.028 1.464-.528.11-1.218.198-3.538-.758-2.968-1.222-4.88-4.236-5.028-4.432-.148-.198-1.206-1.606-1.206-3.064 0-1.458.764-2.176 1.036-2.472.272-.296.592-.37.79-.37.198 0 .396.002.568.01.186.008.436-.07.682.52.252.604.858 2.096.932 2.246.074.148.124.322.024.52-.098.198-.148.322-.296.496-.148.174-.31.39-.444.524-.148.148-.302.31-.13.604.172.296.766 1.258 1.644 2.038 1.128 1.004 2.08 1.314 2.378 1.462.296.148.47.124.644-.074.172-.198.74-.864.938-1.16.198-.296.396-.248.666-.148.272.098 1.73.816 2.028.964.296.148.494.222.568.346.074.124.074.718-.178 1.426z" />
        </svg>
      </a>
    </div>
  );
}