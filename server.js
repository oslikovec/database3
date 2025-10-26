// ==============================
// 🔴 Red Roof Company – Map Backend
// ==============================
import express from "express";
import cors from "cors";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

// ==============================
// 💾 PostgreSQL připojení (Railway automaticky dodá DATABASE_URL)
// ==============================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ==============================
// ⚙️ Express inicializace
// ==============================
const app = express();
app.use(cors());
app.use(express.json());

// ==============================
// 🧭 Test endpoint (zkouška spojení)
// ==============================
app.get("/api/test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ ok: true, db_time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ==============================
// 📍 MARKERS API
// ==============================

// ✅ Získání všech markerů
app.get("/api/markers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM markers ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Chyba při SELECT:", err);
    res.status(500).json({ error: "DB query failed" });
  }
});

// ✅ Přidání nového markeru
app.post("/api/markers", async (req, res) => {
  try {
    const { title, description, category, priority, status, tags, lat, lng } = req.body;
    const result = await pool.query(
      `INSERT INTO markers (title, description, category, priority, status, tags, lat, lng, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
       RETURNING *`,
      [title, description, category, priority, status, tags, lat, lng]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Chyba při INSERT:", err);
    res.status(500).json({ error: "Insert failed" });
  }
});

// ✅ Úprava existujícího markeru
app.put("/api/markers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, priority, status, tags, lat, lng } = req.body;
    await pool.query(
      `UPDATE markers
       SET title=$1, description=$2, category=$3, priority=$4, status=$5, tags=$6, lat=$7, lng=$8, updated_at=NOW()
       WHERE id=$9`,
      [title, description, category, priority, status, tags, lat, lng, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Chyba při UPDATE:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// ✅ Smazání markeru
app.delete("/api/markers/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM markers WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Chyba při DELETE:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// ==============================
// 🧩 SHAPES API (volitelné, GeoJSON-like)
// ==============================
app.get("/api/shapes", async (req, res) => {
  try {
    const result = await pool.query("SELECT geojson FROM shapes ORDER BY id DESC LIMIT 1");
    res.json(result.rows[0]?.geojson || { type: "FeatureCollection", features: [] });
  } catch (err) {
    console.error("❌ Chyba při SELECT shapes:", err);
    res.status(500).json({ error: "DB query failed" });
  }
});

app.post("/api/shapes", async (req, res) => {
  try {
    const { type, features } = req.body;
    await pool.query("INSERT INTO shapes (geojson) VALUES ($1)", [
      JSON.stringify({ type, features }),
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Chyba při INSERT shapes:", err);
    res.status(500).json({ error: "Insert failed" });
  }
});

// ==============================
// 🚀 SERVER START
// ==============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server běží na portu ${PORT}`));
