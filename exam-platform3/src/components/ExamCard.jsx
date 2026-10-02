import { useNavigate } from "react-router-dom";
import { SUBJECT_META } from "../data/mockData";
import { IconClock, IconFile, IconArrowRight, IconCheckCircle, IconLayers, IconWifi, IconDatabase, IconCpu, IconBrain } from "./Icons";

const ICONS = { layers: IconLayers, wifi: IconWifi, database: IconDatabase, cpu: IconCpu, brain: IconBrain };

const DIFF_COLOR = {
  Easy: "text-status-safe bg-status-safe/10 border-status-safe/25",
  Medium: "text-status-warn bg-status-warn/10 border-status-warn/25",
  Hard: "text-status-danger bg-status-danger/10 border-status-danger/25",
};

export default function ExamCard({ exam }) {
  const navigate = useNavigate();
  const meta = SUBJECT_META[exam.subject] || { color: "#4f7cff", icon: "file" };
  const Icon = ICONS[meta.icon] || IconFile;
  const isCompleted = exam.status === "completed";
  const isExpired = exam.status === "expired" || (exam.endTime && new Date(exam.endTime) < new Date() && !isCompleted);

  const deadlineDate = exam.endTime ? new Date(exam.endTime) : exam.date ? new Date(exam.date) : null;
  const deadlineStr = deadlineDate
    ? `Deadline: ${deadlineDate.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
    : "No Deadline";

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-glow">
      <div className="flex items-start justify-between">
        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}
        >
          <Icon size={20} />
        </div>
        <span className={`text-[11px] font-medium px-2 py-1 rounded-full border ${DIFF_COLOR[exam.difficulty] || DIFF_COLOR.Medium}`}>
          {exam.difficulty || "Medium"}
        </span>
      </div>

      <div>
        <p className="text-xs text-purple-900/60 font-medium">{exam.subject}</p>
        <h3 className="font-display font-semibold text-indigo-950 mt-0.5 leading-snug">{exam.title}</h3>
      </div>

      <div className="flex items-center gap-4 text-xs text-purple-900/70">
        <span className="flex items-center gap-1.5">
          <IconClock size={13} /> {exam.durationMins} min
        </span>
        <span className="flex items-center gap-1.5">
          <IconFile size={13} /> {exam.questions?.length || 1} questions
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-purple-100">
        <span className="text-[11px] text-purple-900/60 font-medium truncate max-w-[170px]">{deadlineStr}</span>
        {isCompleted ? (
          <div className="flex items-center gap-1.5 text-status-safe text-sm font-semibold shrink-0">
            <IconCheckCircle size={15} />
            {exam.score}%
          </div>
        ) : isExpired ? (
          <span className="text-xs font-medium px-2.5 py-1 rounded-lg text-status-danger bg-status-danger/10 border border-status-danger/25 shrink-0">
            Expired
          </span>
        ) : (
          <button
            onClick={() => navigate(`/exam/${exam.id}`)}
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-accent-blue to-accent-violet px-3.5 py-1.5 text-xs font-semibold text-white shadow-glow transition-transform hover:scale-105 active:scale-95 shrink-0"
          >
            Start Exam
            <IconArrowRight size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
