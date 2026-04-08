import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { clearTokens, getTokens } from "../lib/auth";

export default function Layout() {
  const navigate = useNavigate();

  async function onLogout() {
    const tokens = getTokens();
    try {
      if (tokens?.refresh) {
        await api.post("/api/auth/logout/", { refresh: tokens.refresh });
      }
    } finally {
      clearTokens();
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="appShell">
      <header className="topbar">
        <Link to="/dashboard" className="brand">
          EventHub
        </Link>
        <button className="btn" onClick={onLogout}>
          Logout
        </button>
      </header>

      <div className="content">
        <nav className="sidebar">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/events">Events</NavLink>
          <NavLink to="/participants">Participants</NavLink>
        </nav>
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

