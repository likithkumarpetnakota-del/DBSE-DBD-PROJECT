const API_BASE_URL = "/api";

export function getToken() {
  return localStorage.getItem("aep_token") || null;
}

export function setToken(token) {
  if (token) {
    localStorage.setItem("aep_token", token);
  } else {
    localStorage.removeItem("aep_token");
  }
}

export function clearToken() {
  localStorage.removeItem("aep_token");
}

async function request(endpoint, options = {}) {
  const token = getToken() || "demo_student_token";
  const headers = {
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      let errorMsg = `Request failed with status ${response.status}`;
      if (typeof data.detail === "string") {
        errorMsg = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMsg = data.detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
      } else if (data.message) {
        errorMsg = data.message;
      }
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    if (err.message === "Failed to fetch" || err.name === "TypeError") {
      throw new Error("Unable to connect to backend server. Please verify backend server is running.");
    }
    throw err;
  }
}

export const api = {
  async login(email, password, role) {
    const res = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    });
    if (res.access_token) {
      setToken(res.access_token);
    }
    return res;
  },

  async register(userData) {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  async getMe() {
    return request("/auth/me");
  },

  // Students (Admin)
  async getStudents() {
    return request("/auth/students");
  },

  async createStudent(studentData) {
    return request("/auth/students", {
      method: "POST",
      body: JSON.stringify(studentData),
    });
  },

  async deleteStudent(studentId) {
    return request(`/auth/students/${studentId}`, {
      method: "DELETE",
    });
  },

  // Exams
  async getExams() {
    return request("/exams/");
  },

  async getExam(examId) {
    return request(`/exams/${examId}`);
  },

  async createExam(examData) {
    return request("/exams/", {
      method: "POST",
      body: JSON.stringify(examData),
    });
  },

  async deleteExam(examId) {
    return request(`/exams/${examId}`, {
      method: "DELETE",
    });
  },

  // Questions
  async getQuestions(examId) {
    return request(`/questions/exam/${examId}`);
  },

  async createQuestion(questionData) {
    return request("/questions/", {
      method: "POST",
      body: JSON.stringify(questionData),
    });
  },

  async previewQuestionImport(formData) {
    return request("/questions/import/preview", {
      method: "POST",
      body: formData,
    });
  },

  async commitQuestionImport(examId, questions) {
    return request("/questions/import", {
      method: "POST",
      body: JSON.stringify({ exam_id: examId, questions }),
    });
  },

  // Exam Sessions & Live Monitoring
  async startExamSession(examId) {
    return request("/exam-sessions/start", {
      method: "POST",
      body: JSON.stringify({ exam_id: examId }),
    });
  },

  async sendSessionHeartbeat(sessionId, heartbeatData) {
    return request(`/exam-sessions/${sessionId}/heartbeat`, {
      method: "POST",
      body: JSON.stringify(heartbeatData),
    });
  },

  async sendSessionViolation(sessionId, violationData) {
    return request(`/exam-sessions/${sessionId}/violation`, {
      method: "POST",
      body: JSON.stringify(violationData),
    });
  },

  async submitExamSession(sessionId) {
    return request(`/exam-sessions/${sessionId}/submit`, {
      method: "POST",
    });
  },

  async getExamLiveSessions(examId) {
    return request(`/exam-sessions/exam/${examId}`);
  },

  async getMyExamSession(examId) {
    return request(`/exam-sessions/my/${examId}`);
  },

  // Submissions
  async submitExam(submissionData) {
    return request("/submissions/", {
      method: "POST",
      body: JSON.stringify(submissionData),
    });
  },

  async getMySubmissions() {
    return request("/submissions/my");
  },

  async getAllSubmissions() {
    return request("/submissions/all");
  },

  async autoSaveAnswers(sessionId, answers, currentIndex = 0) {
    return request(`/exam-sessions/${sessionId}/answers`, {
      method: "POST",
      body: JSON.stringify({ answers, current_index: currentIndex }),
    });
  },

  // Unlock Requests
  async submitUnlockRequest(examId, reason) {
    return request("/requests/", {
      method: "POST",
      body: JSON.stringify({ exam_id: examId, reason }),
    });
  },

  async getPendingRequests() {
    return request("/requests/pending");
  },

  async getMyRequests() {
    return request("/requests/my");
  },

  async approveRequest(requestId) {
    return request(`/requests/${requestId}/approve`, {
      method: "POST",
    });
  },

  async consumeRequest(requestId) {
    return request(`/requests/${requestId}/consume`, {
      method: "POST",
    });
  },

  // Notifications
  async getNotifications() {
    return request("/notifications/");
  },

  async markNotificationRead(id) {
    return request(`/notifications/${id}/read`, {
      method: "POST",
    });
  },

  async markAllNotificationsRead() {
    return request("/notifications/read-all", {
      method: "POST",
    });
  },

  // System Health
  async getSystemHealthDetails() {
    return request("/health/details");
  },

  // Admin Analytics & Export
  async getAdminAnalytics(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/analytics/dashboard${query ? `?${query}` : ""}`);
  },

  async exportExamResults(examId = "all", format = "csv") {
    const token = getToken() || "";
    const response = await fetch(`/api/analytics/export?exam_id=${examId}&format=${format}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Export failed with status ${response.status}`);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Exam_Results_${examId}_${Date.now()}.${format === "excel" ? "xlsx" : format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Exam Review
  async getExamSubmissionsReview(examId) {
    return request(`/submissions/exam/${examId}`);
  },
};


