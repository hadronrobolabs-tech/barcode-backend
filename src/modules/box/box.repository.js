const db = require('../../config/db');

exports.createSession = (data) =>
  db.query("INSERT INTO box_packing SET ?", data);

exports.findSessionByBoxId = async (box_barcode_id)=>{
  const [rows] = await db.query("SELECT * FROM box_packing WHERE box_barcode_id=?", [box_barcode_id]);
  return rows[0];
};

exports.addPackedItem = (session_id, barcode_id)=>
  db.query("INSERT INTO box_packing_items SET ?", {
      box_packing_id:session_id,
      barcode_id
  });

exports.getPackedItems = async (session_id)=>{
  const [rows] = await db.query(
    `SELECT bpi.*, b.barcode_value, b.object_id as component_id, c.name as component_name, c.category
     FROM box_packing_items bpi
     JOIN barcodes b ON bpi.barcode_id = b.id
     LEFT JOIN components c ON b.object_id = c.id AND b.object_type = 'COMPONENT'
     WHERE bpi.box_packing_id = ?`,
    [session_id]
  );
  return rows;
};

exports.getPackedItemsByCategory = async (session_id) => {
  const [rows] = await db.query(
    `SELECT c.category, COUNT(*) as scanned_count
     FROM box_packing_items bpi
     JOIN barcodes b ON bpi.barcode_id = b.id
     JOIN components c ON b.object_id = c.id AND b.object_type = 'COMPONENT'
     WHERE bpi.box_packing_id = ?
     GROUP BY c.category`,
    [session_id]
  );
  return rows;
};

exports.completeSession = (session_id, packed_by = null)=>
  db.query("UPDATE box_packing SET status='COMPLETED', completed_at=NOW(), packed_by=? WHERE id=?", [packed_by, session_id]);

exports.removePackedItem = async (session_id, barcode_id) => {
  const [result] = await db.query(
    "DELETE FROM box_packing_items WHERE box_packing_id = ? AND barcode_id = ?",
    [session_id, barcode_id]
  );
  return result.affectedRows > 0;
};
