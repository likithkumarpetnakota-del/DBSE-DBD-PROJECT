import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { EXAMS } from "../data/mockData";
import { getAnswers, saveAnswer, clearAnswers, saveResult, setExamOverride } from "../utils/storage";
import { api } from "../utils/api";
import { useProctoringCamera } from "../hooks/useProctoringCamera";
import ProctoringPanel from "../components/ProctoringPanel";
import Timer from "../components/Timer";
import QuestionNav from "../components/QuestionNav";
import SubmitModal from "../components/SubmitModal";
import LeaveModal from "../components/LeaveModal";
import ViolationToast from "../components/ViolationToast";
import ResultView from "../components/ResultView";
import { IconChevronLeft, IconChevronRight, IconFlag, IconShieldCheck, IconAlertTriangle, IconLock, IconArrowRight, IconCheckCircle, IconLogOut } from "../components/Icons";

export default function ExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [liveExam, setLiveExam] = useState(null);
  const [liveQuestions, setLiveQuestions] = useState([]);
  const [loadingExam, setLoadingExam] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(() => getAnswers(examId));
  const [marked, setMarked] = useState(new Set());
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  // Server-authoritative timer state
  const [remainingSeconds, setRemainingSeconds] = useState(null);

  // Auto-ban & Unlock request states
  const [isBanned, setIsBanned] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(false);

  const [toasts, setToasts] = useState([]);
  const [violations, setViolations] = useState([]);
  const submitRef = useRef(null);
  const autoBannedRef = useRef(false);
  const sessionIdRef = useRef(null);
  const saveDebounceTimerRef = useRef(null);

  // Start / Restore Exam Session in MongoDB backend & fetch authoritative remaining time
  useEffect(() => {
    if (!examId) return;
    let isMounted = true;

    async function initSession() {
      try {
        // First check existing session
        const existingSession = await api.getMyExamSession(examId).catch(() => null);
        if (isMounted && existingSession && existingSession.id) {
          sessionIdRef.current = existingSession.id;
          if (existingSession.remaining_seconds !== undefined) {
            setRemainingSeconds(existingSession.remaining_seconds);
          }
          if (existingSession.saved_answers) {
            setAnswers((prev) => ({ ...existingSession.saved_answers, ...prev }));
          }
          if (existingSession.current_index !== undefined) {
            setCurrentIndex(existingSession.current_index);
          }
          if (existingSession.status === "Locked") {
            setIsBanned(true);
          }
          return;
        }

        // Start new session if no existing active session
        const res = await api.startExamSession(examId).catch(() => null);
        if (isMounted && res && res.session_id) {
          sessionIdRef.current = res.session_id;
          if (res.remaining_seconds !== undefined) {
            setRemainingSeconds(res.remaining_seconds);
          }
        }
      } catch (err) {
        console.warn("Could not init exam session in MongoDB", err);
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, [examId]);

  // Load Exam and Questions from backend API
  useEffect(() => {
    async function fetchExamData() {
      setLoadingExam(true);
      try {
        const [examRes, questionsRes, myRequestsRes] = await Promise.all([
          api.getExam(examId).catch(() => null),
          api.getQuestions(examId).catch(() => null),
          api.getMyRequests().catch(() => null),
        ]);

        if (examRes) {
          setLiveExam({
            id: examRes.id,
            title: examRes.title,
            subject: examRes.subject,
            durationMins: examRes.duration_minutes,
            totalMarks: examRes.total_marks,
            passingMarks: examRes.passing_marks,
          });
          if (remainingSeconds === null) {
            setRemainingSeconds((examRes.duration_minutes || 20) * 60);
          }
        }

        if (questionsRes && questionsRes.questions && questionsRes.questions.length > 0) {
          setLiveQuestions(
            questionsRes.questions.map((q) => ({
              id: q.id,
              text: q.question_text,
              options: q.options,
              answer: q.correct_option,
            }))
          );
        }

        if (myRequestsRes && myRequestsRes.requests) {
          const pending = myRequestsRes.requests.find(
            (r) => (r.exam_id === examId || r.exam_id === examRes?.id) && r.status === "pending"
          );
          if (pending) {
            setRequestSubmitted(true);
            setCurrentRequestId(pending.id);
          }
        }
      } catch (err) {
        console.warn("Using mock exam questions fallback", err);
      } finally {
        setLoadingExam(false);
      }
    }
    fetchExamData();
  }, [examId]);

  const mockExam = useMemo(() => EXAMS.find((e) => e.id === examId), [examId]);

  const activeExam = useMemo(() => {
    if (liveExam && liveQuestions.length > 0) {
      return { ...liveExam, questions: liveQuestions };
    }
    return mockExam || EXAMS[0];
  }, [liveExam, liveQuestions, mockExam]);

  const totalSeconds = (activeExam?.durationMins || 20) * 60;

  // Debounced auto-save function to sync answers with backend
  const triggerAutoSave = useCallback((updatedAnswers, idx) => {
    if (saveDebounceTimerRef.current) {
      clearTimeout(saveDebounceTimerRef.current);
    }
    saveDebounceTimerRef.current = setTimeout(() => {
      if (sessionIdRef.current) {
        api.autoSaveAnswers(sessionIdRef.current, updatedAnswers, idx).catch((err) =>
          console.warn("Auto-save failed:", err)
        );
      }
    }, 500);
  }, []);

  const logViolation = useCallback((message) => {
    setViolations((prev) => {
      const next = [...prev, { message, at: Date.now() }];
      const nextRisk = next.length >= 3 ? "High" : next.length >= 1 ? "Moderate" : "Low";
      if (sessionIdRef.current) {
        let violationType = "tab_switch";
        if (message.toLowerCase().includes("phone")) violationType = "phone_detected";
        else if (message.toLowerCase().includes("multiple") || message.toLowerCase().includes("people")) violationType = "multiple_faces";
        else if (message.toLowerCase().includes("no person") || message.toLowerCase().includes("camera")) violationType = "no_face";

        api
          .sendSessionViolation(sessionIdRef.current, {
            type: violationType,
            description: message,
            violation_count: next.length,
            risk_level: nextRisk,
          })
          .catch((err) => console.warn("Failed sending session violation", err));
      }
      return next;
    });

    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-2), { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  // Periodic session heartbeat timer (every 10s)
  useEffect(() => {
    if (submitted) return;

    const sendPing = () => {
      if (sessionIdRef.current) {
        const currentRisk = violations.length >= 3 ? "High" : violations.length >= 1 ? "Moderate" : "Low";
        const currentStatus = isBanned ? "Locked" : "In Progress";
        api
          .sendSessionHeartbeat(sessionIdRef.current, {
            violation_count: violations.length,
            risk_level: currentRisk,
            status: currentStatus,
          })
          .catch((e) => console.warn("Session heartbeat ping failed", e));
      }
    };

    const interval = setInterval(sendPing, 10000);
    return () => clearInterval(interval);
  }, [submitted, isBanned, violations.length]);

  // Tab switch detection
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden && !isBanned && !submitted) {
        logViolation("Tab switch detected — you navigated away from the exam window");
      }
    }
    window.addEventListener("visibilitychange", handleVisibility);
    return () => window.removeEventListener("visibilitychange", handleVisibility);
  }, [logViolation, isBanned, submitted]);

  // Proctoring camera hook
  const {
    videoRef,
    canvasRef,
    cameraActive,
    cameraError,
    modelStatus,
    faceDetected,
    phoneFlag,
    stop: stopCamera,
  } = useProctoringCamera({ onViolation: logViolation, enabled: !submitted && !isBanned });

  // Watch for 5 violations hard-ban threshold
  useEffect(() => {
    if (violations.length >= 5 && !autoBannedRef.current && !submitted) {
      autoBannedRef.current = true;
      setIsBanned(true);
      stopCamera();

      api.submitExam({
        exam_id: examId,
        answers: answers,
        violations: violations,
        total_violations: 5,
        risk_level: "High",
      }).catch((e) => console.warn("Failed auto-ban recording", e));

      setExamOverride(examId, { status: "banned", score: 0 });
    }
  }, [violations, submitted, examId, answers, stopCamera]);

  // Poll for unlock approval
  useEffect(() => {
    if (!isBanned) return;

    const checkApproval = async () => {
      try {
        const res = await api.getMyRequests();
        if (res && res.requests) {
          const approved = res.requests.find(
            (r) =>
              (r.id === currentRequestId || r.exam_id === examId || r.exam_id === activeExam?.id) &&
              r.status === "approved"
          );

          if (approved) {
            if (approved.id) {
              api.consumeRequest(approved.id).catch(() => null);
            }

            setIsBanned(false);
            setRequestSubmitted(false);
            setCurrentRequestId(null);
            autoBannedRef.current = false;
            setViolations([]);
            setUnlockReason("");

            const toastId = Math.random().toString(36).slice(2);
            setToasts((prev) => [
              ...prev,
              { id: toastId, message: "✅ Admin granted access! Your exam session is unlocked. You may resume writing." },
            ]);
            setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toastId)), 6000);
          }
        }
      } catch (err) {
        console.warn("Error polling unlock status:", err);
      }
    };

    const interval = setInterval(checkApproval, 2500);
    return () => clearInterval(interval);
  }, [isBanned, currentRequestId, examId, activeExam]);

  useEffect(() => {
    if (submitted || isBanned) stopCamera();
  }, [submitted, isBanned, stopCamera]);

  async function handleUnlockRequestSubmit(e) {
    e.preventDefault();
    if (!unlockReason || unlockReason.trim().length < 5) {
      setRequestError("Please explain what happened (minimum 5 characters).");
      return;
    }
    setRequestSubmitting(true);
    setRequestError("");
    try {
      const res = await api.submitUnlockRequest(examId, unlockReason);
      if (res && res.request_id) {
        setCurrentRequestId(res.request_id);
      }
      setRequestSubmitted(true);
    } catch (err) {
      setRequestError(err.message || "Failed to submit request to admin.");
    } finally {
      setRequestSubmitting(false);
    }
  }

  async function handleCheckStatusManual() {
    setCheckingStatus(true);
    try {
      const res = await api.getMyRequests();
      if (res && res.requests) {
        const approved = res.requests.find(
          (r) =>
            (r.id === currentRequestId || r.exam_id === examId || r.exam_id === activeExam?.id) &&
            r.status === "approved"
        );

        if (approved) {
          if (approved.id) {
            api.consumeRequest(approved.id).catch(() => null);
          }

          setIsBanned(false);
          setRequestSubmitted(false);
          setCurrentRequestId(null);
          autoBannedRef.current = false;
          setViolations([]);
          setUnlockReason("");

          const toastId = Math.random().toString(36).slice(2);
          setToasts((prev) => [
            ...prev,
            { id: toastId, message: "✅ Admin granted access! Your exam session is unlocked. You may resume writing." },
          ]);
          setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toastId)), 6000);
        } else {
          alert("Your request is still pending Admin approval. Please wait for the Admin to grant access.");
        }
      }
    } catch (err) {
      alert("Error checking status: " + err.message);
    } finally {
      setCheckingStatus(false);
    }
  }

  if (loadingExam && !activeExam) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 bg-slate-900">
        Loading examination environment...
      </div>
    );
  }

  if (!activeExam || !activeExam.questions || activeExam.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 bg-slate-900">
        Exam not found or has no questions available.
        <button className="text-indigo-400 ml-2 underline" onClick={() => navigate("/dashboard")}>
          Go back to dashboard
        </button>
      </div>
    );
  }

  // RENDER BANNED VIEW IF VIOLATIONS >= 5
  if (isBanned) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-2xl animate-slide-up">
          <div className="flex items-center gap-3 text-rose-600 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
              <IconLock size={24} />
            </div>
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-rose-600">
                Session Paused
              </span>
              <h1 className="font-display text-2xl font-bold text-slate-900">Exam Session Locked & Paused</h1>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Your examination session has been locked because you reached maximum security violations (<span className="font-mono text-rose-600 font-bold">5/5 violations</span>).
          </p>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6 space-y-2">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Recorded Violations ({violations.length}/5):</p>
            {violations.slice(0, 5).map((v, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-rose-600 font-medium">
                <IconAlertTriangle size={14} className="shrink-0" />
                <span>Violation {i + 1}: {v.message}</span>
              </div>
            ))}
          </div>

          {requestSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center space-y-3">
              <IconCheckCircle size={32} className="text-emerald-600 mx-auto animate-bounce" />
              <h3 className="font-display font-bold text-slate-900">Unlock Request Submitted</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your request is pending Admin review. Once approved, <span className="text-emerald-700 font-bold">your exam will automatically unlock here</span> without restarting!
              </p>
              
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleCheckStatusManual}
                  disabled={checkingStatus}
                  className="focus-ring rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {checkingStatus ? "Checking Admin Approval..." : "Check Status Now"}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUnlockRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Reason for violations *
                </label>
                <textarea
                  rows={4}
                  required
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  placeholder="Explain what caused these security triggers to request unlock..."
                  className="focus-ring w-full rounded-xl bg-white p-3 text-sm text-slate-900 border border-slate-300 shadow-sm"
                />
              </div>

              {requestError && (
                <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {requestError}
                </p>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(true)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                >
                  Exit Exam Page
                </button>
                <button
                  type="submit"
                  disabled={requestSubmitting}
                  className="focus-ring inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                >
                  {requestSubmitting ? "Sending..." : "Submit Unlock Request"}
                  {!requestSubmitting && <IconArrowRight size={16} />}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  const question = activeExam.questions[currentIndex] || activeExam.questions[0];
  const answeredCount = Object.values(answers).filter((a) => a?.selected !== undefined).length;

  function selectOption(optionIdx) {
    const next = saveAnswer(examId, question.id, { selected: optionIdx });
    setAnswers(next);
    triggerAutoSave(next, currentIndex);
  }

  function toggleMark() {
    setMarked((prev) => {
      const next = new Set(prev);
      next.has(question.id) ? next.delete(question.id) : next.add(question.id);
      return next;
    });
  }

  function goTo(idx) {
    const nextIdx = Math.max(0, Math.min(activeExam.questions.length - 1, idx));
    setCurrentIndex(nextIdx);
    triggerAutoSave(answers, nextIdx);
  }

  function computeLocalResult() {
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;
    activeExam.questions.forEach((q) => {
      const sel = answers[q.id]?.selected;
      if (sel === undefined) skipped += 1;
      else if (q.answer !== undefined && sel === q.answer) correct += 1;
      else if (q.answer !== undefined) incorrect += 1;
      else correct += 1;
    });
    return { correct, incorrect, skipped, total: activeExam.questions.length, violationCount: violations.length };
  }

  async function handleSubmit() {
    const riskLevel = violations.length >= 3 ? "High" : violations.length >= 1 ? "Moderate" : "Low";
    const localR = computeLocalResult();

    if (sessionIdRef.current) {
      api.submitExamSession(sessionIdRef.current).catch((err) => console.warn("Session submission error", err));
    }

    try {
      const subRes = await api.submitExam({
        exam_id: examId,
        answers: answers,
        violations: violations,
        total_violations: violations.length,
        risk_level: riskLevel,
      });

      const serverR = {
        correct: subRes.correct ?? localR.correct,
        incorrect: subRes.incorrect ?? localR.incorrect,
        skipped: subRes.skipped ?? localR.skipped,
        total: subRes.total ?? localR.total,
        score: subRes.score ?? localR.correct,
        total_marks: subRes.total_marks ?? activeExam.questions.length,
        percentage: subRes.percentage ?? Math.round((localR.correct / localR.total) * 100),
        status: subRes.status || (subRes.percentage >= (activeExam.passingMarks || 40) ? "PASSED" : "FAILED"),
        passing_marks: subRes.passing_marks || activeExam.passingMarks || 40,
        student_name: subRes.student_name,
        student_id: subRes.student_id,
        time_used_seconds: subRes.time_used_seconds,
        start_time: subRes.start_time,
        submission_time: subRes.submission_time,
        violation_count: subRes.violation_count ?? violations.length,
        risk_level: subRes.risk_level || riskLevel,
      };

      saveResult(examId, serverR);
      setExamOverride(examId, { status: "completed", score: Math.round(serverR.percentage) });
      clearAnswers(examId);
      setResult(serverR);
    } catch (err) {
      console.warn("Backend submission fallback to local computation", err);
      saveResult(examId, localR);
      setExamOverride(examId, { status: "completed", score: Math.round((localR.correct / localR.total) * 100) });
      clearAnswers(examId);
      setResult(localR);
    } finally {
      setSubmitted(true);
      setShowSubmitModal(false);
    }
  }
  submitRef.current = handleSubmit;

  const riskLevel = violations.length >= 3 ? "High" : violations.length >= 1 ? "Moderate" : "Low";

  if (submitted && result) {
    return <ResultView exam={activeExam} result={result} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <ViolationToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Navigation & Status Header */}
      <header className="sticky top-0 z-30 bg-slate-800/90 backdrop-blur-md border-b border-slate-700 px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="min-w-0 flex items-center gap-3">
          <button
            onClick={() => setShowLeaveModal(true)}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            title="Leave Examination"
          >
            <IconLogOut size={18} />
          </button>
          <div>
            <p className="text-[11px] text-indigo-400 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
              <IconShieldCheck size={13} className="text-emerald-400" /> AI-Proctored Session
            </p>
            <h1 className="font-display font-bold text-white text-sm sm:text-base truncate">{activeExam.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Timer totalSeconds={totalSeconds} remainingSeconds={remainingSeconds} onExpire={() => submitRef.current?.()} />
          <button
            onClick={() => setShowSubmitModal(true)}
            className="focus-ring rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md transition-all hover:scale-105 active:scale-95"
          >
            Submit Exam
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-6 grid lg:grid-cols-[1fr_290px] gap-6">
        {/* Main Question Card Column */}
        <div className="min-w-0 space-y-5">
          <div className="bg-slate-800/80 rounded-2xl p-6 sm:p-8 border border-slate-700 shadow-xl" key={question.id}>
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-700/60">
              <span className="text-xs font-mono font-semibold text-slate-400">
                Question {currentIndex + 1} of {activeExam.questions.length}
              </span>
              <button
                onClick={toggleMark}
                className={`focus-ring flex items-center gap-1.5 text-xs font-semibold rounded-full px-3.5 py-1.5 border transition-colors ${
                  marked.has(question.id)
                    ? "text-amber-400 bg-amber-400/10 border-amber-400/30"
                    : "text-slate-400 border-slate-600 hover:text-white hover:bg-slate-700"
                }`}
              >
                <IconFlag size={14} />
                {marked.has(question.id) ? "Marked for Review" : "Mark for Review"}
              </button>
            </div>

            <h2 className="font-display text-lg sm:text-xl text-white leading-relaxed font-bold">{question.text}</h2>

            {/* Multiple Choice Options */}
            <div className="mt-6 space-y-3">
              {question.options.map((opt, idx) => {
                const isSelected = answers[question.id]?.selected === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => selectOption(idx)}
                    className={`focus-ring w-full text-left flex items-center gap-3.5 rounded-xl border px-4 py-3.5 transition-all duration-150 ${
                      isSelected
                        ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md"
                        : "bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-500 hover:bg-slate-750"
                    }`}
                  >
                    <span
                      className={`h-7 w-7 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-600 text-slate-400"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className={`text-sm ${isSelected ? "text-white font-semibold" : "text-slate-300"}`}>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 disabled:opacity-40 hover:bg-slate-700 transition-colors shadow-sm"
            >
              <IconChevronLeft size={16} />
              Previous
            </button>
            <span className="text-xs text-slate-400 font-medium hidden sm:block">Answers save automatically</span>
            <button
              onClick={() => goTo(currentIndex + 1)}
              disabled={currentIndex === activeExam.questions.length - 1}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 disabled:opacity-40 hover:bg-slate-700 transition-colors shadow-sm"
            >
              Next
              <IconChevronRight size={16} />
            </button>
          </div>

          {/* Question Palette Grid */}
          <QuestionNav
            questions={activeExam.questions}
            currentIndex={currentIndex}
            answers={answers}
            marked={marked}
            onJump={goTo}
          />
        </div>

        {/* Proctoring Sidebar */}
        <div>
          <ProctoringPanel
            videoRef={videoRef}
            canvasRef={canvasRef}
            cameraActive={cameraActive}
            cameraError={cameraError}
            modelStatus={modelStatus}
            faceDetected={faceDetected}
            phoneFlag={phoneFlag}
            monitoringActive={!submitted && !isBanned}
            violationCount={violations.length}
            riskLevel={riskLevel}
          />
        </div>
      </div>

      <SubmitModal
        open={showSubmitModal}
        onCancel={() => setShowSubmitModal(false)}
        onConfirm={handleSubmit}
        answeredCount={answeredCount}
        totalCount={activeExam.questions.length}
        violationCount={violations.length}
      />

      <LeaveModal
        open={showLeaveModal}
        onCancel={() => setShowLeaveModal(false)}
        onConfirm={() => navigate("/dashboard")}
      />
    </div>
  );
}
