import { useEffect, useMemo, useState } from "react";
import { EXAMS } from "../data/mockData";
import { getExamOverrides } from "../utils/storage";
import { api } from "../utils/api";
import Sidebar from "../components/Sidebar";
import ExamCard from "../components/ExamCard";

export default function MyExams() {
  const [filter, setFilter] = useState("all");
  const [liveExams, setLiveExams] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [examsRes, subsRes] = await Promise.all([
          api.getExams().catch(() => null),
          api.getMySubmissions().catch(() => null),
        ]);

        if (examsRes && examsRes.exams) {
          setLiveExams(examsRes.exams);
        }
        if (subsRes && subsRes.submissions) {
          setMySubmissions(subsRes.submissions);
        }
      } catch (err) {
        console.warn("Error fetching live exams:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const mergedExams = useMemo(() => {
    const overrides = getExamOverrides();
    const subMap = new Map();
    mySubmissions.forEach((s) => subMap.set(s.exam_id, s));

    const now = new Date();

    let baseExams = liveExams.length
      ? liveExams.map((e) => {
          const isExpired = e.end_time && new Date(e.end_time) < now;
          const isSubmitted = subMap.has(e.id);
          const computedStatus = isSubmitted ? "completed" : isExpired ? "expired" : "upcoming";

          return {
            id: e.id,
            title: e.title,
            subject: e.subject,
            durationMins: e.duration_minutes,
            date: e.start_time ? e.start_time.split("T")[0] : "2026-09-15",
            endTime: e.end_time,
            status: computedStatus,
            score: isSubmitted ? subMap.get(e.id).score : undefined,
            questions: Array(e.total_questions || 5).fill({}),
          };
        })
      : EXAMS.map((e) => {
          const isExpired = e.endTime && new Date(e.endTime) < now;
          const isSubmitted = subMap.has(e.id);
          const computedStatus = isSubmitted ? "completed" : isExpired ? "expired" : e.status || "upcoming";
          return {
            ...e,
            status: computedStatus,
            score: isSubmitted ? subMap.get(e.id).score : undefined,
          };
        });

    return baseExams.map((e) => {
      const override = overrides[e.id];
      const sub = subMap.get(e.id);
      if (sub) {
        return { ...e, status: "completed", score: sub.score };
      }
      return override ? { ...e, ...override } : e;
    });
  }, [liveExams, mySubmissions]);

  const visible = useMemo(
    () => (filter === "all" ? mergedExams : mergedExams.filter((e) => e.status === filter)),
    [mergedExams, filter]
  );

  return (
    <div className="min-h-screen flex bg-navy-900">
      <Sidebar role="student" />

      <main className="flex-1 min-w-0 px-5 sm:px-8 py-8 max-w-7xl mx-auto w-full">
        <div className="animate-slide-up flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-indigo-950">My Exams</h1>
            <p className="text-sm text-purple-900/60 mt-1.5 font-medium">Every exam assigned to you, upcoming and completed.</p>
          </div>
          <div className="flex gap-1 p-1 rounded-lg glass">
            {[
              ["all", "All"],
              ["upcoming", "Upcoming"],
              ["completed", "Completed"],
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`focus-ring rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === val ? "bg-purple-100 text-purple-900 font-semibold shadow-sm" : "text-purple-900/70 hover:text-indigo-950"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">Loading assigned exams...</div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-8 pb-10">
            {visible.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
