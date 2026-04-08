import { useEffect, useState, type FormEvent } from "react";
import { api } from "../lib/api";
import { canWrite, fetchMe, type Me } from "../lib/me";

type Participant = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

export default function ParticipantsPage() {
  const [items, setItems] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get("/api/participants/");
      setItems(r.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load participants.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMe().then(setMe).catch(() => setMe(null));
    load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const r = await api.post("/api/participants/", {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
      });
      setItems((prev) => [r.data, ...prev]);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
    } catch (e: any) {
      setError(e?.response?.data?.detail || JSON.stringify(e?.response?.data) || "Failed to create participant.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(p: Participant) {
    setEditingId(p.id);
    setEditFirstName(p.first_name);
    setEditLastName(p.last_name);
    setEditEmail(p.email);
    setEditPhone(p.phone || "");
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
      const r = await api.put(`/api/participants/${editingId}/`, {
        first_name: editFirstName,
        last_name: editLastName,
        email: editEmail,
        phone: editPhone,
      });
      setItems((prev) => prev.map((x) => (x.id === editingId ? r.data : x)));
      setEditingId(null);
    } catch (e: any) {
      setError(e?.response?.data?.detail || JSON.stringify(e?.response?.data) || "Failed to update participant.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    setDeletingId(id);
    setError(null);
    try {
      await api.delete(`/api/participants/${id}/`);
      setItems((prev) => prev.filter((x) => x.id !== id));
      if (editingId === id) setEditingId(null);
    } catch (e: any) {
      setError(e?.response?.data?.detail || JSON.stringify(e?.response?.data) || "Failed to delete participant.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="stack">
      <div className="card">
        <h1>Participants</h1>
        <button className="btn" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {canWrite(me) ? (
        <form className="card" onSubmit={onCreate}>
          <h2>Create participant</h2>
          <div className="grid2">
            <label>
              First name
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </label>
            <label>
              Last name
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </label>
            <label>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </label>
            <label>
              Phone
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
          </div>

          {error && <div className="error">{error}</div>}

          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create"}
          </button>
        </form>
      ) : (
        <div className="card">
          <h2>Create participant</h2>
          <p className="muted">You are logged in as a viewer (read‑only). Ask an editor/admin to modify data.</p>
        </div>
      )}

      {canWrite(me) && editingId !== null && (
        <form className="card" onSubmit={onUpdate}>
          <h2>Edit participant #{editingId}</h2>
          <div className="grid2">
            <label>
              First name
              <input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} required />
            </label>
            <label>
              Last name
              <input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} required />
            </label>
            <label>
              Email
              <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" required />
            </label>
            <label>
              Phone
              <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </label>
          </div>

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
              <div>Name</div>
              <div>Email</div>
              <div>Phone</div>
              <div>Actions</div>
            </div>
            {items.map((p) => (
              <div key={p.id} className="row">
                <div>
                  {p.last_name} {p.first_name}
                </div>
                <div>{p.email}</div>
                <div>{p.phone}</div>
                <div>
                  {canWrite(me) ? (
                    <div className="filters">
                      <button className="btn" onClick={() => startEdit(p)} type="button" disabled={saving}>
                        Edit
                      </button>
                      <button
                        className="btn"
                        onClick={() => onDelete(p.id)}
                        type="button"
                        disabled={deletingId === p.id}
                      >
                        {deletingId === p.id ? "Deleting..." : "Delete"}
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

