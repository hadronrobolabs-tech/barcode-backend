const express = require("express");
const app = express();

/* =========================
   Hostinger CORS FIX
   ========================= */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());

/* =========================
   Load DB Safely
   ========================= */
let db;

try {
  db = require("./config/db");      // ← REAL pool
  console.log("✅ DB module loaded");
} catch (e) {
  console.error("❌ DB module failed:", e.message);
}

/* =========================
   Health Endpoint (REAL CHECK)
   ========================= */
app.get("/health", async (req, res) => {
  try {
    if (!db) throw new Error("DB module missing");
    const conn = await db.getConnection();
    await conn.ping();
    conn.release();
    res.json({ status: "OK", db: true });
  } catch (e) {
    res.json({ status: "OK", db: false, error: e.message });
  }
});

/* =========================
   API Routes
   ========================= */
app.use("/api/auth", require("./modules/auth/auth.routes"));
app.use("/api/components", require("./modules/component/component.routes"));
app.use("/api/categories", require("./modules/category/category.routes"));
app.use("/api/kits", require("./modules/kit/kit.routes"));
app.use("/api/barcodes", require("./modules/barcode/barcode.routes"));
app.use("/api/scans", require("./modules/scan/scan.routes"));
app.use("/api/boxes", require("./modules/box/box.routes"));
app.use("/api/history", require("./modules/history/history.routes"));

/* =========================
   Error Handler
   ========================= */
const errorMiddleware = require("./middlewares/error.middleware");
app.use(errorMiddleware);

module.exports = app;
