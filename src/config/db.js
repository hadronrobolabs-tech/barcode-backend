const mysql = require("mysql2/promise");

console.log("ENV:", {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  HAS_PASSWORD: !!process.env.DB_PASSWORD
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

(async () => {
  try {
    const c = await pool.getConnection();
    await c.ping();
    c.release();
    console.log("✅ Railway MySQL Connected");
  } catch (e) {
    console.error("❌ MySQL Connection Failed:", e);
  }
})();

module.exports = pool;
