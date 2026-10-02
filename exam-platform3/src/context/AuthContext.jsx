import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getSession, setSession, clearSession } from "../utils/storage";
import { api, clearToken } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession());
  const [loading, setLoading] = useState(true);

  // Validate existing session token on mount with backend
  useEffect(() => {
    async function initAuth() {
      try {
        const res = await api.getMe();
        if (res && res.user_id) {
          const updatedUser = {
            ...getSession(),
            id: res.user_id,
            role: res.role,
            name: res.name || getSession()?.name || "",
            email: res.email || getSession()?.email || "",
            student_id: res.student_id || getSession()?.student_id || getSession()?.rollNo || "",
            department: res.department || getSession()?.department || getSession()?.program || "",
          };
          setSession(updatedUser);
          setUser(updatedUser);
        }
      } catch (err) {
        // Clear invalid tokens/sessions
        clearSession();
        clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const loginUser = useCallback(async (email, password, role) => {
    const res = await api.login(email, password, role);

    const userData = {
      id: res.user.id,
      name: res.user.name,
      email: res.user.email,
      role: res.user.role,
      rollNo: res.user.student_id,
      student_id: res.user.student_id,
      program: res.user.department || "B.Tech, Computer Science",
      department: res.user.department,
    };
    setSession(userData);
    setUser(userData);
    return userData;
  }, []);

  const registerUser = useCallback(async (userData) => {
    const res = await api.register(userData);
    return res;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login: loginUser, register: registerUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
