import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { canWrite, fetchMe, type Me } from "../lib/me";

type Event = {
  id: number;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  status: string;
};

function toInputDateTimeValue(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventsPage() {
  const [items, setItems] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [status, setStatus] = useState("draft");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartAt, setEditStartAt] = useState("");
  const [editEndAt, setEditEndAt] = useState("");
  const [editStatus, setEditStatus] = useState("draft");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (filterStatus) p.set("status", filterStatus);
    if (filterFrom) p.set("date_from", new Date(filterFrom).toISOString());
    if (filterTo) p.set("date_to", new Date(filterTo).toISOString());
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [filterStatus, filterFrom, filterTo]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get(`/api/events/${query}`);
      setItems(r.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMe().then(setMe).catch(() => setMe(null));
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const r = await api.post("/api/events/", {
        title,
        description,
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
        status,
      });
      setItems((prev) => [r.data, ...prev]);
      setTitle("");
      setDescription("");
      setStartAt("");
      setEndAt("");
      setStatus("draft");
    } catch (e: any) {
      setError(e?.response?.data?.detail || JSON.stringify(e?.response?.data) || "Failed to create event.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(ev: Event) {
    setEditingId(ev.id);
    setEditTitle(ev.title);
    setEditDescription(ev.description || "");
    setEditStartAt(toInputDateTimeValue(ev.start_at));
    setEditEndAt(toInputDateTimeValue(ev.end_at));
    setEditStatus(ev.status);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function onUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError(null);
    try {
      const r = await api.put(`/api/events/${editingId}/`, {
        title: editTitle,
        description: editDescription,
        start_at: new Date(editStartAt).toISOString(),
        end_at: new Date(editEndAt).toISOString(),
        status: editStatus,
      });
      setItems((prev) => prev.map((x) => (x.id === editingId ? r.data : x)));
      setEditingId(null);
    } catch (e: any) {
      setError(e?.response?.data?.detail || JSON.stringify(e?.response?.data) || "Failed to update event.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    setDeletingId(id);
    setError(null);
    try {
      await api.delete(`/api/events/${id}/`);
      setItems((prev) => prev.filter((x) => x.id !== id));
      if (editingId === id) setEditingId(null);
    } catch (e: any) {
      setError(e?.response?.data?.detail || JSON.stringify(e?.response?.data) || "Failed to delete event.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="stack">
      <div className="card">
        <h1>Events</h1>
        <div className="filters">
          <label>
            Status
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All</option>
              <option value="draft">draft</option>
              <option value="scheduled">scheduled</option>
              <option value="ongoing">ongoing</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>
          <label>
            From
            <input type="datetime-local" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
          </label>
          <label>
            To
            <input type="datetime-local" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
          </label>
          <button className="btn" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {canWrite(me) ? (
        <form className="card" onSubmit={onCreate}>
        <h2>Create event</h2>
        <div className="grid2">
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="draft">draft</option>
              <option value="scheduled">scheduled</option>
              <option value="ongoing">ongoing</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>
          <label>
            Start
            <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
          </label>
          <label>
            End
            <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} required />
          </label>
        </div>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </label>

        {error && <div className="error">{error}</div>}

        <button className="btn primary" type="submit" disabled={saving}>
          {saving ? "Creating..." : "Create"}
        </button>
      </form>
      ) : (
        <div className="card">
          <h2>Create event</h2>
          <p className="muted">You are logged in as a viewer (read‑only). Ask an editor/admin to modify data.</p>
        </div>
      )}

      {canWrite(me) && editingId !== null && (
        <form className="card" onSubmit={onUpdate}>
          <h2>Edit event #{editingId}</h2>
          <div className="grid2">
            <label>
              Title
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            </label>
            <label>
              Status
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                <option value="draft">draft</option>
                <option value="scheduled">scheduled</option>
                <option value="ongoing">ongoing</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </label>
            <label>
              Start
              <input type="datetime-local" value={editStartAt} onChange={(e) => setEditStartAt(e.target.value)} required />
            </label>
            <label>
              End
              <input type="datetime-local" value={editEndAt} onChange={(e) => setEditEndAt(e.target.value)} required />
            </label>
          </div>
          <label>
            Description
            <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
          </label>

          {error && <div className="error">{error}</div>}

          <div className="filters">
            <button className="btn primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button className="btn" type="button" onClick={cancelEdit} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card">
        <h2>List</h2>
        {loading ? (
          <div className="muted">Loading…</div>
        ) : (
          <div className="table">
            <div className="row header">
              <div>Title</div>
              <div>Status</div>
              <div>Start</div>
              <div>End</div>
              <div>Actions</div>
            </div>
            {items.map((e) => (
              <div key={e.id} className="row">
                <div>
                  <Link to={`/events/${e.id}`}>{e.title}</Link>
                </div>
                <div>{e.status}</div>
                <div>{toInputDateTimeValue(e.start_at).replace("T", " ")}</div>
                <div>{toInputDateTimeValue(e.end_at).replace("T", " ")}</div>
                <div>
                  {canWrite(me) ? (
                    <div className="filters">
                      <button className="btn" onClick={() => startEdit(e)} type="button" disabled={saving}>
                        Edit
                      </button>
                      <button
                        className="btn"
                        onClick={() => onDelete(e.id)}
                        type="button"
                        disabled={deletingId === e.id}
                      >
                        {deletingId === e.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  ) : (
                    <span className="muted">Read‑only</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

