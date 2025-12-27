const db = require('../../config/db');

const getHistory = async (filters = {}) => {
    let query = `
        SELECT bsh.*, 
               b.barcode_value, 
               b.object_type, 
               b.object_id,
               b.quantity,
               b.status as barcode_status,
               b.parent_barcode_id,
               c.name as component_name,
               c.category as component_category,
               c.description as component_description,
               COALESCE(k.id, direct_kit.id) as kit_id,
               COALESCE(k.kit_name, direct_kit.kit_name) as product_name,
               u.full_name as scanned_by_name,
               u.email as scanned_by_email
        FROM barcode_scan_history bsh
        JOIN barcodes b ON bsh.barcode_id = b.id
        LEFT JOIN components c ON b.object_type = 'COMPONENT' AND b.object_id = c.id
        LEFT JOIN users u ON bsh.scanned_by = u.id
        LEFT JOIN (
            SELECT DISTINCT k.id, k.kit_name, kc.component_id, cat.name as category_name
            FROM kits k
            JOIN kit_components kc ON k.id = kc.kit_id
            LEFT JOIN components comp ON kc.component_id = comp.id
            LEFT JOIN categories cat ON kc.category_id = cat.id
        ) k ON (
            (k.component_id IS NOT NULL AND k.component_id = c.id) OR 
            (k.component_id IS NULL AND k.category_name = c.category)
        )
        LEFT JOIN kits direct_kit ON (b.object_type = 'BOX' AND b.object_id = direct_kit.id)
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

    if (filters.status) {
        query += ' AND b.status = ?';
        params.push(filters.status);
    }

    if (filters.kit_id) {
        query += ' AND (COALESCE(k.id, direct_kit.id) = ?)';
        params.push(filters.kit_id);
    }

    if (filters.search) {
        query += ' AND (b.barcode_value LIKE ? OR c.name LIKE ? OR k.kit_name LIKE ? OR u.full_name LIKE ? OR u.email LIKE ? OR bsh.remark LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters.start_date) {
        query += ' AND bsh.scanned_at >= ?';
        params.push(filters.start_date);
    }

    if (filters.end_date) {
        query += ' AND bsh.scanned_at <= ?';
        params.push(filters.end_date);
    }

    // Filter for SCANNED action by default if no action specified and no kit filter
    // If kit_id is provided, show all actions (including BOXED) for that kit
    if (!filters.scan_action && !filters.include_all && !filters.kit_id) {
        query += ' AND bsh.scan_action = ?';
        params.push('SCANNED');
    }

    query += ' ORDER BY bsh.scanned_at DESC';

    if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
    }

    if (filters.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
    }

    const [rows] = await db.query(query, params);
    return rows;
};

// Get summary statistics
const getStatistics = async (filters = {}) => {
    let query = `
        SELECT 
            COUNT(DISTINCT bsh.barcode_id) as total,
            SUM(CASE WHEN b.status = 'SCANNED' OR b.status = 'BOXED' THEN 1 ELSE 0 END) as success,
            SUM(CASE WHEN b.status = 'CREATED' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN b.status = 'SCRAPPED' THEN 1 ELSE 0 END) as failed
        FROM barcode_scan_history bsh
        JOIN barcodes b ON bsh.barcode_id = b.id
        LEFT JOIN components c ON b.object_type = 'COMPONENT' AND b.object_id = c.id
        LEFT JOIN users u ON bsh.scanned_by = u.id
        LEFT JOIN (
            SELECT DISTINCT k.id, k.kit_name, kc.component_id, cat.name as category_name
            FROM kits k
            JOIN kit_components kc ON k.id = kc.kit_id
            LEFT JOIN components comp ON kc.component_id = comp.id
            LEFT JOIN categories cat ON kc.category_id = cat.id
        ) k ON (
            (k.component_id IS NOT NULL AND k.component_id = c.id) OR 
            (k.component_id IS NULL AND k.category_name = c.category)
        )
        LEFT JOIN kits direct_kit ON (b.object_type = 'BOX' AND b.object_id = direct_kit.id)
        WHERE 1=1
    `;
    const params = [];

    if (filters.kit_id) {
        query += ' AND (COALESCE(k.id, direct_kit.id) = ?)';
        params.push(filters.kit_id);
    }

    if (filters.scanned_by) {
        query += ' AND bsh.scanned_by = ?';
        params.push(filters.scanned_by);
    }

    if (filters.start_date) {
        query += ' AND bsh.scanned_at >= ?';
        params.push(filters.start_date);
    }

    if (filters.end_date) {
        query += ' AND bsh.scanned_at <= ?';
        params.push(filters.end_date);
    }

    if (filters.search) {
        query += ' AND (b.barcode_value LIKE ? OR c.name LIKE ? OR u.full_name LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    const [rows] = await db.query(query, params);
    return rows[0] || { total: 0, success: 0, pending: 0, failed: 0 };
};

module.exports = {
    getHistory,
    getStatistics
};

