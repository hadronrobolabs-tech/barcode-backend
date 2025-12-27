// src/modules/auth/auth.repo.js
const db = require('../../config/db');

const findUserByEmail = async (email) => {
  const [rows] = await db.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return rows[0];
};

const createUser = async ({ fullName, email, phone, passwordHash, role }) => {
  const [result] = await db.query(
    `INSERT INTO users (full_name, email, phone, password_hash, role)
     VALUES (?, ?, ?, ?, ?)`,
    [fullName, email, phone, passwordHash, role]
  );
  return result.insertId;
};

module.exports = {
  findUserByEmail,
  createUser
};
