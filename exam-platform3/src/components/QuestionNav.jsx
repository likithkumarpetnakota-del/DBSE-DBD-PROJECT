export default function QuestionNav({ questions, currentIndex, answers, marked, onJump }) {
  function stateFor(idx, q) {
    if (idx === currentIndex) return "current";
    if (marked.has(q.id)) return "marked";
    if (answers[q.id]?.selected !== undefined) return "answered";
    return "unanswered";
  }

  const styles = {
    current: "bg-gradient-to-br from-accent-blue to-accent-violet text-white shadow-glow border-transparent",
    answered: "bg-status-safe/15 text-status-safe border-status-safe/30",
    marked: "bg-status-warn/15 text-status-warn border-status-warn/30",
    unanswered: "bg-purple-50 text-indigo-950 border-purple-200/80 hover:border-purple-300 hover:bg-purple-100/70",
  };

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="font-display font-semibold text-indigo-950 text-sm mb-4">Questions</h3>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => onJump(idx)}
            className={`focus-ring h-9 rounded-lg text-xs font-semibold border transition-all duration-150 ${styles[stateFor(idx, q)]}`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 mt-5 pt-4 border-t border-purple-100 text-xs text-purple-900/70">
        <Legend swatch="bg-gradient-to-br from-accent-blue to-accent-violet" label="Current question" />
        <Legend swatch="bg-status-safe/60" label="Answered" />
        <Legend swatch="bg-status-warn/60" label="Marked for review" />
        <Legend swatch="bg-purple-100 border border-purple-200" label="Not answered" />
      </div>
    </div>
  );
}

function Legend({ swatch, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded ${swatch}`} />
      {label}
    </div>
  );
}
