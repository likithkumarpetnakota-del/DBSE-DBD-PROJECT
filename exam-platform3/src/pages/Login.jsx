import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IconMail, IconLock, IconShieldCheck, IconArrowRight, IconEye } from "../components/Icons";

export default function Login() {
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);

    try {
      // Strict Backend Authentication & Role Check Call
      const loggedInUser = await login(email, password, role);

      if (loggedInUser.role !== role) {
        setLoading(false);
        if (role === "admin") {
          setError("Access denied: Student accounts cannot sign in through the Admin Portal. Please switch to the Student Portal.");
        } else {
          setError("Access denied: Admin accounts cannot sign in through the Student Portal. Please switch to the Admin Portal.");
        }
        return;
      }

      setLoading(false);
      navigate(loggedInUser.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      console.warn("Authentication failed:", err);
      setError(err.message || "Access denied: Invalid email or password for the selected portal.");
      setLoading(false);
    }
  }


  return (
    <div className="min-h-screen w-full grid lg:grid-cols-[1.1fr_1fr]">
      {/* Left — brand / signature panel in soft lavender */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-purple-200/60 bg-gradient-to-br from-[#ede7f6] via-[#f4effc] to-[#e9d5ff] p-12">
        <div className="absolute inset-0 bg-grid-glow" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(124,58,237,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.3) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-violet flex items-center justify-center shadow-glow">
            <IconShieldCheck size={17} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-indigo-950">ProctorEdge</span>
        </div>

        <div className="relative z-10 flex flex-col items-start gap-10">
          <div className="relative h-40 w-40 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full border border-accent-blue/30 animate-pulse-ring" />
            <span className="absolute inset-0 rounded-full border border-accent-blue/30 animate-pulse-ring [animation-delay:0.7s]" />
            <span className="absolute inset-0 rounded-full border border-accent-blue/30 animate-pulse-ring [animation-delay:1.4s]" />
            <div className="relative h-24 w-24 rounded-full bg-white/90 border border-purple-300/80 backdrop-blur-md shadow-glow flex items-center justify-center">
              <IconEye size={34} className="text-accent-blue" />
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="font-display text-4xl font-semibold leading-tight text-indigo-950">
              Exams, watched over
              <br />
              by a steady <span className="text-gradient">AI eye.</span>
            </h1>
            <p className="mt-4 text-purple-900/80 leading-relaxed font-medium">
              Live presence monitoring, tab-switch detection, and risk scoring run quietly in the
              background — so your students can focus on the questions, not the surveillance.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-2">
            {[
              ["99.4%", "Presence detection precision"],
              ["<400ms", "Violation detection"],
              ["24/7", "Session monitoring"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-mono text-xl font-semibold text-indigo-950">{n}</div>
                <div className="text-xs text-purple-900/70 font-medium mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-purple-900/60 font-medium">© 2026 ProctorEdge Examination Systems</p>
      </div>

      {/* Right — form panel in soft lavender & white */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-navy-900 overflow-y-auto">
        <div className="w-full max-w-sm animate-fade-in my-auto">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-violet flex items-center justify-center">
              <IconShieldCheck size={17} className="text-white" />
            </div>
            <span className="font-display font-semibold text-lg tracking-tight text-indigo-950">ProctorEdge</span>
          </div>

          <h2 className="font-display text-2xl font-semibold text-indigo-950">Welcome Back</h2>
          <p className="text-sm text-purple-900/60 mt-1.5">
            Sign in with your admin-registered email to access your exam portal.
          </p>

          {/* Role selector indicator */}
          <div className="mt-6 grid grid-cols-2 gap-2 p-1 rounded-xl glass">
            {[
              ["student", "Student Portal"],
              ["admin", "Admin Portal"],
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setRole(val);
                  setError("");
                }}
                className={`focus-ring rounded-lg py-2 text-xs font-medium transition-all duration-200 ${
                  role === val
                    ? "bg-gradient-to-br from-accent-blue to-accent-violet text-white shadow-glow font-semibold"
                    : "text-purple-900/70 hover:text-indigo-950"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-purple-950 mb-1.5">Registered Email Address</label>
              <div className="relative">
                <IconMail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-900/50" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === "student" ? "likith.student@campus.edu" : "anita.rao@campus.edu"}
                  className="focus-ring w-full rounded-lg bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 border border-purple-200/80 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-950 mb-1.5">Password</label>
              <div className="relative">
                <IconLock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-900/50" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="focus-ring w-full rounded-lg bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 border border-purple-200/80 shadow-sm"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/25 rounded-lg px-3.5 py-2.5 leading-relaxed font-medium">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="focus-ring w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-accent-blue to-accent-violet py-2.5 text-sm font-semibold text-white shadow-glow transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 mt-2"
            >
              {loading ? "Verifying Credentials..." : "Sign In to Exam Portal"}
              {!loading && <IconArrowRight size={15} />}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-purple-900/60 border-t border-purple-100 pt-6">
            Account registration is restricted to Examination Controllers.
            <br />
            Contact your Administrator if you need an account.
          </p>
        </div>
      </div>
    </div>
  );
}
