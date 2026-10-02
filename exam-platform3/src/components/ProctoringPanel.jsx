import { IconCamera, IconEye, IconShieldCheck, IconAlertTriangle, IconActivity, IconVideoOff } from "./Icons";

const RISK_STYLES = {
  Low: { text: "text-status-safe", bg: "bg-status-safe/10", border: "border-status-safe/25", dot: "bg-status-safe" },
  Moderate: { text: "text-status-warn", bg: "bg-status-warn/10", border: "border-status-warn/25", dot: "bg-status-warn" },
  High: { text: "text-status-danger", bg: "bg-status-danger/10", border: "border-status-danger/25", dot: "bg-status-danger" },
};

function StatusRow({ icon: Icon, label, ok, okLabel = "Active", badLabel = "Inactive" }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5 text-sm text-slate-700 font-medium">
        <Icon size={16} className={ok ? "text-status-safe" : "text-status-danger"} />
        {label}
      </div>
      <span
        className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
          ok ? "text-status-safe bg-status-safe/10" : "text-status-danger bg-status-danger/10"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-status-safe animate-pulse" : "bg-status-danger"}`} />
        {ok ? okLabel : badLabel}
      </span>
    </div>
  );
}

export default function ProctoringPanel({
  videoRef,
  canvasRef,
  cameraActive,
  cameraError,
  modelStatus,
  faceDetected,
  phoneFlag,
  monitoringActive,
  violationCount,
  riskLevel,
}) {
  const risk = RISK_STYLES[riskLevel] || RISK_STYLES.Low;
  const modelReady = modelStatus === "ready" || modelStatus === "fallback";

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-1 sticky top-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display font-semibold text-indigo-950 text-sm flex items-center gap-2">
          <IconShieldCheck size={16} className="text-accent-blue" />
          AI Proctoring
        </h3>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-blue opacity-60" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-blue" />
        </span>
      </div>

      {/* Real webcam feed with live detection overlay */}
      <div className="relative mt-2 aspect-video rounded-xl overflow-hidden bg-purple-100/60 border border-purple-200/80">
        <video
          ref={videoRef}
          muted
          playsInline
          className={`absolute inset-0 h-full w-full object-cover -scale-x-100 transition-opacity ${
            cameraActive ? "opacity-100" : "opacity-0"
          }`}
        />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full -scale-x-100 pointer-events-none" />

        {cameraActive && (
          <>
            <div className="absolute top-2 left-2 flex items-center gap-1.5 text-[10px] font-mono text-status-danger bg-white/80 backdrop-blur-md rounded px-1.5 py-0.5 shadow-sm border border-purple-100">
              <span className="h-1.5 w-1.5 rounded-full bg-status-danger animate-pulse" />
              REC
            </div>
            {!modelReady && (
              <div className="absolute bottom-2 left-2 right-2 text-[10px] font-mono text-purple-950 bg-white/90 backdrop-blur-md rounded px-1.5 py-1 text-center shadow-sm border border-purple-100 font-medium">
                {modelStatus === "error" ? "Detection model failed to load" : "Loading detection model…"}
              </div>
            )}
          </>
        )}

        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-slate-400 px-4 text-center">
            <IconVideoOff size={22} />
            <span className="text-[11px]">{cameraError || "Requesting camera access…"}</span>
          </div>
        )}
      </div>

      <div className="divide-y divide-purple-100 mt-1">
        <StatusRow icon={IconCamera} label="Camera" ok={cameraActive} />
        <StatusRow
          icon={IconEye}
          label="Person presence"
          ok={cameraActive && modelReady && faceDetected}
          okLabel="Verified"
          badLabel={!cameraActive ? "No feed" : !modelReady ? "Starting…" : "Not found"}
        />
        <StatusRow icon={IconActivity} label="Monitoring" ok={monitoringActive} okLabel="Live" badLabel="Paused" />
      </div>

      {phoneFlag && (
        <div className="flex items-center gap-2 text-xs text-status-danger bg-status-danger/10 border border-status-danger/25 rounded-lg px-3 py-2 mt-1">
          <IconAlertTriangle size={14} />
          Phone detected in current frame
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-purple-100">
        <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
          <IconAlertTriangle size={16} className={violationCount > 0 ? "text-status-warn" : "text-slate-400"} />
          Violations
        </div>
        <span className="font-mono text-sm font-semibold text-indigo-950">{violationCount}</span>
      </div>

      <div className={`mt-3 rounded-xl px-3.5 py-3 border ${risk.bg} ${risk.border}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-600 font-medium">Risk level</span>
          <span className={`flex items-center gap-1.5 text-sm font-semibold ${risk.text}`}>
            <span className={`h-2 w-2 rounded-full ${risk.dot}`} />
            {riskLevel}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-purple-900/60 mt-3 leading-relaxed">
        This session uses your camera for live candidate presence and environment monitoring. Video is processed securely in your browser to maintain examination integrity.
      </p>
    </div>
  );
}
