import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { IconUser, IconMail, IconShieldCheck, IconCheckCircle } from "../components/Icons";

export default function Profile() {
  const { user, login } = useAuth();
  const isAdmin = user?.role === "admin";
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saved, setSaved] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    login({ ...user, name, email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="min-h-screen flex bg-navy-900">
      <Sidebar role={isAdmin ? "admin" : "student"} />

      <main className="flex-1 min-w-0 px-5 sm:px-8 py-8 max-w-3xl mx-auto w-full">
        <div className="animate-slide-up">
          <h1 className="font-display text-3xl font-semibold text-indigo-950">{isAdmin ? "Account" : "Profile"}</h1>
          <p className="text-sm text-purple-900/60 mt-1.5 font-medium">Manage your account details.</p>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8 mt-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center text-lg font-semibold text-white shrink-0 shadow-glow">
              {initials}
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-indigo-950">{user?.name}</p>
              <p className="text-sm text-purple-900/70 font-medium">
                {isAdmin ? user?.department : `${user?.program} · Roll No. ${user?.rollNo}`}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="mt-8 space-y-4">
            <div>
              <label className="block text-xs font-medium text-purple-950 mb-1.5">Full name</label>
              <div className="relative">
                <IconUser size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-900/50" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="focus-ring w-full rounded-lg bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 border border-purple-200/80 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-950 mb-1.5">Email address</label>
              <div className="relative">
                <IconMail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-900/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus-ring w-full rounded-lg bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 border border-purple-200/80 shadow-sm"
                />
              </div>
            </div>

            {!isAdmin && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-purple-950 mb-1.5">Roll number</label>
                  <input
                    value={user?.rollNo || ""}
                    disabled
                    className="w-full rounded-lg bg-purple-50/60 px-3.5 py-2.5 text-sm text-purple-900/60 border border-purple-200/80 cursor-not-allowed font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-purple-950 mb-1.5">Program</label>
                  <input
                    value={user?.program || ""}
                    disabled
                    className="w-full rounded-lg bg-purple-50/60 px-3.5 py-2.5 text-sm text-purple-900/60 border border-purple-200/80 cursor-not-allowed font-medium"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="focus-ring rounded-lg bg-gradient-to-r from-accent-blue to-accent-violet px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Save changes
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-status-safe font-semibold">
                  <IconCheckCircle size={15} />
                  Saved
                </span>
              )}
            </div>
          </form>
        </div>

        <div className="glass rounded-2xl p-6 mt-6 flex items-start gap-3">
          <IconShieldCheck size={18} className="text-accent-blue shrink-0 mt-0.5" />
          <p className="text-xs text-purple-900/70 leading-relaxed font-medium">
            This is a demo account backed by your browser's local storage — changes here are saved only on this
            device and aren't sent anywhere.
          </p>
        </div>
      </main>
    </div>
  );
}
