import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { setTokens } from "../lib/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await axios.post(`${API_BASE_URL}/api/auth/login/`, { username, password });
      setTokens({ access: r.data.access, refresh: r.data.refresh });
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authPage">
      <form className="card" onSubmit={onSubmit}>
        <h1>EventHub</h1>
        <p className="muted">Login to manage events and participants.</p>

        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </label>

        <label>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
          />
        </label>

        {error && <div className="error">{error}</div>}

        <button className="btn primary" disabled={loading} type="submit">
          {loading ? "Signing in..." : "Login"}
        </button>

        <p className="hint">
          Create users in Django Admin and assign roles in <code>UserProfile</code>.
        </p>
      </form>
    </div>
  );
}

