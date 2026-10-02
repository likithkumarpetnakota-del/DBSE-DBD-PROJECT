import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import { api } from "../utils/api";
import { IconUser, IconPlus, IconX, IconCheckCircle, IconMail, IconBookOpen, IconTrash } from "../components/Icons";

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Add Student Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("Computer Science");
  const [year, setYear] = useState(4);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // Delete Confirm State
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getStudents();
      if (res && res.students) {
        setStudents(res.students);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  async function handleAddStudent(e) {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    if (!name || !email || !password || !studentId) {
      setModalError("Please fill out all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await api.createStudent({
        name,
        email,
        password,
        student_id: studentId,
        department,
        year: parseInt(year) || 1,
      });
      setModalSuccess("Student added successfully!");
      setTimeout(() => {
        setShowModal(false);
        setModalSuccess("");
        setName("");
        setEmail("");
        setPassword("");
        setStudentId("");
        fetchStudents();
      }, 1000);
    } catch (err) {
      setModalError(err.message || "Failed to create student.");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDeleteStudent() {
    if (!deletingStudent) return;
    setDeleteLoading(true);
    try {
      const targetId = deletingStudent.id || deletingStudent._id || deletingStudent.student_id || deletingStudent.email;
      await api.deleteStudent(targetId);
      setActionSuccess(`Removed student '${deletingStudent.name}' from system.`);
      setDeletingStudent(null);
      fetchStudents();
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err) {
      alert("Failed to remove student: " + (err.message || "Server error"));
    } finally {
      setDeleteLoading(false);
    }
  }


  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(search.toLowerCase()) ||
      s.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-navy-900">
      <Sidebar role="admin" />

      <main className="flex-1 min-w-0 px-5 sm:px-8 py-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="font-display text-3xl font-semibold text-indigo-950">Student Management</h1>
            <p className="text-sm text-purple-900/60 mt-1.5 font-medium">Manage enrolled student accounts, register new students, or remove access.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent-blue to-accent-violet px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-105 active:scale-95 shrink-0"
          >
            <IconPlus size={18} />
            Add Student
          </button>
        </div>

        {/* Action success alert */}
        {actionSuccess && (
          <p className="mt-4 text-xs text-status-safe bg-status-safe/10 border border-status-safe/25 rounded-lg px-4 py-3 animate-fade-in font-medium">
            {actionSuccess}
          </p>
        )}

        {/* Stats Overview */}
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          <StatCard icon={IconUser} label="Total Enrolled Students" value={students.length} accent="blue" />
          <StatCard icon={IconCheckCircle} label="Active Accounts" value={students.filter((s) => s.is_active !== false).length} accent="green" />
          <StatCard icon={IconBookOpen} label="Departments" value={new Set(students.map((s) => s.department)).size} accent="violet" />
        </div>

        {/* Table Container */}
        <div className="glass rounded-2xl p-6 mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="font-display font-semibold text-indigo-950 text-lg">Enrolled Students</h2>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, department..."
              className="focus-ring rounded-lg bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-purple-900/40 border border-purple-200/80 shadow-sm w-full sm:w-64"
            />
          </div>

          {loading ? (
            <div className="py-12 text-center text-purple-900/60 text-sm font-medium">Loading student records...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-purple-900/60 text-sm font-medium">
              No students found. Click "Add Student" to register a new student.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-left text-xs text-purple-900/60 border-b border-purple-100">
                    <th className="font-semibold px-3 py-3">Student Name</th>
                    <th className="font-semibold px-3 py-3">Student ID</th>
                    <th className="font-semibold px-3 py-3">Email</th>
                    <th className="font-semibold px-3 py-3">Department</th>
                    <th className="font-semibold px-3 py-3">Year</th>
                    <th className="font-semibold px-3 py-3">Status</th>
                    <th className="font-semibold px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.id || s.student_id} className="border-b border-purple-100/60 last:border-0 hover:bg-purple-50/50 transition-colors">
                      <td className="px-3 py-3.5 font-semibold text-indigo-950">{s.name}</td>
                      <td className="px-3 py-3.5 font-mono text-accent-cyan text-xs font-semibold">{s.student_id}</td>
                      <td className="px-3 py-3.5 text-purple-900/70 text-xs">{s.email}</td>
                      <td className="px-3 py-3.5 text-slate-800 text-xs font-medium">{s.department || "Computer Science"}</td>
                      <td className="px-3 py-3.5 text-purple-900/70 text-xs">Year {s.year || 1}</td>
                      <td className="px-3 py-3.5">
                        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full border text-status-safe bg-status-safe/10 border-status-safe/25">
                          Active
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <button
                          onClick={() => setDeletingStudent(s)}
                          title="Remove Student"
                          className="focus-ring inline-flex items-center gap-1 text-xs text-status-danger hover:text-red-700 bg-status-danger/10 hover:bg-status-danger/20 border border-status-danger/25 px-2.5 py-1.5 rounded-lg transition-colors font-medium"
                        >
                          <IconTrash size={14} />
                          <span>Remove</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-900/15 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md glass-strong rounded-2xl p-6 shadow-glow border border-status-danger/30">
            <div className="flex items-center gap-3 text-status-danger mb-4">
              <div className="h-10 w-10 rounded-xl bg-status-danger/15 flex items-center justify-center shrink-0">
                <IconTrash size={20} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg text-indigo-950">Remove Student Account</h3>
                <p className="text-xs text-purple-900/60 font-medium">Confirm permanent account removal.</p>
              </div>
            </div>

            <p className="text-sm text-slate-800 leading-relaxed mb-6">
              Are you sure you want to remove <span className="font-semibold text-indigo-950">{deletingStudent.name}</span> (<span className="font-mono text-accent-cyan text-xs font-semibold">{deletingStudent.student_id}</span>)? This will permanently revoke their examination access.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-100">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                disabled={deleteLoading}
                className="focus-ring px-4 py-2 text-xs font-medium text-purple-900/70 hover:text-indigo-950"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteStudent}
                disabled={deleteLoading}
                className="focus-ring rounded-lg bg-gradient-to-r from-status-danger to-red-600 px-4 py-2 text-xs font-semibold text-white shadow-glow disabled:opacity-50"
              >
                {deleteLoading ? "Removing..." : "Remove Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-900/15 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg glass-strong rounded-2xl p-6 sm:p-8 shadow-glow border border-purple-200/80">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-purple-900/60 hover:text-indigo-950 focus-ring rounded-lg p-1"
            >
              <IconX size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-6">
              <div className="h-9 w-9 rounded-xl bg-accent-blue/15 flex items-center justify-center text-accent-blue">
                <IconUser size={20} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg text-indigo-950">Add New Student</h3>
                <p className="text-xs text-purple-900/60 font-medium">Register a new student account into the system database.</p>
              </div>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-purple-950 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Likith Reddy"
                  className="focus-ring w-full rounded-lg bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 border border-purple-200/80 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-purple-950 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. likith.student@campus.edu"
                  className="focus-ring w-full rounded-lg bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 border border-purple-200/80 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-purple-950 mb-1">Student ID / Roll No *</label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. CS21B045"
                    className="focus-ring w-full rounded-lg bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 border border-purple-200/80 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-purple-950 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="focus-ring w-full rounded-lg bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 border border-purple-200/80 shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-purple-950 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="focus-ring w-full rounded-lg bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 border border-purple-200/80 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-purple-950 mb-1">Year of Study</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="focus-ring w-full rounded-lg bg-white px-3 py-2 text-sm text-slate-900 border border-purple-200/80 shadow-sm"
                  >
                    {[1, 2, 3, 4, 5].map((y) => (
                      <option key={y} value={y}>
                        Year {y}
                      </option>
                    ))}
                  </select>
                </div>
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
                  {submitting ? "Adding..." : "Save Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
