const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 15000,

  // 🔥 REQUIRED FOR HOSTINGER
  authPlugins: {
    mysql_clear_password: () => () =>
      Buffer.from(process.env.DB_PASSWORD + "\0")
  }
});

// Test connection at boot
(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log("✅ MySQL CONNECTED");
  } catch (err) {
    console.error("❌ MySQL FAILED:", err.message);
  }
})();

module.exports = pool;
