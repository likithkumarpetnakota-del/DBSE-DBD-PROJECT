import { IconAlertTriangle, IconCheckCircle, IconX } from "./Icons";

export default function SubmitModal({ open, onCancel, onConfirm, answeredCount, totalCount, violationCount }) {
  if (!open) return null;
  const unanswered = totalCount - answeredCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-purple-900/15 backdrop-blur-md animate-fade-in" onClick={onCancel} />
      <div className="relative glass-strong rounded-2xl w-full max-w-sm p-6 animate-slide-up">
        <button onClick={onCancel} className="focus-ring absolute top-4 right-4 text-purple-900/60 hover:text-indigo-950">
          <IconX size={18} />
        </button>

        <div className="h-12 w-12 rounded-xl bg-accent-blue/15 flex items-center justify-center mb-4">
          <IconCheckCircle size={22} className="text-accent-blue" />
        </div>

        <h3 className="font-display text-lg font-semibold text-indigo-950">Submit exam?</h3>
        <p className="text-sm text-purple-900/70 mt-1.5">
          You won't be able to change your answers after this. Please review the summary below.
        </p>

        <div className="mt-5 space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-purple-900/70">Questions answered</span>
            <span className="font-mono font-semibold text-indigo-950">
              {answeredCount} / {totalCount}
            </span>
          </div>
          {unanswered > 0 && (
            <div className="flex items-center gap-2 text-status-warn text-xs bg-status-warn/10 border border-status-warn/25 rounded-lg px-3 py-2">
              <IconAlertTriangle size={14} />
              {unanswered} question{unanswered > 1 ? "s" : ""} left unanswered
            </div>
          )}
          {violationCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-purple-900/70">Proctoring violations logged</span>
              <span className="font-mono font-semibold text-status-warn">{violationCount}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="focus-ring flex-1 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 py-2.5 text-sm font-medium text-purple-950 transition-colors"
          >
            Keep working
          </button>
          <button
            onClick={onConfirm}
            className="focus-ring flex-1 rounded-lg bg-gradient-to-r from-accent-blue to-accent-violet py-2.5 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Submit now
          </button>
        </div>
      </div>
    </div>
  );
}
