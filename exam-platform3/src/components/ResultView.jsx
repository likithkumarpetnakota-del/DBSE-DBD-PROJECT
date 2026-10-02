import { useNavigate } from "react-router-dom";
import { IconCheckCircle, IconXCircle, IconShieldCheck, IconArrowRight, IconClock, IconUser, IconBook } from "./Icons";

export default function ResultView({ exam, result }) {
  const navigate = useNavigate();

  // Handle properties whether from submission response or local result object
  const total = result.total || result.total_marks || (exam?.questions ? exam.questions.length : 0);
  const correct = result.correct ?? 0;
  const incorrect = result.incorrect ?? 0;
  const skipped = result.skipped ?? 0;
  const score = result.score ?? correct;
  const totalMarks = result.total_marks ?? total;
  const pct = result.percentage !== undefined ? Math.round(result.percentage) : Math.round((score / Math.max(totalMarks, 1)) * 100);
  
  const passingMarks = result.passing_marks ?? exam?.passing_marks ?? 40;
  const passStatus = result.status || (pct >= passingMarks ? "PASSED" : "FAILED");
  const isPassed = passStatus === "PASSED";

  const studentName = result.student_name || result.studentName || "Student";
  const studentId = result.student_id || result.studentId || "N/A";
  const subject = exam?.subject || result.subject || "General";
  const examTitle = exam?.title || result.exam_title || "Exam";

  const violationCount = result.violation_count ?? result.violationCount ?? 0;
  const riskLevel = result.risk_level || (violationCount === 0 ? "SAFE" : violationCount < 3 ? "LOW" : violationCount < 6 ? "MEDIUM" : "HIGH");

  // Format time used
  const formatTime = (seconds) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const timeUsed = formatTime(result.time_used_seconds || result.timeUsedSeconds);
  const startTime = result.start_time ? new Date(result.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A";
  const submitTime = result.submission_time ? new Date(result.submission_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A";

  const riskBadgeColor = {
    SAFE: "bg-emerald-500/10 text-emerald-700 border-emerald-300",
    LOW: "bg-blue-500/10 text-blue-700 border-blue-300",
    MEDIUM: "bg-amber-500/10 text-amber-700 border-amber-300",
    HIGH: "bg-orange-500/10 text-orange-700 border-orange-300",
    CRITICAL: "bg-rose-500/10 text-rose-700 border-rose-300",
  }[riskLevel] || "bg-slate-500/10 text-slate-700 border-slate-300";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900/90 py-10">
      <div className="w-full max-w-2xl bg-white rounded-2xl p-8 shadow-2xl border border-slate-200 animate-slide-up">
        {/* Header Badge & Title */}
        <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
          <div
            className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ${
              isPassed ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
            }`}
          >
            {isPassed ? (
              <IconCheckCircle size={36} className="text-emerald-600" />
            ) : (
              <IconXCircle size={36} className="text-rose-600" />
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
            <IconBook size={14} />
            <span>{subject}</span>
          </div>

          <h1 className="font-display text-2xl font-bold text-slate-900 mt-2">{examTitle}</h1>
          <p className="text-sm text-slate-500 mt-1">Official Submission Result Summary</p>

          {/* Pass / Fail Badge */}
          <div className="mt-3 flex items-center gap-3">
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase border ${
              isPassed ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
            }`}>
              {isPassed ? "PASSED" : "FAILED"} (Min. Pass: {passingMarks}%)
            </span>

            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${riskBadgeColor}`}>
              Risk: {riskLevel} ({violationCount} violation{violationCount === 1 ? '' : 's'})
            </span>
          </div>
        </div>

        {/* Score & Progress Bar */}
        <div className="py-6 border-b border-slate-100 text-center">
          <div className="font-mono text-5xl font-extrabold text-slate-900">{pct}%</div>
          <div className="text-sm font-medium text-slate-600 mt-1">
            Score: <span className="font-bold text-slate-900">{score}</span> / {totalMarks} Marks
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-3 rounded-full mt-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isPassed ? "bg-emerald-500" : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Student & Session Meta */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-2.5 text-slate-600">
            <IconUser size={16} className="text-slate-400" />
            <div>
              <span className="font-semibold text-slate-800">{studentName}</span>
              <span className="text-slate-400 block text-[11px]">ID: {studentId}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-slate-600">
            <IconClock size={16} className="text-slate-400" />
            <div>
              <span className="font-semibold text-slate-800">Time Used: {timeUsed}</span>
              <span className="text-slate-400 block text-[11px]">{startTime} → {submitTime}</span>
            </div>
          </div>
        </div>

        {/* Questions Breakdown */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <Stat label="Correct" value={correct} tone="safe" />
          <Stat label="Incorrect" value={incorrect} tone="danger" />
          <Stat label="Skipped" value={skipped} tone="neutral" />
        </div>

        {/* Proctoring Log Notice */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center gap-3">
          <IconShieldCheck size={20} className="text-indigo-600 shrink-0" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <span className="text-slate-900 font-semibold">{violationCount} violation event(s)</span> logged. Detailed timestamps and screenshots recorded in the admin audit trail.
          </div>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="focus-ring w-full mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition-all"
        >
          Return to Dashboard
          <IconArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  const toneMap = {
    safe: "text-emerald-600 bg-emerald-50 border-emerald-100",
    danger: "text-rose-600 bg-rose-50 border-rose-100",
    neutral: "text-slate-600 bg-slate-50 border-slate-200",
  };
  return (
    <div className={`rounded-xl border py-3 text-center ${toneMap[tone]}`}>
      <div className="font-mono text-2xl font-bold">{value}</div>
      <div className="text-[11px] font-medium uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}
