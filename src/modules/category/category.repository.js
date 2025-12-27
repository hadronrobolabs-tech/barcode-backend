const db = require('../../config/db');

const create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO categories (name, prefix, scan_type)
     VALUES (?, ?, ?)`,
    [data.name, data.prefix, data.scan_type]
  );
  return { id: result.insertId, ...data };
};

const findAll = async () => {
  const [rows] = await db.query(
    `SELECT * FROM categories ORDER BY name`
  );
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT * FROM categories WHERE id = ?`,
    [id]
  );
  return rows[0];
};

const findByPrefix = async (prefix) => {
  const [rows] = await db.query(
    `SELECT * FROM categories WHERE prefix = ?`,
    [prefix]
  );
  return rows[0];
};

const update = async (id, data) => {
  await db.query(
    `UPDATE categories SET name = ?, prefix = ?, scan_type = ? WHERE id = ?`,
    [data.name, data.prefix, data.scan_type, id]
  );
  return findById(id);
};

const remove = async (id) => {
  await db.query(`DELETE FROM categories WHERE id = ?`, [id]);
  return true;
};

module.exports = {
  create,
  findAll,
  findById,
  findByPrefix,
  update,
  remove
};

