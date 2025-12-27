const db = require('../../config/db');

const create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO components
     (name, category, is_packet, packet_quantity, description)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.name,
      data.category,
      data.is_packet || false,
      data.packet_quantity || null,
      data.description || null
    ]
  );
  return { id: result.insertId, ...data };
};

const findAll = async () => {
  const [rows] = await db.query(
    `SELECT * FROM components WHERE status='ACTIVE'`
  );
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT * FROM components WHERE id = ?`,
    [id]
  );
  return rows[0];
};

const update = async (id, data) => {
  await db.query(
    `UPDATE components SET name = ?, category = ?, is_packet = ?, packet_quantity = ?, description = ?, status = ?
     WHERE id = ?`,
    [
      data.name,
      data.category,
      data.is_packet || false,
      data.packet_quantity || null,
      data.description || null,
      data.status || 'ACTIVE',
      id
    ]
  );
  return findById(id);
};

const remove = async (id) => {
  // Soft delete by setting status to INACTIVE
  await db.query(`UPDATE components SET status = 'INACTIVE' WHERE id = ?`, [id]);
  return true;
};

module.exports = {
  create,
  findAll,
  findById,
  update,
  remove
};
