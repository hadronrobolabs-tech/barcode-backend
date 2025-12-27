const db = require('../../config/db');

exports.create = async (data) => {
    const [res] = await db.query("INSERT INTO barcodes SET ?", data);
    return res.insertId;
};

exports.findByValue = async (barcode) => {
    const [rows] = await db.query("SELECT * FROM barcodes WHERE barcode_value=?", [barcode]);
    return rows[0];
};

exports.update = async (id, data) => {
    return db.query("UPDATE barcodes SET ? WHERE id=?", [data, id]);
};

exports.log = (barcode_id, scan_action, scanned_by = null, remark = null) => {
    return db.query("INSERT INTO barcode_scan_history SET ?", {
        barcode_id,
        scan_action,
        scanned_by,
        scanned_at: new Date(),
        remark: remark || null
    });
};

// Get generation and download statistics
exports.getGenerationStats = async (filters = {}) => {
    let query = `
        SELECT 
            u.id as user_id,
            u.full_name as user_name,
            u.email as user_email,
            b.object_id as component_id,
            c.name as component_name,
            COUNT(DISTINCT bsh.barcode_id) as barcode_count,
            bsh.scan_action
        FROM barcode_scan_history bsh
        JOIN barcodes b ON bsh.barcode_id = b.id
        LEFT JOIN users u ON bsh.scanned_by = u.id
        LEFT JOIN components c ON b.object_id = c.id AND b.object_type = 'COMPONENT'
        WHERE bsh.scan_action IN ('GENERATED', 'DOWNLOADED')
    `;
    const params = [];

    if (filters.user_id) {
        query += ' AND bsh.scanned_by = ?';
        params.push(filters.user_id);
    }

    if (filters.component_id) {
        query += ' AND b.object_id = ?';
        params.push(filters.component_id);
    }

    if (filters.scan_action) {
        query += ' AND bsh.scan_action = ?';
        params.push(filters.scan_action);
    }

    if (filters.start_date) {
        query += ' AND bsh.scanned_at >= ?';
        params.push(filters.start_date);
    }

    if (filters.end_date) {
        query += ' AND bsh.scanned_at <= ?';
        params.push(filters.end_date);
    }

    query += ' GROUP BY u.id, b.object_id, bsh.scan_action ORDER BY bsh.scanned_at DESC';

    const [rows] = await db.query(query, params);
    return rows;
};

exports.getHistory = async (filters = {}) => {
    let query = `
        SELECT bsh.*, 
               b.barcode_value, 
               b.object_type, 
               b.object_id,
               u.full_name as scanned_by_name,
               u.email as scanned_by_email
        FROM barcode_scan_history bsh
        JOIN barcodes b ON bsh.barcode_id = b.id
        LEFT JOIN users u ON bsh.scanned_by = u.id
        WHERE 1=1
    `;
    const params = [];

    if (filters.barcode_id) {
        query += ' AND bsh.barcode_id = ?';
        params.push(filters.barcode_id);
    }

    if (filters.scanned_by) {
        query += ' AND bsh.scanned_by = ?';
        params.push(filters.scanned_by);
    }

    if (filters.scan_action) {
        query += ' AND bsh.scan_action = ?';
        params.push(filters.scan_action);
    }

    if (filters.start_date) {
        query += ' AND bsh.scanned_at >= ?';
        params.push(filters.start_date);
    }

    if (filters.end_date) {
        query += ' AND bsh.scanned_at <= ?';
        params.push(filters.end_date);
    }

    query += ' ORDER BY bsh.scanned_at DESC';

    if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
    }

    const [rows] = await db.query(query, params);
    return rows;
};

exports.findMany = async (values) => {
    const [rows] = await db.query(
        `SELECT * FROM barcodes WHERE barcode_value IN (?)`,
        [values]
    );
    return rows;
};

exports.findAll = async (filters = {}) => {
    let query = `
        SELECT b.*, 
               c.name as component_name,
               c.category as component_category,
               c.description as component_description,
               u.full_name as scanned_by_name,
               u.email as scanned_by_email
        FROM barcodes b
        LEFT JOIN components c ON b.object_type = 'COMPONENT' AND b.object_id = c.id
        LEFT JOIN users u ON b.last_scanned_by = u.id
        WHERE 1=1
    `;
    const params = [];

    if (filters.object_type) {
        query += ' AND b.object_type = ?';
        params.push(filters.object_type);
    }

    if (filters.object_id) {
        query += ' AND b.object_id = ?';
        params.push(filters.object_id);
    }

    if (filters.status) {
        query += ' AND b.status = ?';
        params.push(filters.status);
    }

    query += ' ORDER BY b.created_at DESC';

    if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
    }

    const [rows] = await db.query(query, params);
    return rows;
};
