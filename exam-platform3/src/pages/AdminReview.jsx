import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { api } from "../utils/api";
import {
  IconShieldCheck,
  IconSearch,
  IconUser,
  IconClock,
  IconAlertTriangle,
  IconCheckCircle,
  IconXCircle,
  IconFileText,
  IconX
} from "../components/Icons";

export default function AdminReview() {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadExams() {
      try {
        const res = await api.getExams();
        if (res && res.exams && res.exams.length > 0) {
          setExams(res.exams);
          setSelectedExamId(res.exams[0].id);
        }
      } catch (err) {
        console.warn("Failed loading exams for review", err);
      }
    }
    loadExams();
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;
    async function loadSubmissions() {
      setLoading(true);
      try {
        const data = await api.getExamSubmissionsReview(selectedExamId);
        setReviewData(data);
      } catch (err) {
        console.warn("Failed loading exam submission review", err);
      } finally {
        setLoading(false);
      }
    }
    loadSubmissions();
  }, [selectedExamId]);

  const submissions = reviewData?.submissions || [];
  const filteredSubmissions = submissions.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.student_name && s.student_name.toLowerCase().includes(term)) ||
      (s.student_email && s.student_email.toLowerCase().includes(term)) ||
      (s.student_id && s.student_id.toLowerCase().includes(term))
    );
  });

  const formatTimelineTime = (isoString) => {
    if (!isoString) return "--:--:--";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return "--:--:--";
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <Sidebar role="admin" />

      <main className="flex-1 min-w-0 px-5 sm:px-8 py-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6">
          <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Exam Monitoring & Audit</p>
          <h1 className="font-display text-3xl font-bold text-white mt-1">Admin Exam Review & Violation Timelines</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review detailed student submission records, scores, and chronological AI proctoring security event logs.
          </p>
        </div>

        {/* Exam Select & Search Bar */}
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 mt-6 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Select Exam</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} ({e.subject || "General"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Search Submissions</label>
            <div className="relative">
              <IconSearch size={16} className="absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name or ID..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-slate-900 rounded-2xl p-6 mt-6 border border-slate-800 shadow-xl">
          <h2 className="font-display font-bold text-white text-lg mb-4 flex items-center gap-2">
            <IconFileText size={20} className="text-indigo-400" />
            Student Submission Attempts ({filteredSubmissions.length})
          </h2>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">Loading submission records...</div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
              No submission records found for this exam.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-800">
                    <th className="font-semibold px-3 py-3">Student</th>
                    <th className="font-semibold px-3 py-3">Score %</th>
                    <th className="font-semibold px-3 py-3">Result</th>
                    <th className="font-semibold px-3 py-3">Violations</th>
                    <th className="font-semibold px-3 py-3">Risk Level</th>
                    <th className="font-semibold px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((s) => (
                    <tr key={s.id} className="border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors">
                      <td className="px-3 py-3.5 text-white font-semibold">
                        {s.student_name}
                        <span className="text-slate-500 text-xs block font-mono">ID: {s.student_id}</span>
                      </td>
                      <td className="px-3 py-3.5 font-mono text-white font-bold">{Math.round(s.percentage || 0)}%</td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                            s.status === "PASSED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 font-mono text-slate-300 font-bold">{s.violation_count || 0}</td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            s.risk_level === "SAFE"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : s.risk_level === "LOW"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              : s.risk_level === "MEDIUM"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          {s.risk_level || "SAFE"}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <button
                          onClick={() => setActiveSubmission(s)}
                          className="focus-ring rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-colors"
                        >
                          Review Timeline
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detailed Submission & Violation Timeline Modal */}
        {activeSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setActiveSubmission(null)} />
            <div className="relative bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 border border-slate-800 shadow-2xl animate-slide-up">
              <button
                onClick={() => setActiveSubmission(null)}
                className="focus-ring absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <IconX size={20} />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <IconUser size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-lg">{activeSubmission.student_name}</h3>
                  <p className="text-xs text-slate-400">
                    ID: <span className="font-mono text-slate-200">{activeSubmission.student_id}</span> | Submitted: {new Date(activeSubmission.submission_time).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-4 gap-3 my-4 py-3 bg-slate-800/60 rounded-xl border border-slate-800 text-center text-xs">
                <div>
                  <div className="font-mono font-bold text-base text-white">{Math.round(activeSubmission.percentage || 0)}%</div>
                  <div className="text-slate-400 mt-0.5">Score</div>
                </div>
                <div>
                  <div className="font-mono font-bold text-base text-emerald-400">{activeSubmission.correct}</div>
                  <div className="text-slate-400 mt-0.5">Correct</div>
                </div>
                <div>
                  <div className="font-mono font-bold text-base text-rose-400">{activeSubmission.incorrect}</div>
                  <div className="text-slate-400 mt-0.5">Incorrect</div>
                </div>
                <div>
                  <div className="font-mono font-bold text-base text-amber-400">{activeSubmission.violation_count || 0}</div>
                  <div className="text-slate-400 mt-0.5">Violations</div>
                </div>
              </div>

              {/* Chronological Violation Timeline */}
              <div className="mt-6">
                <h4 className="font-display font-bold text-white text-sm mb-3 flex items-center gap-2">
                  <IconAlertTriangle size={16} className="text-rose-400" />
                  Chronological Security Event Log
                </h4>

                {(!activeSubmission.violations || activeSubmission.violations.length === 0) ? (
                  <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 text-center text-xs text-emerald-400 font-semibold">
                    ✅ Clean Session: No security violations logged during this exam attempt.
                  </div>
                ) : (
                  <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                    {activeSubmission.violations.map((v, idx) => (
                      <div key={idx} className="flex items-start gap-4 text-xs relative pl-8">
                        <div className="absolute left-1.5 top-1.5 h-3 w-3 rounded-full bg-rose-500 ring-4 ring-slate-900" />
                        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-indigo-400">
                              {formatTimelineTime(v.timestamp || v.at)}
                            </span>
                            <span className="font-semibold text-rose-400 uppercase tracking-wider text-[10px] bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                              {v.type || "Violation"}
                            </span>
                          </div>
                          <p className="text-slate-300 font-medium mt-1 leading-relaxed">{v.description || v.message || "Security violation recorded"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
