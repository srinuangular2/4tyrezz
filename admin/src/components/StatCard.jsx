export default function StatCard({ label, value, icon: Icon, tone = 'ink' }) {
  const glow = {
    ink: 'from-blue-500/20',
    ember: 'from-blue-500/25',
    verify: 'from-emerald-500/20',
    white: 'from-slate-500/10',
  };
  return (
    <div className={`rounded-2xl p-5 flex items-center justify-between bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 bg-gradient-to-br ${glow[tone] || glow.ink} to-transparent`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="font-display font-black text-3xl mt-1 text-white">{value}</p>
      </div>
      {Icon && <Icon fontSize="large" className="opacity-50 text-blue-300" />}
    </div>
  );
}
