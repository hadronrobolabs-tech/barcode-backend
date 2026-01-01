const mysql = require('mysql2');

if (!process.env.DB_HOST) {
  console.warn("⚠️ DB env missing — server will run without DB");
  module.exports = null;
  return;
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

/* test connection but never crash */
pool.getConnection()
  .then(conn => {
    console.log("✅ DB connected");
    conn.release();
    global.db = pool.promise();
  })
  .catch(err => {
    console.error("❌ DB connection failed:", err.message);
    global.db = null;
  });

module.exports = pool.promise();
