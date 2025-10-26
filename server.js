import express from "express";
import cors from "cors";
import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;
const app = express();
app.use(cors());
app.use(express.json());

// 💾 připojení k PostgreSQL (Railway ti vygeneruje DATABASE_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ===============================
// 📍 MARKERS API
// ===============================
app.get("/api/markers", async (req, res) => {
  const result = await pool.query("SELECT * FROM markers ORDER BY id ASC");
  res.json(result.rows);
});

app.post("/api/markers", async (req, res) => {
  const { title, description, category, priority, status, tags, lat, lng } = req.body;
  const result = await pool.query(
    "INSERT INTO markers (title, description, category, priority, status, tags, lat, lng) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
    [title, description, category, priority, status, tags, lat, lng]
  );
  res.json(result.rows[0]);
});

app.put("/api/markers/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, category, priority, status, tags, lat, lng } = req.body;
  await pool.query(
    "UPDATE markers SET title=$1, description=$2, category=$3, priority=$4, status=$5, tags=$6, lat=$7, lng=$8 WHERE id=$9",
    [title, description, category, priority, status, tags, lat, lng, id]
  );
  res.json({ success: true });
});

app.delete("/api/markers/:id", async (req, res) => {
  await pool.query("DELETE FROM markers WHERE id=$1", [req.params.id]);
  res.json({ success: true });
});

// ===============================
// 🧩 SHAPES API (GeoJSON-like)
// ===============================
app.get("/api/shapes", async (req, res) => {
  const result = await pool.query("SELECT geojson FROM shapes ORDER BY id DESC LIMIT 1");
  res.json(result.rows[0]?.geojson || { type: "FeatureCollection", features: [] });
});

app.post("/api/shapes", async (req, res) => {
  const { type, features } = req.body;
  await pool.query("INSERT INTO shapes (geojson) VALUES ($1)", [JSON.stringify({ type, features })]);
  res.json({ success: true });
});

// ===============================
// 🚀 SERVER START
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ Server běží na portu " + PORT));
