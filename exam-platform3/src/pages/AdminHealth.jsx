import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { api } from "../utils/api";
import {
  IconActivity,
  IconCheckCircle,
  IconXCircle,
  IconRefreshCw,
  IconShieldCheck,
  IconDatabase,
  IconServer,
  IconLock,
  IconCpu
} from "../components/Icons";

export default function AdminHealth() {
  const [healthData, setHealthData] = useState(null);
  const [testing, setTesting] = useState(false);

  async function runSystemTest() {
    setTesting(true);
    try {
      const res = await api.getSystemHealthDetails();
      setHealthData(res);
    } catch (err) {
      setHealthData({
        status: "unhealthy",
        error: err.message || "Failed to reach backend diagnostic service.",
      });
    } finally {
      setTesting(false);
    }
  }

  useEffect(() => {
    runSystemTest();
  }, []);

  const checks = healthData?.checks || {};

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <Sidebar role="admin" />

      <main className="flex-1 min-w-0 px-5 sm:px-8 py-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Infrastructure Diagnostics</p>
            <h1 className="font-display text-3xl font-bold text-white mt-1">System Health & Services Diagnostic</h1>
            <p className="text-sm text-slate-400 mt-1">
              Live automated tests for MongoDB connection ping, FastAPI routers, JWT auth, exam engine, and TensorFlow AI proctoring model.
            </p>
          </div>

          <button
            onClick={runSystemTest}
            disabled={testing}
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-all disabled:opacity-50 shrink-0"
          >
            <IconRefreshCw size={16} className={testing ? "animate-spin" : ""} />
            {testing ? "Testing System..." : "Run System Test"}
          </button>
        </div>

        {/* Global Health Status Banner */}
        <div
          className={`rounded-2xl p-6 mt-6 border shadow-xl flex items-center gap-4 ${
            healthData?.status === "healthy"
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              : "bg-rose-950/40 border-rose-500/40 text-rose-300"
          }`}
        >
          <div
            className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${
              healthData?.status === "healthy" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
            }`}
          >
            {healthData?.status === "healthy" ? <IconCheckCircle size={32} /> : <IconXCircle size={32} />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 border border-current">
                {healthData?.status || "PENDING"}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Tested: {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleString() : "Never"}
              </span>
            </div>
            <h2 className="font-display font-bold text-xl text-white mt-1">
              {healthData?.status === "healthy"
                ? "All Core Examination Platform Systems Are Operational"
                : "System Diagnostic Alert Detected"}
            </h2>
          </div>
        </div>

        {/* Diagnostic Checks Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          <HealthCard
            icon={IconDatabase}
            title="Database Service"
            subtitle="MongoDB Connection Ping"
            status={checks.database?.status}
            details={checks.database?.details}
          />
          <HealthCard
            icon={IconServer}
            title="Backend Service"
            subtitle="FastAPI Core Framework"
            status={checks.backend?.status}
            details={checks.backend?.details}
          />
          <HealthCard
            icon={IconLock}
            title="Auth Service"
            subtitle="JWT Token & Role Verification"
            status={checks.auth_service?.status}
            details={checks.auth_service?.details}
          />
          <HealthCard
            icon={IconActivity}
            title="Exam Service"
            subtitle="Schedule & State Manager"
            status={checks.exam_service?.status}
            details={checks.exam_service?.details}
          />
          <HealthCard
            icon={IconActivity}
            title="Submission Engine"
            subtitle="Score & Grading Pipeline"
            status={checks.submission_service?.status}
            details={checks.submission_service?.details}
          />
          <HealthCard
            icon={IconCpu}
            title="AI Proctoring Model"
            subtitle="TensorFlow COCO-SSD Service"
            status={checks.ai_proctoring_model?.status}
            details={checks.ai_proctoring_model?.details}
          />
        </div>
      </main>
    </div>
  );
}

function HealthCard({ icon: Icon, title, subtitle, status, details }) {
  const isOk = status === "healthy" || status === "ok";
  return (
    <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center">
            <Icon size={20} />
          </div>
          <span
            className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
              isOk ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border-rose-500/30"
            }`}
          >
            {status || "UNKNOWN"}
          </span>
        </div>
        <h3 className="font-display font-bold text-white text-base">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs font-mono text-slate-300">
        {details || "No diagnostic details returned."}
      </div>
    </div>
  );
}
