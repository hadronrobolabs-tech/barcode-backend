const express = require("express");
const app = express();

/* ============================
   Hostinger CORS FIX (MANDATORY)
   ============================ */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

/* ============================
   Body Parser
   ============================ */
app.use(express.json());

/* ============================
   Safe DB Loader
   ============================ */
let dbHealthy = false;
let db;

try {
  db = require("./config/db");
  dbHealthy = true;
  console.log("✅ DB Module Loaded");
} catch (e) {
  console.error("❌ DB Load Failed:", e.message);
}

/* ============================
   Health Endpoint (NEVER FAILS)
   ============================ */
app.get("/health", async (req, res) => {
  try {
    if (!dbHealthy) throw new Error("DB not loaded");
    const conn = await db.getConnection();
    await conn.ping();
    conn.release();
    return res.json({ status: "OK", db: true });
  } catch (e) {
    return res.json({ status: "OK", db: false });
  }
});

/* ============================
   API Routes
   ============================ */
app.use("/api/auth", require("./modules/auth/auth.routes"));
app.use("/api/components", require("./modules/component/component.routes"));
app.use("/api/categories", require("./modules/category/category.routes"));
app.use("/api/kits", require("./modules/kit/kit.routes"));
app.use("/api/barcodes", require("./modules/barcode/barcode.routes"));
app.use("/api/scans", require("./modules/scan/scan.routes"));
app.use("/api/boxes", require("./modules/box/box.routes"));
app.use("/api/history", require("./modules/history/history.routes"));

/* ============================
   Global Error Handler
   ============================ */
const errorMiddleware = require("./middlewares/error.middleware");
app.use(errorMiddleware);

module.exports = app;
