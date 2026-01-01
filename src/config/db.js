const mysql = require("mysql2/promise");

// Safe ENV debug (does NOT print password)
console.log("🔎 ENV CHECK:", {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  HAS_PASSWORD: !!process.env.DB_PASSWORD
});

// Hard fail if anything missing
if (
  !process.env.DB_HOST ||
  !process.env.DB_PORT ||
  !process.env.DB_USER ||
  !process.env.DB_PASSWORD ||
  !process.env.DB_NAME
) {
  console.error("❌ Missing Railway MySQL ENV variables");
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,          // mysql.railway.internal
  port: Number(process.env.DB_PORT),  // 3306
  user: process.env.DB_USER,          // root
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,      // railway
  waitForConnections: true,
  connectionLimit: 10
});

(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log("✅ Railway MySQL Connected");
  } catch (err) {
    console.error("❌ MySQL Connection Failed:", err);
  }
})();

module.exports = pool;
