import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { EXAMS } from "../data/mockData";
import { getExamOverrides } from "../utils/storage";
import { api } from "../utils/api";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import ExamCard from "../components/ExamCard";
import { IconFile, IconCheckCircle, IconTrendingUp, IconActivity } from "../components/Icons";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [liveExams, setLiveExams] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
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
      } catch (e) {
        console.warn("Using local fallback exams data", e);
      }
    }
    loadDashboardData();
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

  const upcoming = useMemo(() => mergedExams.filter((e) => e.status === "upcoming" || e.status === "scheduled"), [mergedExams]);
  const completed = useMemo(() => mergedExams.filter((e) => e.status === "completed"), [mergedExams]);
  const avgScore = useMemo(() => {
    if (!completed.length) return 0;
    const validScores = completed.filter((e) => typeof e.score === "number");
    if (!validScores.length) return 0;
    return Math.round(validScores.reduce((sum, e) => sum + e.score, 0) / validScores.length);
  }, [completed]);


  const visible = filter === "all" ? mergedExams : filter === "upcoming" ? upcoming : completed;
  const firstName = user?.name?.split(" ")[0] || "Student";

  return (
    <div className="min-h-screen flex bg-navy-900">
      <Sidebar role="student" />

      <main className="flex-1 min-w-0 px-5 sm:px-8 py-8 max-w-7xl mx-auto w-full">
        <div className="animate-slide-up">
          <p className="text-sm text-purple-900/60 font-medium">Welcome back,</p>
          <h1 className="font-display text-3xl font-semibold text-indigo-950 mt-1">
            {firstName} <span className="text-gradient">👋</span>
          </h1>
          <p className="text-sm text-purple-900/70 mt-1.5 font-medium">
            {user?.department || user?.program} · Student ID: {user?.student_id || user?.rollNo || "CS21B045"}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <StatCard icon={IconFile} label="Upcoming exams" value={upcoming.length} accent="blue" />
          <StatCard icon={IconCheckCircle} label="Completed exams" value={completed.length} accent="green" />
          <StatCard icon={IconTrendingUp} label="Average score" value={avgScore} suffix="%" accent="violet" />
          <StatCard icon={IconActivity} label="Integrity score" value={98} suffix="/100" accent="cyan" />
        </div>

        <div className="flex items-center justify-between mt-10 mb-4">
          <h2 className="font-display text-lg font-semibold text-indigo-950">Your exams</h2>
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

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 pb-10">
          {visible.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      </main>
    </div>
  );
}
