export default function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`relative bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} p-6 text-slate-100`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          {title ? <h3 className="font-display font-extrabold text-xl text-white pr-8">{title}</h3> : <span />}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-slate-700 text-slate-300 hover:text-white font-black"
            >
              ✕
            </button>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}
