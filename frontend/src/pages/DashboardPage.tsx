import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Dashboard = {
  events: number;
  participants: number;
  registrations: number;
  events_by_status: { status: string; count: number }[];
};

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await api.get("/api/dashboard/");
        if (mounted) setData(r.data);
      } catch (e: any) {
        if (mounted) setError(e?.response?.data?.detail || "Failed to load dashboard.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className="card">Loading dashboard…</div>;
  if (error) return <div className="card error">{error}</div>;
  if (!data) return null;

  return (
    <div className="stack">
      <div className="grid3">
        <div className="card">
          <div className="kpiLabel">Events</div>
          <div className="kpiValue">{data.events}</div>
        </div>
        <div className="card">
          <div className="kpiLabel">Participants</div>
          <div className="kpiValue">{data.participants}</div>
        </div>
        <div className="card">
          <div className="kpiLabel">Registrations</div>
          <div className="kpiValue">{data.registrations}</div>
        </div>
      </div>

      <div className="card">
        <h2>Events by status</h2>
        <div className="pillRow">
          {data.events_by_status.map((s) => (
            <span key={s.status} className="pill">
              {s.status}: {s.count}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

