import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClassName = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-brand-700 text-white" : "text-slate-700 hover:bg-slate-100"
  }`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  const roleBadgeClass =
    user?.role === "admin"
      ? "bg-slate-900 text-white"
      : user?.role === "mentor"
        ? "bg-emerald-100 text-emerald-800"
        : "bg-brand-100 text-brand-800";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold text-brand-800">
          EntreSkill Hub
        </Link>

        {user ? (
          <nav className="flex flex-wrap items-center gap-2" aria-label="Authenticated navigation">
            <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${roleBadgeClass}`}>
              {user.role}
            </span>
            <NavLink to="/dashboard" className={linkClassName}>
              Dashboard
            </NavLink>
            <NavLink to="/assessment" className={linkClassName}>
              Skills Profile
            </NavLink>
            <NavLink to="/ideas" className={linkClassName}>
              Business Ideas
            </NavLink>
            <NavLink to="/resources" className={linkClassName}>
              Learning
            </NavLink>
            <NavLink to="/mentors" className={linkClassName}>
              Mentors
            </NavLink>
            {user.role === "user" && (
              <NavLink to="/mentor-apply" className={linkClassName}>
                Become Mentor
              </NavLink>
            )}
            {user.role === "mentor" && (
              <NavLink to="/mentor" className={linkClassName}>
                Mentor Panel
              </NavLink>
            )}
            {user.role === "admin" && (
              <NavLink to="/admin" className={linkClassName}>
                Admin Panel
              </NavLink>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Logout
            </button>
          </nav>
        ) : (
          <nav className="flex items-center gap-2" aria-label="Public navigation">
            <Link
              to="/login"
              className="rounded-md border border-brand-700 px-3 py-2 text-sm font-semibold text-brand-700"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white"
            >
              Get Started
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
