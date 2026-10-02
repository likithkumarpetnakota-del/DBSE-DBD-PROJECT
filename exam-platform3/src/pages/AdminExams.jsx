import { useState, useEffect, useCallback } from "react";
import { EXAMS, SUBJECT_META } from "../data/mockData";
import Sidebar from "../components/Sidebar";
import { api } from "../utils/api";
import {
  IconClock,
  IconFile,
  IconLayers,
  IconWifi,
  IconDatabase,
  IconCpu,
  IconBrain,
  IconCheckCircle,
  IconPlus,
  IconX,
  IconTrash,
  IconUpload,
  IconUser,
  IconAlertTriangle,
  IconEye,
  IconActivity,
  IconShieldCheck,
  IconLock,
} from "../components/Icons";

const ICONS = { layers: IconLayers, wifi: IconWifi, database: IconDatabase, cpu: IconCpu, brain: IconBrain };

const STATUS_STYLE = {
  active: "text-accent-blue bg-accent-blue/10 border-accent-blue/25",
  upcoming: "text-accent-blue bg-accent-blue/10 border-accent-blue/25",
  scheduled: "text-accent-blue bg-accent-blue/10 border-accent-blue/25",
  completed: "text-status-safe bg-status-safe/10 border-status-safe/25",
};

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state for Create Exam
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Data Structures & Algorithms");
  const [description, setDescription] = useState("");
  const [durationMins, setDurationMins] = useState(30);
  const [deadline, setDeadline] = useState(() =>
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );

  // Multi-questions list for Create Exam
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [randomizeOptions, setRandomizeOptions] = useState(true);

  const [questionsList, setQuestionsList] = useState([
    { question_text: "", options: ["", "", "", ""], correct_option: 0, marks: 1 },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  const [createModalFileImporting, setCreateModalFileImporting] = useState(false);
  const [createModalFileError, setCreateModalFileError] = useState("");

  async function handleAutoFillFromFile(file) {
    if (!file) return;
    setCreateModalFileError("");
    setModalSuccess("");
    setCreateModalFileImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.previewQuestionImport(formData);
      if (res && res.questions && res.questions.length > 0) {
        const formatted = res.questions.map((q) => ({
          question_text: q.question_text || "",
          options: q.options || ["Option A", "Option B", "Option C", "Option D"],
          correct_option: q.correct_option ?? 0,
          marks: q.marks || 1,
        }));
        setQuestionsList(formatted);
        setModalSuccess(`Successfully extracted and auto-filled ${formatted.length} questions from "${file.name}"!`);
      } else {
        setCreateModalFileError("No questions could be extracted from this file. Please check file format.");
      }
    } catch (err) {
      setCreateModalFileError(err.message || "Failed to parse question file.");
    } finally {
      setCreateModalFileImporting(false);
    }
  }

  // Modal state for Add Question manually to existing exam
  const [addQModalExam, setAddQModalExam] = useState(null);
  const [extraQText, setExtraQText] = useState("");
  const [extraOptA, setExtraOptA] = useState("");
  const [extraOptB, setExtraOptB] = useState("");
  const [extraOptC, setExtraOptC] = useState("");
  const [extraOptD, setExtraOptD] = useState("");
  const [extraCorrectOpt, setExtraCorrectOpt] = useState(0);
  const [extraSubmitting, setExtraSubmitting] = useState(false);
  const [extraError, setExtraError] = useState("");
  const [extraSuccess, setExtraSuccess] = useState("");

  // File Question Import Modal state
  const [importExam, setImportExam] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importWarnings, setImportWarnings] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");

  // Live Participant Monitoring Modal state
  const [liveSessionExam, setLiveSessionExam] = useState(null);
  const [liveSessions, setLiveSessions] = useState([]);
  const [liveStats, setLiveStats] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [selectedViolationSession, setSelectedViolationSession] = useState(null);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getExams();
      if (res && res.exams && res.exams.length > 0) {
        setExams(
          res.exams.map((e) => ({
            id: e.id,
            title: e.title,
            subject: e.subject,
            durationMins: e.duration_minutes,
            date: e.start_time ? e.start_time.split("T")[0] : "2026-08-25",
            endTime: e.end_time,
            status: e.status,
            questions: Array(e.total_questions || 1).fill({}),
          }))
        );
      } else {
        setExams(EXAMS);
      }
    } catch (e) {
      console.warn("Using mock fallback exams", e);
      setExams(EXAMS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  async function handleDeleteExam(examId, examTitle) {
    if (!window.confirm(`Are you sure you want to remove the exam "${examTitle}"? This will permanently delete the exam.`)) {
      return;
    }

    try {
      if (examId && !examId.startsWith("exam-")) {
        await api.deleteExam(examId);
      }
      setExams((prev) => prev.filter((e) => e.id !== examId && e.title !== examTitle));
    } catch (err) {
      alert("Failed to delete exam: " + (err.message || "Unknown error"));
    }
  }

  // Question list helpers for Create Exam
  const addQuestionField = () => {
    setQuestionsList((prev) => [
      ...prev,
      { question_text: "", options: ["", "", "", ""], correct_option: 0, marks: 1 },
    ]);
  };

  const removeQuestionField = (idx) => {
    if (questionsList.length <= 1) return;
    setQuestionsList((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestionText = (idx, text) => {
    setQuestionsList((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], question_text: text };
      return next;
    });
  };

  const updateQuestionOption = (qIdx, optIdx, val) => {
    setQuestionsList((prev) => {
      const next = [...prev];
      const newOpts = [...next[qIdx].options];
      newOpts[optIdx] = val;
      next[qIdx] = { ...next[qIdx], options: newOpts };
      return next;
    });
  };

  const updateQuestionCorrectOpt = (qIdx, correctOptIdx) => {
    setQuestionsList((prev) => {
      const next = [...prev];
      next[qIdx] = { ...next[qIdx], correct_option: parseInt(correctOptIdx) || 0 };
      return next;
    });
  };

  async function handleCreateExam(e) {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    if (!title || !subject || !deadline) {
      setModalError("Please complete exam title, subject, and deadline.");
      return;
    }

    for (let i = 0; i < questionsList.length; i++) {
      const q = questionsList[i];
      if (!q.question_text || !q.options[0] || !q.options[1]) {
        setModalError(`Question ${i + 1} requires question text and at least Option A and Option B.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const endTime = new Date(deadline);

      if (endTime <= now) {
        setModalError("Deadline must be set to a future date and time.");
        setSubmitting(false);
        return;
      }

      const totalMarks = questionsList.reduce((sum, q) => sum + (parseInt(q.marks) || 1), 0);

      // Create Exam
      const examRes = await api.createExam({
        title,
        subject,
        description: description || title,
        duration_minutes: parseInt(durationMins) || 30,
        total_marks: totalMarks,
        passing_marks: Math.ceil(totalMarks / 2),
        total_questions: questionsList.length,
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        randomize_questions: randomizeQuestions,
        randomize_options: randomizeOptions,
      });

      const examId = examRes.exam_id;

      // Add all questions sequentially
      for (const q of questionsList) {
        await api.createQuestion({
          exam_id: examId,
          question_text: q.question_text,
          options: [
            q.options[0],
            q.options[1],
            q.options[2] || "Option C",
            q.options[3] || "Option D",
          ],
          correct_option: parseInt(q.correct_option) || 0,
          marks: parseInt(q.marks) || 1,
          difficulty: "Medium",
          category: subject,
        });
      }

      setModalSuccess(`Exam created successfully with ${questionsList.length} questions!`);
      setTimeout(() => {
        setShowModal(false);
        setModalSuccess("");
        setTitle("");
        setDescription("");
        setQuestionsList([
          { question_text: "", options: ["", "", "", ""], correct_option: 0, marks: 1 },
        ]);
        fetchExams();
      }, 1000);
    } catch (err) {
      setModalError(err.message || "Failed to create exam.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddQuestionToExistingExam(e) {
    e.preventDefault();
    setExtraError("");
    setExtraSuccess("");

    if (!extraQText || !extraOptA || !extraOptB) {
      setExtraError("Please complete question text and at least 2 options.");
      return;
    }

    setExtraSubmitting(true);
    try {
      await api.createQuestion({
        exam_id: addQModalExam.id,
        question_text: extraQText,
        options: [extraOptA, extraOptB, extraOptC || "Option C", extraOptD || "Option D"],
        correct_option: parseInt(extraCorrectOpt) || 0,
        marks: 1,
        difficulty: "Medium",
        category: addQModalExam.subject || "General",
      });

      setExtraSuccess("New question added to exam successfully!");
      setTimeout(() => {
        setExtraQText("");
        setExtraOptA("");
        setExtraOptB("");
        setExtraOptC("");
        setExtraOptD("");
        setExtraSuccess("");
        setAddQModalExam(null);
        fetchExams();
      }, 900);
    } catch (err) {
      setExtraError(err.message || "Failed to add question to exam.");
    } finally {
      setExtraSubmitting(false);
    }
  }

  // Question File Import handlers
  async function handleFilePreview(e) {
    e.preventDefault();
    if (!importFile) {
      setImportError("Please select a file to import (.pdf, .docx, .txt, .csv).");
      return;
    }
    setImportError("");
    setImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const res = await api.previewQuestionImport(formData);
      if (res && res.questions) {
        setImportPreview(res.questions);
        setImportWarnings(res.warnings || []);
      } else {
        setImportError("No questions could be extracted from this file.");
      }
    } catch (err) {
      setImportError(err.message || "Failed to parse question file.");
    } finally {
      setImporting(false);
    }
  }

  const updateImportPreviewQuestion = (idx, field, val) => {
    setImportPreview((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const updateImportPreviewOption = (qIdx, optIdx, val) => {
    setImportPreview((prev) => {
      const next = [...prev];
      const newOpts = [...(next[qIdx].options || ["", "", "", ""])];
      newOpts[optIdx] = val;
      next[qIdx] = { ...next[qIdx], options: newOpts };
      return next;
    });
  };

  const removeImportPreviewQuestion = (idx) => {
    setImportPreview((prev) => prev.filter((_, i) => i !== idx));
  };

  const addImportPreviewQuestion = () => {
    setImportPreview((prev) => [
      ...(prev || []),
      {
        question_text: "",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correct_option: 0,
        marks: 1,
      },
    ]);
  };

  async function handleCommitImport() {
    if (!importExam || !importPreview || importPreview.length === 0) return;
    setImportError("");
    setImporting(true);
    try {
      await api.commitQuestionImport(importExam.id, importPreview);
      setImportSuccess(`Successfully imported ${importPreview.length} questions into "${importExam.title}"!`);
      setTimeout(() => {
        setImportExam(null);
        setImportFile(null);
        setImportPreview(null);
        setImportWarnings([]);
        setImportSuccess("");
        fetchExams();
      }, 1200);
    } catch (err) {
      setImportError(err.message || "Failed to save imported questions.");
    } finally {
      setImporting(false);
    }
  }

  // Live Participant Monitoring Polling
  const fetchLiveSessions = useCallback(async () => {
    if (!liveSessionExam) return;
    try {
      const res = await api.getExamLiveSessions(liveSessionExam.id);
      if (res) {
        const list = res.participants || res.sessions || [];
        setLiveSessions(list);
        setLiveStats({
          total_joined: res.total_joined ?? list.length,
          in_progress: res.writing ?? res.in_progress ?? 0,
          submitted: res.submitted ?? 0,
          locked: res.locked ?? 0,
          disconnected: res.disconnected ?? 0,
        });
      }
    } catch (err) {
      console.warn("Failed fetching live sessions", err);
    }
  }, [liveSessionExam]);

  useEffect(() => {
    if (!liveSessionExam) return;
    setLiveLoading(true);
    fetchLiveSessions().finally(() => setLiveLoading(false));

    const interval = setInterval(fetchLiveSessions, 5000);
    return () => clearInterval(interval);
  }, [liveSessionExam, fetchLiveSessions]);

  return (
    <div className="min-h-screen flex bg-navy-900">
      <Sidebar role="admin" />

      <main className="flex-1 min-w-0 px-5 sm:px-8 py-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="font-display text-3xl font-semibold text-indigo-950">Exams</h1>
            <p className="text-sm text-purple-900/60 mt-1.5 font-medium">All exams configured on the platform.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent-blue to-accent-violet px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-105 active:scale-95 shrink-0"
          >
            <IconPlus size={18} />
            Create Exam
          </button>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-8 pb-10">
          {exams.map((exam) => {
            const meta = SUBJECT_META[exam.subject] || { color: "#4f7cff", icon: "file" };
            const Icon = ICONS[meta.icon] || IconFile;
            const isConductedOrExpired = exam.status === "completed" || (exam.endTime && new Date(exam.endTime) < new Date());

            return (
              <div key={exam.id || exam.title} className="glass rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-medium px-2 py-1 rounded-full border ${isConductedOrExpired ? "text-status-safe bg-status-safe/10 border-status-safe/25" : STATUS_STYLE[exam.status] || STATUS_STYLE.active}`}>
                      {isConductedOrExpired ? "Conducted" : "Active"}
                    </span>
                    <button
                      onClick={() => handleDeleteExam(exam.id, exam.title)}
                      title="Remove Exam"
                      className="p-1.5 rounded-lg text-purple-900/40 hover:text-status-danger hover:bg-status-danger/10 transition-colors focus-ring"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-purple-900/60 font-medium">{exam.subject}</p>
                  <h3 className="font-display font-semibold text-indigo-950 mt-0.5 leading-snug">{exam.title}</h3>
                </div>

                <div className="flex items-center justify-between text-xs text-purple-900/70 font-medium">
                  <span className="flex items-center gap-1.5">
                    <IconClock size={13} /> {exam.durationMins} min
                  </span>
                  <span className="flex items-center gap-1.5">
                    <IconFile size={13} /> {exam.questions?.length || 1} questions
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-purple-100 gap-1 flex-wrap">
                  <span className="text-[11px] text-purple-900/60 font-medium truncate max-w-[120px]">
                    {exam.endTime
                      ? `Deadline: ${new Date(exam.endTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                      : exam.date || "Active Session"}
                  </span>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Live Monitoring Button */}
                    <button
                      onClick={() => setLiveSessionExam(exam)}
                      title="Monitor live participants logged into this exam"
                      className="focus-ring inline-flex items-center gap-1 rounded-lg bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue px-2.5 py-1 text-xs font-semibold transition-colors"
                    >
                      <span className="h-2 w-2 rounded-full bg-status-safe animate-pulse" />
                      Live Participants
                    </button>

                    {/* Question File Upload Button */}
                    {!isConductedOrExpired && exam.id && !exam.id.startsWith("exam-") && (
                      <button
                        onClick={() => {
                          setImportExam(exam);
                          setImportFile(null);
                          setImportPreview(null);
                          setImportWarnings([]);
                          setImportError("");
                          setImportSuccess("");
                        }}
                        title="Upload questions file (.pdf, .docx, .txt, .csv)"
                        className="focus-ring inline-flex items-center gap-1 rounded-lg bg-purple-100/80 hover:bg-purple-200/80 text-purple-950 px-2 py-1 text-xs font-semibold transition-colors"
                      >
                        <IconUpload size={12} /> Upload
                      </button>
                    )}

                    {/* Manual Add Question Button */}
                    {!isConductedOrExpired && exam.id && !exam.id.startsWith("exam-") && (
                      <button
                        onClick={() => setAddQModalExam(exam)}
                        title="Add single question manually"
                        className="focus-ring inline-flex items-center gap-1 rounded-lg bg-purple-100/80 hover:bg-purple-200/80 text-purple-950 px-2 py-1 text-xs font-semibold transition-colors"
                      >
                        <IconPlus size={12} /> Add Q
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Create New Exam Modal (Supports Multi-Questions) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-900/15 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl glass-strong rounded-2xl p-6 sm:p-8 shadow-glow border border-purple-200/80 my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-purple-900/60 hover:text-indigo-950 focus-ring rounded-lg p-1"
            >
              <IconX size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-6">
              <div className="h-9 w-9 rounded-xl bg-accent-blue/15 flex items-center justify-center text-accent-blue">
                <IconFile size={20} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg text-indigo-950">Create New Exam</h3>
                <p className="text-xs text-purple-900/60 font-medium">Configure exam details and add questions.</p>
              </div>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-purple-950 mb-1">Exam Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Operating Systems Final Exam"
                    className="focus-ring w-full rounded-lg bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 border border-purple-200/80 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-purple-950 mb-1">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="focus-ring w-full rounded-lg bg-white px-3 py-2 text-sm text-slate-900 border border-purple-200/80 shadow-sm"
                  >
                    <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                    <option value="Computer Networks">Computer Networks</option>
                    <option value="Database Management Systems">Database Management Systems</option>
                    <option value="Operating Systems">Operating Systems</option>
                    <option value="AI & Machine Learning">AI & Machine Learning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-purple-950 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={durationMins}
                    onChange={(e) => setDurationMins(e.target.value)}
                    className="focus-ring w-full rounded-lg bg-white px-3.5 py-2 text-sm text-slate-900 border border-purple-200/80 shadow-sm"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-purple-950 mb-1">Exam Deadline (End Date & Time) *</label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="focus-ring w-full rounded-lg bg-white px-3.5 py-2 text-sm text-slate-900 border border-purple-200/80 shadow-sm"
                  />
                </div>

                <div className="col-span-2 flex items-center gap-6 py-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-indigo-950 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={randomizeQuestions}
                      onChange={(e) => setRandomizeQuestions(e.target.checked)}
                      className="rounded border-purple-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    Randomize Question Order
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-indigo-950 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={randomizeOptions}
                      onChange={(e) => setRandomizeOptions(e.target.checked)}
                      className="rounded border-purple-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    Randomize Option Order
                  </label>
                </div>
              </div>

              {/* Multi-Question Builder with Auto-Fill from File Option */}
              <div className="pt-4 border-t border-purple-100 space-y-4">
                {/* Auto-Fill Questions from Document File */}
                <div className="bg-purple-50/90 rounded-2xl p-4 border border-purple-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-950 flex items-center gap-1.5">
                      <IconUpload size={14} className="text-accent-blue" />
                      Auto-Fill Questions from File (.pdf, .docx, .txt, .csv)
                    </span>
                    {createModalFileImporting && (
                      <span className="text-xs text-accent-blue font-semibold animate-pulse">
                        Extracting Questions...
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-purple-900/70">
                    Don't want to type each question manually? Choose a file to parse and auto-populate all questions directly into this form.
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.csv"
                    disabled={createModalFileImporting}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleAutoFillFromFile(e.target.files[0]);
                      }
                    }}
                    className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-accent-blue/15 file:text-accent-blue hover:file:bg-accent-blue/25"
                  />
                  {createModalFileError && (
                    <p className="text-xs text-status-danger font-medium mt-1">
                      {createModalFileError}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <h4 className="text-xs font-semibold text-accent-blue uppercase tracking-wider">
                    Exam Questions ({questionsList.length})
                  </h4>
                  <button
                    type="button"
                    onClick={addQuestionField}
                    className="focus-ring inline-flex items-center gap-1 rounded-lg bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 px-3 py-1.5 text-xs font-semibold transition-colors"
                  >
                    <IconPlus size={14} /> Add Another Question
                  </button>
                </div>

                {questionsList.map((q, idx) => (
                  <div key={idx} className="bg-purple-50/70 rounded-xl p-4 border border-purple-100 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-purple-900/80 font-mono">
                        Question #{idx + 1}
                      </span>
                      {questionsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestionField(idx)}
                          className="text-status-danger hover:text-status-danger/80 text-xs font-medium focus-ring rounded p-1"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div>
                      <input
                        type="text"
                        required
                        value={q.question_text}
                        onChange={(e) => updateQuestionText(idx, e.target.value)}
                        placeholder={`Question ${idx + 1} text...`}
                        className="focus-ring w-full rounded-lg bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 border border-purple-200/80 shadow-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={q.options[0]}
                        onChange={(e) => updateQuestionOption(idx, 0, e.target.value)}
                        placeholder="Option A"
                        className="focus-ring rounded-lg bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 border border-purple-200/80 shadow-sm"
                      />
                      <input
                        type="text"
                        required
                        value={q.options[1]}
                        onChange={(e) => updateQuestionOption(idx, 1, e.target.value)}
                        placeholder="Option B"
                        className="focus-ring rounded-lg bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 border border-purple-200/80 shadow-sm"
                      />
                      <input
                        type="text"
                        value={q.options[2]}
                        onChange={(e) => updateQuestionOption(idx, 2, e.target.value)}
                        placeholder="Option C"
                        className="focus-ring rounded-lg bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 border border-purple-200/80 shadow-sm"
                      />
                      <input
                        type="text"
                        value={q.options[3]}
                        onChange={(e) => updateQuestionOption(idx, 3, e.target.value)}
                        placeholder="Option D"
                        className="focus-ring rounded-lg bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 border border-purple-200/80 shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-purple-950 mb-1">Correct Answer Option</label>
                      <select
                        value={q.correct_option}
                        onChange={(e) => updateQuestionCorrectOpt(idx, e.target.value)}
                        className="focus-ring w-full rounded-lg bg-white px-3 py-1.5 text-xs text-slate-900 border border-purple-200/80 shadow-sm"
                      >
                        <option value="0">Option A (Index 0)</option>
                        <option value="1">Option B (Index 1)</option>
                        <option value="2">Option C (Index 2)</option>
                        <option value="3">Option D (Index 3)</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {modalError && (
                <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/25 rounded-lg px-3 py-2 font-medium">
                  {modalError}
                </p>
              )}

              {modalSuccess && (
                <p className="text-xs text-status-safe bg-status-safe/10 border border-status-safe/25 rounded-lg px-3 py-2 font-medium">
                  {modalSuccess}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="focus-ring px-4 py-2 text-sm font-medium text-purple-900/70 hover:text-indigo-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="focus-ring rounded-lg bg-gradient-to-r from-accent-blue to-accent-violet px-5 py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
                >
                  {submitting ? "Saving Exam..." : `Create Exam (${questionsList.length} Qs)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Question to Existing Exam Modal */}
      {addQModalExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-900/15 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg glass-strong rounded-2xl p-6 sm:p-8 shadow-glow border border-purple-200/80">
            <button
              onClick={() => setAddQModalExam(null)}
              className="absolute top-5 right-5 text-purple-900/60 hover:text-indigo-950 focus-ring rounded-lg p-1"
            >
              <IconX size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="h-9 w-9 rounded-xl bg-accent-blue/15 flex items-center justify-center text-accent-blue">
                <IconPlus size={20} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg text-indigo-950">Add Question</h3>
                <p className="text-xs text-purple-900/60 font-medium">Adding question to: <span className="font-semibold text-indigo-950">{addQModalExam.title}</span></p>
              </div>
            </div>

            <form onSubmit={handleAddQuestionToExistingExam} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-purple-950 mb-1">Question Text *</label>
                <input
                  type="text"
                  required
                  value={extraQText}
                  onChange={(e) => setExtraQText(e.target.value)}
                  placeholder="Enter the question text..."
                  className="focus-ring w-full rounded-lg bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 border border-purple-200/80 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={extraOptA}
                  onChange={(e) => setExtraOptA(e.target.value)}
                  placeholder="Option A"
                  className="focus-ring rounded-lg bg-white px-3 py-1.5 text-xs text-slate-900 border border-purple-200/80 shadow-sm"
                />
                <input
                  type="text"
                  required
                  value={extraOptB}
                  onChange={(e) => setExtraOptB(e.target.value)}
                  placeholder="Option B"
                  className="focus-ring rounded-lg bg-white px-3 py-1.5 text-xs text-slate-900 border border-purple-200/80 shadow-sm"
                />
                <input
                  type="text"
                  value={extraOptC}
                  onChange={(e) => setExtraOptC(e.target.value)}
                  placeholder="Option C"
                  className="focus-ring rounded-lg bg-white px-3 py-1.5 text-xs text-slate-900 border border-purple-200/80 shadow-sm"
                />
                <input
                  type="text"
                  value={extraOptD}
                  onChange={(e) => setExtraOptD(e.target.value)}
                  placeholder="Option D"
                  className="focus-ring rounded-lg bg-white px-3 py-1.5 text-xs text-slate-900 border border-purple-200/80 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-purple-950 mb-1">Correct Answer Option</label>
                <select
                  value={extraCorrectOpt}
                  onChange={(e) => setExtraCorrectOpt(e.target.value)}
                  className="focus-ring w-full rounded-lg bg-white px-3 py-1.5 text-xs text-slate-900 border border-purple-200/80 shadow-sm"
                >
                  <option value="0">Option A (Index 0)</option>
                  <option value="1">Option B (Index 1)</option>
                  <option value="2">Option C (Index 2)</option>
                  <option value="3">Option D (Index 3)</option>
                </select>
              </div>

              {extraError && (
                <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/25 rounded-lg px-3 py-2 font-medium">
                  {extraError}
                </p>
              )}

              {extraSuccess && (
                <p className="text-xs text-status-safe bg-status-safe/10 border border-status-safe/25 rounded-lg px-3 py-2 font-medium">
                  {extraSuccess}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-100">
                <button
                  type="button"
                  onClick={() => setAddQModalExam(null)}
                  className="focus-ring px-4 py-2 text-xs font-medium text-purple-900/70 hover:text-indigo-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={extraSubmitting}
                  className="focus-ring rounded-lg bg-gradient-to-r from-accent-blue to-accent-violet px-4 py-2 text-xs font-semibold text-white shadow-glow disabled:opacity-50"
                >
                  {extraSubmitting ? "Adding..." : "Add Question to Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question File Upload & Interactive Preview Modal */}
      {importExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-900/20 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-3xl glass-strong rounded-2xl p-6 sm:p-8 shadow-glow border border-purple-200/80 my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setImportExam(null);
                setImportFile(null);
                setImportPreview(null);
                setImportWarnings([]);
              }}
              className="absolute top-5 right-5 text-purple-900/60 hover:text-indigo-950 focus-ring rounded-lg p-1"
            >
              <IconX size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-accent-blue/15 flex items-center justify-center text-accent-blue shrink-0">
                <IconUpload size={22} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-xl text-indigo-950">Import Questions File</h3>
                <p className="text-xs text-purple-900/60 font-medium">
                  Uploading to exam: <span className="font-semibold text-indigo-950">{importExam.title}</span>
                </p>
              </div>
            </div>

            {!importPreview ? (
              <form onSubmit={handleFilePreview} className="space-y-5">
                <div className="border-2 border-dashed border-purple-200/80 rounded-2xl p-6 sm:p-8 text-center bg-white/50 hover:bg-white/80 transition-colors">
                  <IconFile size={36} className="mx-auto text-accent-blue/70 mb-3" />
                  <p className="text-sm font-semibold text-indigo-950">Choose a document file to parse</p>
                  <p className="text-xs text-purple-900/60 mt-1 mb-4">Supported formats: PDF (.pdf), Word (.docx), Plain Text (.txt), CSV (.csv)</p>
                  
                  <input
                    type="file"
                    required
                    accept=".pdf,.docx,.txt,.csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="block w-full max-w-xs mx-auto text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-accent-blue/15 file:text-accent-blue hover:file:bg-accent-blue/25"
                  />
                  {importFile && (
                    <p className="text-xs text-status-safe font-semibold mt-3">Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)</p>
                  )}
                </div>

                <div className="bg-purple-50/70 rounded-xl p-4 border border-purple-100 text-xs text-purple-900/80 space-y-1.5">
                  <p className="font-semibold text-indigo-950 mb-1">💡 Supported File Formats:</p>
                  <p>• <b>PDF / DOCX / TXT:</b> Format questions as "1. Question text" followed by "A) Option 1", "B) Option 2", etc. Mark correct choice with "Answer: A".</p>
                  <p>• <b>CSV:</b> Columns should be <code>question_text, option_a, option_b, option_c, option_d, correct_option</code></p>
                </div>

                {importError && (
                  <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/25 rounded-lg px-3 py-2 font-medium">
                    {importError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-100">
                  <button
                    type="button"
                    onClick={() => setImportExam(null)}
                    className="focus-ring px-4 py-2 text-xs font-medium text-purple-900/70 hover:text-indigo-950"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={importing || !importFile}
                    className="focus-ring rounded-xl bg-gradient-to-r from-accent-blue to-accent-violet px-5 py-2.5 text-xs font-semibold text-white shadow-glow disabled:opacity-50"
                  >
                    {importing ? "Parsing Document..." : "Extract & Preview Questions"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-display font-semibold text-indigo-950 text-base">
                      Parsed Questions Preview ({importPreview.length})
                    </h4>
                    <p className="text-xs text-purple-900/60 font-medium">
                      Review, edit, or remove extracted questions before saving to the database.
                    </p>
                  </div>
                  <button
                    onClick={addImportPreviewQuestion}
                    className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 px-3 py-1.5 text-xs font-semibold transition-colors"
                  >
                    <IconPlus size={14} /> Add Question
                  </button>
                </div>

                {importWarnings && importWarnings.length > 0 && (
                  <div className="bg-status-warn/10 border border-status-warn/30 rounded-xl p-3.5 text-xs text-purple-950 space-y-1">
                    <p className="font-semibold text-status-warn flex items-center gap-1.5">
                      <IconAlertTriangle size={14} /> Parser Suggestions ({importWarnings.length}):
                    </p>
                    {importWarnings.map((w, idx) => (
                      <p key={idx} className="text-purple-900/80 pl-5">• {w}</p>
                    ))}
                  </div>
                )}

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                  {importPreview.map((q, idx) => (
                    <div key={idx} className="bg-purple-50/70 rounded-xl p-4 border border-purple-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold text-purple-900/80">Question #{idx + 1}</span>
                        <button
                          onClick={() => removeImportPreviewQuestion(idx)}
                          className="text-status-danger hover:text-status-danger/80 text-xs font-medium focus-ring rounded p-1"
                        >
                          Remove
                        </button>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-purple-950 mb-1">Question Text</label>
                        <textarea
                          rows={2}
                          value={q.question_text || ""}
                          onChange={(e) => updateImportPreviewQuestion(idx, "question_text", e.target.value)}
                          className="focus-ring w-full rounded-lg bg-white px-3 py-1.5 text-xs text-slate-900 border border-purple-200/80 shadow-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {(q.options || ["", "", "", ""]).map((opt, optIdx) => (
                          <div key={optIdx}>
                            <label className="block text-[10px] text-purple-900/60 font-medium mb-0.5">Option {String.fromCharCode(65 + optIdx)}</label>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => updateImportPreviewOption(idx, optIdx, e.target.value)}
                              className="focus-ring w-full rounded-lg bg-white px-3 py-1.5 text-xs text-slate-900 border border-purple-200/80 shadow-sm"
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-purple-950 mb-1">Correct Answer</label>
                        <select
                          value={q.correct_option ?? 0}
                          onChange={(e) => updateImportPreviewQuestion(idx, "correct_option", parseInt(e.target.value))}
                          className="focus-ring w-full rounded-lg bg-white px-3 py-1.5 text-xs text-slate-900 border border-purple-200/80 shadow-sm"
                        >
                          <option value="0">Option A (Index 0)</option>
                          <option value="1">Option B (Index 1)</option>
                          <option value="2">Option C (Index 2)</option>
                          <option value="3">Option D (Index 3)</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                {importError && (
                  <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/25 rounded-lg px-3 py-2 font-medium">
                    {importError}
                  </p>
                )}

                {importSuccess && (
                  <p className="text-xs text-status-safe bg-status-safe/10 border border-status-safe/25 rounded-lg px-3 py-2 font-medium">
                    {importSuccess}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-purple-100">
                  <button
                    type="button"
                    onClick={() => {
                      setImportPreview(null);
                      setImportFile(null);
                    }}
                    className="focus-ring text-xs text-purple-900/70 hover:text-indigo-950 font-medium"
                  >
                    ← Choose Different File
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setImportExam(null)}
                      className="focus-ring px-4 py-2 text-xs font-medium text-purple-900/70 hover:text-indigo-950"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCommitImport}
                      disabled={importing || importPreview.length === 0}
                      className="focus-ring rounded-xl bg-gradient-to-r from-accent-blue to-accent-violet px-5 py-2.5 text-xs font-semibold text-white shadow-glow disabled:opacity-50"
                    >
                      {importing ? "Saving Questions..." : `Import ${importPreview.length} Questions to Exam`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Participant Monitoring Modal */}
      {liveSessionExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-900/20 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-4xl glass-strong rounded-2xl p-6 sm:p-8 shadow-glow border border-purple-200/80 my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setLiveSessionExam(null);
                setLiveSessions([]);
                setLiveStats(null);
                setSelectedViolationSession(null);
              }}
              className="absolute top-5 right-5 text-purple-900/60 hover:text-indigo-950 focus-ring rounded-lg p-1"
            >
              <IconX size={18} />
            </button>

            <div className="flex items-center justify-between mb-6 pr-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent-blue/15 flex items-center justify-center text-accent-blue shrink-0">
                  <IconEye size={22} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-xl text-indigo-950">Live Exam Participants</h3>
                  <p className="text-xs text-purple-900/60 font-medium">
                    Monitoring: <span className="font-semibold text-indigo-950">{liveSessionExam.title}</span> (Auto-refreshing every 5s)
                  </p>
                </div>
              </div>

              <button
                onClick={fetchLiveSessions}
                className="focus-ring rounded-lg bg-purple-100/80 hover:bg-purple-200/80 text-purple-950 px-3 py-1.5 text-xs font-semibold transition-colors shrink-0"
              >
                Refresh Now
              </button>
            </div>

            {/* Summary Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              <div className="glass rounded-xl p-3 border border-purple-100 text-center">
                <span className="text-[10px] text-purple-900/60 font-semibold uppercase tracking-wider block">Total Joined</span>
                <span className="font-mono text-xl font-bold text-indigo-950">{liveStats?.total_joined || 0}</span>
              </div>
              <div className="glass rounded-xl p-3 border border-purple-100 text-center">
                <span className="text-[10px] text-accent-blue font-semibold uppercase tracking-wider block">Writing (In Progress)</span>
                <span className="font-mono text-xl font-bold text-accent-blue">{liveStats?.in_progress || 0}</span>
              </div>
              <div className="glass rounded-xl p-3 border border-purple-100 text-center">
                <span className="text-[10px] text-status-safe font-semibold uppercase tracking-wider block">Submitted</span>
                <span className="font-mono text-xl font-bold text-status-safe">{liveStats?.submitted || 0}</span>
              </div>
              <div className="glass rounded-xl p-3 border border-purple-100 text-center">
                <span className="text-[10px] text-status-danger font-semibold uppercase tracking-wider block">Locked / Banned</span>
                <span className="font-mono text-xl font-bold text-status-danger">{liveStats?.locked || 0}</span>
              </div>
              <div className="glass rounded-xl p-3 border border-purple-100 text-center">
                <span className="text-[10px] text-status-warn font-semibold uppercase tracking-wider block">Disconnected</span>
                <span className="font-mono text-xl font-bold text-status-warn">{liveStats?.disconnected || 0}</span>
              </div>
            </div>

            {/* Live Participants Table */}
            {liveLoading && liveSessions.length === 0 ? (
              <div className="py-12 text-center text-sm text-purple-900/60">
                Fetching live participant sessions from database…
              </div>
            ) : liveSessions.length === 0 ? (
              <div className="py-12 text-center text-slate-500 bg-purple-50/50 rounded-2xl border border-purple-100">
                <IconUser size={32} className="mx-auto text-purple-300 mb-2" />
                <p className="text-sm font-semibold text-indigo-950">No students have logged into this exam yet</p>
                <p className="text-xs text-purple-900/60 mt-1">When students open and begin writing this exam, their live entry status will appear here in real-time.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-purple-200/80 bg-white/70 shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-purple-100 bg-purple-50/80 text-[11px] font-semibold text-purple-900/70 uppercase tracking-wider">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Joined At</th>
                      <th className="py-3 px-4">Last Active Ping</th>
                      <th className="py-3 px-4">Violations & Risk</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 text-xs">
                    {liveSessions.map((s) => {
                      const isDisconnected = s.status === "Disconnected";
                      const isLocked = s.status === "Locked";
                      const isSubmitted = s.status === "Submitted";

                      return (
                        <tr key={s.id} className="hover:bg-purple-50/40 transition-colors">
                          <td className="py-3 px-4 font-medium text-indigo-950">
                            <div>
                              <p className="font-semibold text-sm">{s.student_name || "Student"}</p>
                              <p className="text-[11px] text-purple-900/60 font-mono">{s.student_email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                isSubmitted
                                  ? "text-status-safe bg-status-safe/10 border-status-safe/25"
                                  : isLocked
                                  ? "text-status-danger bg-status-danger/10 border-status-danger/25"
                                  : isDisconnected
                                  ? "text-status-warn bg-status-warn/10 border-status-warn/25"
                                  : "text-accent-blue bg-accent-blue/10 border-accent-blue/25"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isSubmitted
                                    ? "bg-status-safe"
                                    : isLocked
                                    ? "bg-status-danger"
                                    : isDisconnected
                                    ? "bg-status-warn"
                                    : "bg-accent-blue animate-pulse"
                                }`}
                              />
                              {s.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-purple-900/70">
                            {s.joined_at ? new Date(s.joined_at).toLocaleTimeString() : "—"}
                          </td>
                          <td className="py-3 px-4 font-mono text-purple-900/70">
                            {s.last_ping ? new Date(s.last_ping).toLocaleTimeString() : "Active"}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">{s.violation_count} violations</span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  s.risk_level === "High"
                                    ? "text-status-danger bg-status-danger/10"
                                    : s.risk_level === "Moderate"
                                    ? "text-status-warn bg-status-warn/10"
                                    : "text-status-safe bg-status-safe/10"
                                }`}
                              >
                                {s.risk_level} Risk
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedViolationSession(s)}
                              className="focus-ring text-accent-blue hover:underline font-semibold"
                            >
                              View Logs ({s.violations?.length || 0})
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Violation Logs Sub-Modal */}
      {selectedViolationSession && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-purple-900/30 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg glass-strong rounded-2xl p-6 shadow-glow border border-purple-200/80">
            <button
              onClick={() => setSelectedViolationSession(null)}
              className="absolute top-5 right-5 text-purple-900/60 hover:text-indigo-950 focus-ring rounded-lg p-1"
            >
              <IconX size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 rounded-xl bg-status-danger/15 flex items-center justify-center text-status-danger">
                <IconAlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-base text-indigo-950">Recorded Violation Logs</h3>
                <p className="text-xs text-purple-900/60 font-medium">Student: {selectedViolationSession.student_name}</p>
              </div>
            </div>

            <div className="bg-purple-50/70 rounded-xl p-4 border border-purple-100 max-h-60 overflow-y-auto space-y-2.5">
              {(!selectedViolationSession.violations || selectedViolationSession.violations.length === 0) ? (
                <p className="text-xs text-status-safe font-semibold text-center py-4">✅ Clean session — no violations recorded.</p>
              ) : (
                selectedViolationSession.violations.map((v, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-800 border-b border-purple-100 pb-2 last:border-0">
                    <IconAlertTriangle size={14} className="text-status-danger shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-indigo-950">{v.description || v.type}</p>
                      <p className="text-[10px] text-purple-900/60 font-mono">
                        {v.timestamp ? new Date(v.timestamp).toLocaleString() : "Logged during exam"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setSelectedViolationSession(null)}
                className="focus-ring rounded-lg bg-gradient-to-r from-accent-blue to-accent-violet px-4 py-2 text-xs font-semibold text-white shadow-glow"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
