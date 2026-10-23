import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded-lg text-sm font-medium transition ${
    isActive
      ? "bg-safe/15 text-safe"
      : "text-cockpit-textMuted hover:text-cockpit-textPrimary hover:bg-white/5"
  }`;

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-cockpit-hairline bg-cockpit-bg/80 backdrop-blur-glass">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-safe shadow-glow_safe" />
          <span className="font-display font-bold text-lg tracking-tight">DriveAlert</span>
        </div>
        <nav className="flex items-center gap-1">
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/history" className={linkClass}>
            Session History
          </NavLink>
          <NavLink to="/profile" className={linkClass}>
            Profile
          </NavLink>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-cockpit-textMuted hidden sm:inline">{user?.name}</span>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="text-sm px-3 py-1.5 rounded-lg border border-cockpit-hairline text-cockpit-textMuted hover:text-danger hover:border-danger/40 transition"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
