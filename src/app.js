const express = require("express");
const app = express();

/* Hostinger CORS */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());

/* Load DB (never crash) */
try {
  require("./config/db");
  console.log("✅ DB module loaded");
} catch (e) {
  console.error("❌ DB module failed:", e.message);
}

/* Health (always alive, real DB check) */
app.get("/health", async (req, res) => {
  try {
    await global.db.query("SELECT 1");
    res.json({ status: "OK", db: true });
  } catch (e) {
    res.json({ status: "OK", db: false });
  }
});

/* API Routes */
app.use("/api/auth", require("./modules/auth/auth.routes"));
app.use("/api/components", require("./modules/component/component.routes"));
app.use("/api/categories", require("./modules/category/category.routes"));
app.use("/api/kits", require("./modules/kit/kit.routes"));
app.use("/api/barcodes", require("./modules/barcode/barcode.routes"));
app.use("/api/scans", require("./modules/scan/scan.routes"));
app.use("/api/boxes", require("./modules/box/box.routes"));
app.use("/api/history", require("./modules/history/history.routes"));

/* Error handler */
const errorMiddleware = require("./middlewares/error.middleware");
app.use(errorMiddleware);

module.exports = app;
