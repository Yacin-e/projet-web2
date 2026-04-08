import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { canWrite, fetchMe, type Me } from "../lib/me";

type Participant = { id: number; first_name: string; last_name: string; email: string; phone: string };
type EventDetails = {
  id: number;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  status: string;
  participants: Participant[];
};
type Registration = { id: number; event: number; participant: number; registered_at: string };

export default function EventDetailsPage() {
  const { id } = useParams();
  const eventId = Number(id);

  const [data, setData] = useState<EventDetails | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [unregisteringId, setUnregisteringId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [eventRes, participantsRes] = await Promise.all([
        api.get(`/api/events/${eventId}/`),
        api.get("/api/participants/"),
      ]);
      setData(eventRes.data);
      setParticipants(participantsRes.data);
      const first = (participantsRes.data as Participant[])[0];
      setSelectedParticipantId(first?.id ?? null);

      const regsRes = await api.get<Registration[]>("/api/registrations/", { params: { event: eventId } });
      setRegistrations(regsRes.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load event.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isFinite(eventId)) return;
    fetchMe().then(setMe).catch(() => setMe(null));
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function onRegister(e: FormEvent) {
    e.preventDefault();
    if (!selectedParticipantId) return;
    setSaving(true);
    setError(null);
    try {
      const r = await api.post<Registration>("/api/registrations/", {
        event: eventId,
        participant: selectedParticipantId,
      });
      void r;
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || JSON.stringify(e?.response?.data) || "Registration failed.");
    } finally {
      setSaving(false);
    }
  }

  async function onUnregister(registrationId: number) {
    setUnregisteringId(registrationId);
    setError(null);
    try {
      await api.delete(`/api/registrations/${registrationId}/`);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || JSON.stringify(e?.response?.data) || "Unregister failed.");
    } finally {
      setUnregisteringId(null);
    }
  }

  if (loading) return <div className="card">Loading…</div>;
  if (error) return <div className="card error">{error}</div>;
  if (!data) return null;

  return (
    <div className="stack">
      <div className="card">
        <div className="breadcrumb">
          <Link to="/events">← Events</Link>
        </div>
        <h1>{data.title}</h1>
        <p className="muted">{data.status}</p>
        {data.description && <p>{data.description}</p>}
      </div>

      {canWrite(me) ? (
        <form className="card" onSubmit={onRegister}>
          <h2>Register participant</h2>
          <div className="filters">
            <label>
              Participant
              <select
                value={selectedParticipantId ?? ""}
                onChange={(e) => setSelectedParticipantId(Number(e.target.value))}
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.last_name} {p.first_name} ({p.email})
                  </option>
                ))}
              </select>
            </label>
            <button className="btn primary" disabled={saving || !selectedParticipantId} type="submit">
              {saving ? "Registering..." : "Register"}
            </button>
          </div>
          <p className="hint">Duplicate registrations are blocked by the backend business rule.</p>
        </form>
      ) : (
        <div className="card">
          <h2>Register participant</h2>
          <p className="muted">You are logged in as a viewer (read‑only). Ask an editor/admin to modify data.</p>
        </div>
      )}

      <div className="card">
        <h2>Registered participants</h2>
        {data.participants.length === 0 ? (
          <p className="muted">No one registered yet.</p>
        ) : (
          <ul className="list">
            {data.participants.map((p) => (
              <li key={p.id}>
                <b>
                  {p.last_name} {p.first_name}
                </b>{" "}
                <span className="muted">{p.email}</span>
                {canWrite(me) && (
                  <>
                    {" "}
                    <button
                      className="btn"
                      type="button"
                      onClick={() => {
                        const reg = registrations.find((r) => r.participant === p.id);
                        if (reg) void onUnregister(reg.id);
                      }}
                      disabled={unregisteringId !== null}
                    >
                      {unregisteringId !== null ? "Updating..." : "Unregister"}
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

