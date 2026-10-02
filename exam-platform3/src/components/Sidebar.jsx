import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  IconShieldCheck,
  IconGrid,
  IconFile,
  IconUser,
  IconLogOut,
  IconMenu,
  IconX,
  IconFileText,
  IconActivity
} from "./Icons";

export default function Sidebar({ role = "student" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const studentNav = [
    { key: "dashboard", label: "Dashboard", icon: IconGrid, path: "/dashboard" },
    { key: "exams", label: "My Exams", icon: IconFile, path: "/exams" },
    { key: "profile", label: "Profile", icon: IconUser, path: "/profile" },
  ];
  const adminNav = [
    { key: "dashboard", label: "Overview", icon: IconGrid, path: "/admin" },
    { key: "exams", label: "Exams", icon: IconFile, path: "/admin/exams" },
    { key: "review", label: "Exam Review", icon: IconFileText, path: "/admin/review" },
    { key: "health", label: "System Health", icon: IconActivity, path: "/admin/health" },
    { key: "students", label: "Students", icon: IconUser, path: "/admin/students" },
    { key: "profile", label: "Account", icon: IconUser, path: "/admin/profile" },
  ];

  const nav = role === "admin" ? adminNav : studentNav;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const content = (
    <>
      <div className="flex items-center gap-2.5 px-3 pt-2">
        <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-md">
          <IconShieldCheck size={20} className="text-white" />
        </div>
        <span className="font-display font-bold text-lg tracking-tight text-white">ProctorEdge</span>
      </div>

      <nav className="mt-8 flex flex-col gap-1.5 px-2">
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.key}
              onClick={() => {
                setOpen(false);
                navigate(item.path);
              }}
              className={`focus-ring flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon size={18} className={isActive ? "text-white" : "text-slate-400"} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto px-2 space-y-3">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
            {user?.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{role === "admin" ? user?.department : user?.rollNo}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="focus-ring w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
        >
          <IconLogOut size={17} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-slate-900 px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <IconShieldCheck size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-base text-white">ProctorEdge</span>
        </div>
        <button onClick={() => setOpen(true)} className="focus-ring text-slate-300 p-1.5">
          <IconMenu size={20} />
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={() => setOpen(false)} />
          <div className="relative flex flex-col gap-2 w-72 h-full bg-slate-900 py-6 px-2 animate-slide-up border-r border-slate-800">
            <button onClick={() => setOpen(false)} className="focus-ring self-end mr-2 mb-2 text-slate-400">
              <IconX size={18} />
            </button>
            {content}
          </div>
        </div>
      )}

      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-slate-900 border-r border-slate-800 py-6 px-2 gap-2">
        {content}
      </aside>
    </>
  );
}
