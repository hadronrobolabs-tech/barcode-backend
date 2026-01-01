const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 15000
});

/* Make pool global so health can access directly */
global.db = pool;

/* Startup verification */
(async () => {
  try {
    const [rows] = await pool.query("SELECT 1");
    console.log("✅ MySQL Connected");
  } catch (err) {
    console.error("❌ MySQL Connection Failed:", err.message);
  }
})();

module.exports = pool;
