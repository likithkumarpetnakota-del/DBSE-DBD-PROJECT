import { IconAlertTriangle, IconX } from "./Icons";

export default function ViolationToast({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2.5 w-[min(360px,calc(100vw-2rem))]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-toast-in glass-strong rounded-xl px-4 py-3.5 flex items-start gap-3 border-status-danger/30 shadow-glow-danger"
        >
          <IconAlertTriangle size={18} className="text-status-danger shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-indigo-950">Proctoring alert</p>
            <p className="text-xs text-slate-600 mt-0.5">{t.message}</p>
          </div>
          <button onClick={() => onDismiss(t.id)} className="focus-ring text-slate-500 hover:text-slate-300 shrink-0">
            <IconX size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
