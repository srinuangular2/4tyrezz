export default function StatCard({ label, value, icon: Icon, tone = 'ink' }) {
  const tones = {
    ink: 'bg-ink text-white', ember: 'bg-ember text-white',
    verify: 'bg-verify text-white', white: 'bg-white text-ink border border-slate-200',
  };
  return (
    <div className={`rounded-2xl p-5 flex items-center justify-between ${tones[tone]}`}>
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wide ${tone === 'white' ? 'text-slate2' : 'opacity-80'}`}>{label}</p>
        <p className="font-display font-black text-3xl mt-1">{value}</p>
      </div>
      {Icon && <Icon fontSize="large" className="opacity-70" />}
    </div>
  );
}
