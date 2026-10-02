import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import MyExams from "./pages/MyExams";
import Profile from "./pages/Profile";
import ExamPage from "./pages/ExamPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminExams from "./pages/AdminExams";
import AdminStudents from "./pages/AdminStudents";
import AdminReview from "./pages/AdminReview";
import AdminHealth from "./pages/AdminHealth";

function Protected({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          <Protected role="student">
            <StudentDashboard />
          </Protected>
        }
      />
      <Route
        path="/exams"
        element={
          <Protected role="student">
            <MyExams />
          </Protected>
        }
      />
      <Route
        path="/profile"
        element={
          <Protected role="student">
            <Profile />
          </Protected>
        }
      />
      <Route
        path="/exam/:examId"
        element={
          <Protected role="student">
            <ExamPage />
          </Protected>
        }
      />
      <Route
        path="/admin"
        element={
          <Protected role="admin">
            <AdminDashboard />
          </Protected>
        }
      />
      <Route
        path="/admin/exams"
        element={
          <Protected role="admin">
            <AdminExams />
          </Protected>
        }
      />
      <Route
        path="/admin/review"
        element={
          <Protected role="admin">
            <AdminReview />
          </Protected>
        }
      />
      <Route
        path="/admin/health"
        element={
          <Protected role="admin">
            <AdminHealth />
          </Protected>
        }
      />
      <Route
        path="/admin/students"
        element={
          <Protected role="admin">
            <AdminStudents />
          </Protected>
        }
      />

      <Route
        path="/admin/profile"
        element={
          <Protected role="admin">
            <Profile />
          </Protected>
        }
      />
      <Route
        path="*"
        element={<Navigate to={user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/login"} replace />}
      />
    </Routes>
  );
}
