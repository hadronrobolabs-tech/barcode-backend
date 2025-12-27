const db = require('../../config/db');

const create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO kits (kit_name, description)
     VALUES (?, ?)`,
    [data.kit_name, data.description || null]
  );
  return { id: result.insertId, ...data };
};

const findAll = async () => {
  const [rows] = await db.query(
    `SELECT * FROM kits ORDER BY kit_name`
  );
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT * FROM kits WHERE id = ?`,
    [id]
  );
  return rows[0];
};

const addKitComponent = async (kit_id, category_id, required_quantity, component_id = null) => {
  // Check if component_id column exists, if not use category_id only
  const [result] = await db.query(
    `INSERT INTO kit_components (kit_id, category_id, required_quantity${component_id ? ', component_id' : ''})
     VALUES (?, ?, ?${component_id ? ', ?' : ''})`,
    component_id ? [kit_id, category_id, required_quantity, component_id] : [kit_id, category_id, required_quantity]
  );
  return result.insertId;
};

// New method to add component by component_id with barcode prefix
const addKitComponentById = async (kit_id, component_id, required_quantity, barcode_prefix = null) => {
  // First get the component to get its category
  const [compRows] = await db.query(`SELECT category FROM components WHERE id = ?`, [component_id]);
  if (compRows.length === 0) {
    throw new Error('Component not found');
  }
  const categoryName = compRows[0].category;
  
  // Get category_id from category name
  const [catRows] = await db.query(`SELECT id FROM categories WHERE name = ?`, [categoryName]);
  if (catRows.length === 0) {
    throw new Error('Category not found for component');
  }
  const category_id = catRows[0].id;
  
  // Check if already exists
  const [existing] = await db.query(
    `SELECT * FROM kit_components WHERE kit_id = ? AND component_id = ?`,
    [kit_id, component_id]
  );
  if (existing.length > 0) {
    throw new Error('Component already exists in this kit');
  }
  
  // Insert with component_id and barcode_prefix
  try {
    // Check if barcode_prefix column exists
    const [columns] = await db.query(`SHOW COLUMNS FROM kit_components LIKE 'barcode_prefix'`);
    const hasPrefixColumn = columns.length > 0;
    
    let result;
    if (hasPrefixColumn) {
      [result] = await db.query(
        `INSERT INTO kit_components (kit_id, category_id, required_quantity, component_id, barcode_prefix)
         VALUES (?, ?, ?, ?, ?)`,
        [kit_id, category_id, required_quantity, component_id, barcode_prefix]
      );
    } else {
      // Fallback if column doesn't exist yet
      [result] = await db.query(
        `INSERT INTO kit_components (kit_id, category_id, required_quantity, component_id)
         VALUES (?, ?, ?, ?)`,
        [kit_id, category_id, required_quantity, component_id]
      );
    }
    return result.insertId;
  } catch (err) {
    // If component_id column doesn't exist, fall back to category_id only
    if (err.code === 'ER_BAD_FIELD_ERROR') {
      const [result] = await db.query(
        `INSERT INTO kit_components (kit_id, category_id, required_quantity)
         VALUES (?, ?, ?)`,
        [kit_id, category_id, required_quantity]
      );
      return result.insertId;
    }
    throw err;
  }
};

const getKitComponents = async (kit_id) => {
  // Try to get with component details if component_id exists
  try {
    // Check if barcode_prefix column exists
    const [columns] = await db.query(`SHOW COLUMNS FROM kit_components LIKE 'barcode_prefix'`);
    const hasPrefixColumn = columns.length > 0;
    
    let query;
    if (hasPrefixColumn) {
      query = `SELECT kc.*, c.name as category_name, c.prefix, c.scan_type,
                      comp.id as component_id, comp.name as component_name,
                      comp.is_packet, comp.packet_quantity, comp.description,
                      kc.barcode_prefix
               FROM kit_components kc
               JOIN categories c ON kc.category_id = c.id
               LEFT JOIN components comp ON kc.component_id = comp.id
               WHERE kc.kit_id = ?
               ORDER BY comp.name, c.name`;
    } else {
      query = `SELECT kc.*, c.name as category_name, c.prefix, c.scan_type,
                      comp.id as component_id, comp.name as component_name,
                      comp.is_packet, comp.packet_quantity, comp.description
               FROM kit_components kc
               JOIN categories c ON kc.category_id = c.id
               LEFT JOIN components comp ON kc.component_id = comp.id
               WHERE kc.kit_id = ?
               ORDER BY comp.name, c.name`;
    }
    
    const [rows] = await db.query(query, [kit_id]);
    return rows;
  } catch (err) {
    // Fallback if component_id column doesn't exist
    if (err.code === 'ER_BAD_FIELD_ERROR') {
      const [rows] = await db.query(
        `SELECT kc.*, c.name as category_name, c.prefix, c.scan_type
         FROM kit_components kc
         JOIN categories c ON kc.category_id = c.id
         WHERE kc.kit_id = ?
         ORDER BY c.name`,
        [kit_id]
      );
      return rows;
    }
    throw err;
  }
};

