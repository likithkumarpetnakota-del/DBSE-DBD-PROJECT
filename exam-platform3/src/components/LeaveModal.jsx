import { IconAlertTriangle, IconX } from "./Icons";

export default function LeaveModal({ open, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 animate-slide-up">
        <button onClick={onCancel} className="focus-ring absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <IconX size={18} />
        </button>

        <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
          <IconAlertTriangle size={24} />
        </div>

        <h3 className="font-display text-lg font-bold text-slate-900">Leave Examination?</h3>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Are you sure you want to leave this page? Your answers have been auto-saved, but your timer will continue running on the server.
        </p>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="focus-ring flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition-colors"
          >
            Stay in Exam
          </button>
          <button
            onClick={onConfirm}
            className="focus-ring flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 py-2.5 text-sm font-semibold text-white shadow-md transition-colors"
          >
            Leave Exam
          </button>
        </div>
      </div>
    </div>
  );
}
