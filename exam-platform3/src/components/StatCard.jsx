export default function StatCard({ icon: Icon, label, value, accent = "blue", suffix }) {
  const accentMap = {
    blue: "from-accent-blue/20 to-accent-blue/5 text-accent-blue",
    violet: "from-accent-violet/20 to-accent-violet/5 text-accent-violet",
    cyan: "from-accent-cyan/20 to-accent-cyan/5 text-accent-cyan",
    green: "from-status-safe/20 to-status-safe/5 text-status-safe",
  };
  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-4 transition-transform duration-200 hover:-translate-y-0.5">
      <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${accentMap[accent]} flex items-center justify-center shrink-0`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-display font-semibold text-indigo-950 leading-none">
          {value}
          {suffix && <span className="text-sm text-purple-900/60 font-body ml-1">{suffix}</span>}
        </p>
        <p className="text-xs text-purple-900/70 mt-1.5">{label}</p>
      </div>
    </div>
  );
}
