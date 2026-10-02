import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import {
  IconFile,
  IconUser,
  IconTrendingUp,
  IconAlertTriangle,
  IconShieldCheck,
  IconLock,
  IconCheckCircle,
  IconDownload,
  IconSearch,
  IconFilter,
  IconRefreshCw,
  IconBook
} from "../components/Icons";

const RISK_STYLE = {
  SAFE: "text-emerald-700 bg-emerald-50 border-emerald-200",
  LOW: "text-blue-700 bg-blue-50 border-blue-200",
  MEDIUM: "text-amber-700 bg-amber-50 border-amber-200",
  HIGH: "text-orange-700 bg-orange-50 border-orange-200",
  CRITICAL: "text-rose-700 bg-rose-50 border-rose-200",
};

export default function AdminDashboard() {
  const { user } = useAuth();
  
  // Real Analytics State from MongoDB
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvingId, setApprovingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState("");
  const [exporting, setExporting] = useState(false);

  // Filter States
  const [selectedExam, setSelectedExam] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedRisk, setSelectedRisk] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const loadDashboardData = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const params = {};
      if (selectedExam !== "all") params.exam_id = selectedExam;
      if (selectedSubject !== "all") params.subject = selectedSubject;
      if (selectedRisk !== "all") params.risk_level = selectedRisk;
      if (searchTerm) params.search = searchTerm;

      const [analyticsData, reqsRes] = await Promise.all([
        api.getAdminAnalytics(params).catch(() => null),
        api.getPendingRequests().catch(() => null),
      ]);

      if (analyticsData) {
        setAnalytics(analyticsData);
      }
      if (reqsRes && reqsRes.requests) {
        setPendingRequests(reqsRes.requests);
      }
    } catch (err) {
      console.warn("Error fetching admin analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [selectedExam, selectedSubject, selectedRisk, searchTerm]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  async function handleApprove(requestId) {
    setApprovingId(requestId);
    setActionSuccess("");
    try {
      await api.approveRequest(requestId);
      setActionSuccess("Exam unlocked successfully for student!");
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      setTimeout(() => setActionSuccess(""), 4000);
      loadDashboardData();
    } catch (err) {
      alert("Failed to approve request: " + err.message);
    } finally {
      setApprovingId(null);
    }
  }

  async function handleExport(format) {
    setExporting(true);
    try {
      await api.exportExamResults(selectedExam, format);
    } catch (err) {
      alert(`Export error (${format}): ` + err.message);
    } finally {
      setExporting(false);
    }
  }

  const metrics = analytics?.metrics || {
    total_students: 0,
    total_exams: 0,
    active_exams: 0,
    completed_exams: 0,
    average_score: 0,
    pass_percentage: 0,
    total_violations: 0,
    students_needing_review: 0,
  };

  const scoreDist = analytics?.score_distribution || {};
  const riskDist = analytics?.risk_distribution || {};
  const violationTypes = analytics?.violation_types || {};
  const examStatuses = analytics?.exam_status_breakdown || {};
  const recentSubmissions = analytics?.recent_submissions || [];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <Sidebar role="admin" />

      <main className="flex-1 min-w-0 px-5 sm:px-8 py-8 max-w-7xl mx-auto w-full">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 animate-slide-up">
          <div>
            <p className="text-xs text-indigo-400 font-semibold tracking-wider uppercase">Real-Time Examination Control Hub</p>
            <h1 className="font-display text-3xl font-bold text-white mt-1">{user?.name || "Dr. Anita Rao"}</h1>
            <p className="text-sm text-slate-400 mt-1">MongoDB-backed live analytics, student risk scoring, and exam exports.</p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleExport("csv")}
              disabled={exporting}
              className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-all shadow-sm"
            >
              <IconDownload size={14} className="text-indigo-400" />
              Export CSV
            </button>
            <button
              onClick={() => handleExport("excel")}
              disabled={exporting}
              className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-all shadow-sm"
            >
              <IconDownload size={14} />
              Export Excel
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={exporting}
              className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-rose-700 hover:bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white transition-all shadow-sm"
            >
              <IconDownload size={14} />
              Export PDF
            </button>
          </div>
        </div>

        {/* Global Filter Toolbar */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Filter Exam</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Exams</option>
              {analytics?.exams_list?.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Subjects</option>
              {analytics?.subjects_list?.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Risk Level Filter</label>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="SAFE">SAFE</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Search Student</label>
            <div className="relative">
              <IconSearch size={14} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name or email..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* High-Level Stat Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <StatCard icon={IconFile} label="Total / Active Exams" value={`${metrics.active_exams} / ${metrics.total_exams}`} accent="blue" />
          <StatCard icon={IconUser} label="Students Enrolled" value={metrics.total_students} accent="green" />
          <StatCard icon={IconTrendingUp} label="Avg Class Score" value={metrics.average_score} suffix="%" accent="violet" />
          <StatCard icon={IconAlertTriangle} label="Needs Review / Flags" value={metrics.students_needing_review} accent="rose" />
        </div>

        {/* Banned Student Unlock Requests Section */}
        {pendingRequests.length > 0 && (
          <div className="bg-slate-900 rounded-2xl p-6 mt-6 border border-amber-500/30 animate-fade-in shadow-xl">
            <div className="flex items-center gap-2.5 mb-4 text-amber-400">
              <IconLock size={20} />
              <h2 className="font-display font-bold text-white text-lg">Pending Student Unlock Requests</h2>
              <span className="text-xs bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2.5 py-0.5 rounded-full font-mono font-bold">
                {pendingRequests.length} Pending
              </span>
            </div>

            {actionSuccess && (
              <p className="text-xs text-emerald-400 bg-emerald-900/30 border border-emerald-500/30 rounded-xl px-3 py-2 mb-4 font-semibold">
                {actionSuccess}
              </p>
            )}

            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="bg-slate-800/90 rounded-xl p-4 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{req.student_name}</span>
                      <span className="text-xs text-slate-400 font-medium">({req.student_email})</span>
                    </div>
                    <p className="text-xs text-indigo-400 font-semibold mt-0.5">{req.exam_title}</p>
                    <p className="text-xs text-slate-300 mt-2 bg-slate-900 p-2.5 rounded-lg border border-slate-700 italic">
                      "{req.reason}"
                    </p>
                  </div>
                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={approvingId === req.id}
                    className="focus-ring shrink-0 inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-all disabled:opacity-50"
                  >
                    <IconCheckCircle size={15} />
                    {approvingId === req.id ? "Granting..." : "Approve & Resume Exam"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Distribution Graphs Section */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* Score Distribution Breakdown */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
            <h3 className="font-display font-bold text-white text-base mb-4 flex items-center gap-2">
              <IconTrendingUp size={18} className="text-indigo-400" />
              Score Distribution Breakdown
            </h3>
            <div className="space-y-4">
              <BarBucket label="0% - 40% (Failed)" count={scoreDist["0_40"] || 0} total={recentSubmissions.length || 1} color="bg-rose-500" />
              <BarBucket label="41% - 60% (Average)" count={scoreDist["41_60"] || 0} total={recentSubmissions.length || 1} color="bg-amber-500" />
              <BarBucket label="61% - 80% (Good)" count={scoreDist["61_80"] || 0} total={recentSubmissions.length || 1} color="bg-blue-500" />
              <BarBucket label="81% - 100% (Excellent)" count={scoreDist["81_100"] || 0} total={recentSubmissions.length || 1} color="bg-emerald-500" />
            </div>
          </div>

          {/* Proctoring Risk Level Distribution */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
            <h3 className="font-display font-bold text-white text-base mb-4 flex items-center gap-2">
              <IconShieldCheck size={18} className="text-indigo-400" />
              AI Proctoring Risk Level Distribution
            </h3>
            <div className="space-y-4">
              <BarBucket label="SAFE (0 Violations)" count={riskDist["SAFE"] || 0} total={recentSubmissions.length || 1} color="bg-emerald-500" />
              <BarBucket label="LOW (1-2 Minor Events)" count={riskDist["LOW"] || 0} total={recentSubmissions.length || 1} color="bg-blue-500" />
              <BarBucket label="MEDIUM (3-4 Events)" count={riskDist["MEDIUM"] || 0} total={recentSubmissions.length || 1} color="bg-amber-500" />
              <BarBucket label="HIGH / CRITICAL (5+ Banned)" count={(riskDist["HIGH"] || 0) + (riskDist["CRITICAL"] || 0)} total={recentSubmissions.length || 1} color="bg-rose-500" />
            </div>
          </div>
        </div>

        {/* Recent Submissions & Integrity Audit Table */}
        <div className="bg-slate-900 rounded-2xl p-6 mt-6 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <IconShieldCheck size={18} className="text-indigo-400" />
              <h2 className="font-display font-bold text-white text-base">Database Student Submissions Audit</h2>
            </div>
            <button
              onClick={loadDashboardData}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              <IconRefreshCw size={14} /> Refresh Data
            </button>
          </div>

          {loadingAnalytics ? (
            <div className="py-12 text-center text-slate-500 text-xs">Loading analytics data from MongoDB...</div>
          ) : recentSubmissions.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl font-medium">
              No student submissions recorded matching selected filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-800">
                    <th className="font-semibold px-3 py-3">Student Name</th>
                    <th className="font-semibold px-3 py-3">Exam Title</th>
                    <th className="font-semibold px-3 py-3">Score %</th>
                    <th className="font-semibold px-3 py-3">Status</th>
                    <th className="font-semibold px-3 py-3">Violations</th>
                    <th className="font-semibold px-3 py-3">Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubmissions.map((s, idx) => (
                    <tr key={s.id || idx} className="border-b border-slate-800/80 hover:bg-slate-800/50 transition-colors">
                      <td className="px-3 py-3.5 text-white font-semibold">
                        {s.student_name}
                        <span className="text-slate-500 text-xs block">ID: {s.student_id || "N/A"}</span>
                      </td>
                      <td className="px-3 py-3.5 text-slate-300">{s.exam_title}</td>
                      <td className="px-3 py-3.5 font-mono text-white font-bold">{Math.round(s.percentage || s.score || 0)}%</td>
                      <td className="px-3 py-3.5">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          s.status === "PASSED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }`}>
                          {s.status || "PASSED"}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 font-mono text-slate-300 font-bold">{s.violation_count ?? s.total_violations ?? 0}</td>
                      <td className="px-3 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${RISK_STYLE[s.risk_level] || RISK_STYLE.SAFE}`}>
                          {s.risk_level || "SAFE"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function BarBucket({ label, count, total, color }) {
  const pct = Math.round((count / Math.max(total, 1)) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1">
        <span>{label}</span>
        <span className="font-mono text-slate-400">{count} ({pct}%)</span>
      </div>
      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}
