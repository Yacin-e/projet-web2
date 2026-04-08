import express from "express";
import cors from "cors";
import morgan from "morgan";

import { initDb, openDb } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const db = openDb();
initDb(db);

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

app.get("/health", (req, res) => res.json({ ok: true }));

// Events (CRUD)
app.get("/api/events", async (req, res, next) => {
  try {
    const rows = await all(db, "SELECT * FROM events ORDER BY start_at DESC, title ASC");
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

app.post("/api/events", async (req, res, next) => {
  try {
    const { title, description = "", start_at, end_at, status = "draft" } = req.body || {};
    if (!title || !start_at || !end_at) return res.status(400).json({ error: "Missing required fields." });
    const r = await run(
      db,
      "INSERT INTO events (title, description, start_at, end_at, status) VALUES (?, ?, ?, ?, ?)",
      [title, description, start_at, end_at, status]
    );
    const created = await get(db, "SELECT * FROM events WHERE id = ?", [r.lastID]);
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

app.put("/api/events/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { title, description = "", start_at, end_at, status = "draft" } = req.body || {};
    if (!title || !start_at || !end_at) return res.status(400).json({ error: "Missing required fields." });
    await run(
      db,
      "UPDATE events SET title=?, description=?, start_at=?, end_at=?, status=? WHERE id=?",
      [title, description, start_at, end_at, status, id]
    );
    const updated = await get(db, "SELECT * FROM events WHERE id = ?", [id]);
    if (!updated) return res.status(404).json({ error: "Not found." });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

app.delete("/api/events/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const r = await run(db, "DELETE FROM events WHERE id = ?", [id]);
    if (r.changes === 0) return res.status(404).json({ error: "Not found." });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// Participants (CRUD)
app.get("/api/participants", async (req, res, next) => {
  try {
    const rows = await all(db, "SELECT * FROM participants ORDER BY last_name ASC, first_name ASC");
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

app.post("/api/participants", async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone = "" } = req.body || {};
    if (!first_name || !last_name || !email) return res.status(400).json({ error: "Missing required fields." });
    const r = await run(
      db,
      "INSERT INTO participants (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)",
      [first_name, last_name, email, phone]
    );
    const created = await get(db, "SELECT * FROM participants WHERE id = ?", [r.lastID]);
    res.status(201).json(created);
  } catch (e) {
    if (String(e?.message || "").includes("UNIQUE")) return res.status(409).json({ error: "Email already exists." });
    next(e);
  }
});

app.put("/api/participants/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { first_name, last_name, email, phone = "" } = req.body || {};
    if (!first_name || !last_name || !email) return res.status(400).json({ error: "Missing required fields." });
    await run(
      db,
      "UPDATE participants SET first_name=?, last_name=?, email=?, phone=? WHERE id=?",
      [first_name, last_name, email, phone, id]
    );
    const updated = await get(db, "SELECT * FROM participants WHERE id = ?", [id]);
    if (!updated) return res.status(404).json({ error: "Not found." });
    res.json(updated);
  } catch (e) {
    if (String(e?.message || "").includes("UNIQUE")) return res.status(409).json({ error: "Email already exists." });
    next(e);
  }
});

app.delete("/api/participants/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const r = await run(db, "DELETE FROM participants WHERE id = ?", [id]);
    if (r.changes === 0) return res.status(404).json({ error: "Not found." });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`Node API listening on http://127.0.0.1:${port}`);
});