// Get all components that belong to a kit (via kit_components.component_id)
const getComponentsForKit = async (kit_id) => {
  // Try to get components by component_id first (new approach)
  try {
    // Check if barcode_prefix column exists
    const [columns] = await db.query(`SHOW COLUMNS FROM kit_components LIKE 'barcode_prefix'`);
    const hasPrefixColumn = columns.length > 0;
    
    let query;
    if (hasPrefixColumn) {
      query = `SELECT DISTINCT comp.*, c.prefix as category_prefix, c.name as category_name,
                      kc.required_quantity, kc.component_id, kc.barcode_prefix
               FROM kit_components kc
               JOIN components comp ON kc.component_id = comp.id
               JOIN categories c ON comp.category = c.name
               WHERE kc.kit_id = ? AND comp.status = 'ACTIVE'
               ORDER BY comp.name`;
    } else {
      query = `SELECT DISTINCT comp.*, c.prefix as category_prefix, c.name as category_name,
                      kc.required_quantity, kc.component_id
               FROM kit_components kc
               JOIN components comp ON kc.component_id = comp.id
               JOIN categories c ON comp.category = c.name
               WHERE kc.kit_id = ? AND comp.status = 'ACTIVE'
               ORDER BY comp.name`;
    }
    
    const [rows] = await db.query(query, [kit_id]);
    return rows;
  } catch (err) {
    // Fallback to category-based approach if component_id column doesn't exist
    if (err.code === 'ER_BAD_FIELD_ERROR') {
      const [rows] = await db.query(
        `SELECT DISTINCT comp.*, c.prefix as category_prefix, c.name as category_name
         FROM components comp
         JOIN kit_components kc ON comp.category = (
           SELECT cat.name FROM categories cat WHERE cat.id = kc.category_id
         )
         JOIN categories c ON kc.category_id = c.id
         WHERE kc.kit_id = ? AND comp.status = 'ACTIVE'
         ORDER BY comp.name`,
        [kit_id]
      );
      return rows;
    }
    throw err;
  }
};

const removeKitComponent = async (kit_id, category_id, component_id = null) => {
  if (component_id) {
    // Remove by component_id
    await db.query(
      `DELETE FROM kit_components WHERE kit_id = ? AND component_id = ?`,
      [kit_id, component_id]
    );
    // Optionally delete the component itself if it's only used in this kit
    // For now, we'll keep the component in the database for barcode history
  } else {
    // Remove by category_id (legacy)
    await db.query(
      `DELETE FROM kit_components WHERE kit_id = ? AND category_id = ?`,
      [kit_id, category_id]
    );
  }
};

const updateKitComponent = async (kit_id, category_id, required_quantity) => {
  await db.query(
    `UPDATE kit_components SET required_quantity = ?
     WHERE kit_id = ? AND category_id = ?`,
    [required_quantity, kit_id, category_id]
  );
};

// Update kit component with component_id, required_quantity, and barcode_prefix
const updateKitComponentWithPrefix = async (kit_id, component_id, category_id, required_quantity, barcode_prefix) => {
  // Check if barcode_prefix column exists
  const [columns] = await db.query(`SHOW COLUMNS FROM kit_components LIKE 'barcode_prefix'`);
  const hasPrefixColumn = columns.length > 0;
  
  if (hasPrefixColumn) {
    await db.query(
      `UPDATE kit_components 
       SET required_quantity = ?, category_id = ?, barcode_prefix = ?
       WHERE kit_id = ? AND component_id = ?`,
      [required_quantity, category_id, barcode_prefix, kit_id, component_id]
    );
  } else {
    await db.query(
      `UPDATE kit_components 
       SET required_quantity = ?, category_id = ?
       WHERE kit_id = ? AND component_id = ?`,
      [required_quantity, category_id, kit_id, component_id]
    );
  }
};

// Remove kit component by component_id
const removeKitComponentById = async (kit_id, component_id) => {
  await db.query(
    `DELETE FROM kit_components WHERE kit_id = ? AND component_id = ?`,
    [kit_id, component_id]
  );
};

const update = async (id, data) => {
  await db.query(
    `UPDATE kits SET kit_name = ?, description = ? WHERE id = ?`,
    [data.kit_name, data.description || null, id]
  );
  return findById(id);
};

const remove = async (id) => {
  // First remove all kit components
  await db.query(`DELETE FROM kit_components WHERE kit_id = ?`, [id]);
  // Then remove the kit
  await db.query(`DELETE FROM kits WHERE id = ?`, [id]);
  return true;
};

module.exports = {
  create,
  findAll,
  findById,
  addKitComponent,
  addKitComponentById,
  getKitComponents,
  getComponentsForKit,
  removeKitComponent,
  removeKitComponentById,
  updateKitComponent,
  updateKitComponentWithPrefix,
  update,
  remove
};

