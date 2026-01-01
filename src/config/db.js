const mysql = require("mysql2/promise");

if (!process.env.MYSQL_URL) {
  throw new Error("❌ MYSQL_URL is missing. Check Railway Variables or .env");
}

const pool = mysql.createPool(process.env.MYSQL_URL);

(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log("✅ Railway MySQL Connected");
  } catch (err) {
    console.error("❌ MySQL Connection Failed:", err.message);
  }
})();

module.exports = pool;
