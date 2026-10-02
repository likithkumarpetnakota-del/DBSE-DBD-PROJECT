// Thin localStorage wrapper — user-scoped persistence for exam sessions.

export function getSession() {
  try {
    const raw = localStorage.getItem("aep_session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getUserId() {
  try {
    const session = getSession();
    if (!session) return "guest";
    return session.student_id || session.rollNo || session.id || session.email || "guest";
  } catch {
    return "guest";
  }
}

const KEYS = {
  SESSION: "aep_session",
  ANSWERS: (examId) => `aep_answers_${getUserId()}_${examId}`,
  RESULT: (examId) => `aep_result_${getUserId()}_${examId}`,
  EXAM_META: () => `aep_exam_overrides_${getUserId()}`,
};

export function setSession(user) {
  localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(KEYS.SESSION);
}

export function getAnswers(examId) {
  try {
    const raw = localStorage.getItem(KEYS.ANSWERS(examId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveAnswer(examId, questionId, patch) {
  const current = getAnswers(examId);
  const next = { ...current, [questionId]: { ...current[questionId], ...patch } };
  localStorage.setItem(KEYS.ANSWERS(examId), JSON.stringify(next));
  return next;
}

export function clearAnswers(examId) {
  localStorage.removeItem(KEYS.ANSWERS(examId));
}

export function saveResult(examId, result) {
  localStorage.setItem(KEYS.RESULT(examId), JSON.stringify(result));
}

export function getResult(examId) {
  try {
    const raw = localStorage.getItem(KEYS.RESULT(examId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getExamOverrides() {
  try {
    const raw = localStorage.getItem(KEYS.EXAM_META());
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setExamOverride(examId, patch) {
  const current = getExamOverrides();
  const next = { ...current, [examId]: { ...current[examId], ...patch } };
  localStorage.setItem(KEYS.EXAM_META(), JSON.stringify(next));
  return next;
}

