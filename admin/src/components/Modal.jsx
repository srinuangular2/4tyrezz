export default function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} p-6 text-slate-100`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h3 className="font-display font-extrabold text-xl mb-4 text-white">{title}</h3>}
        {children}
      </div>
    </div>
  );
}
