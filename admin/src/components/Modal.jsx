export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display font-extrabold text-xl mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}
