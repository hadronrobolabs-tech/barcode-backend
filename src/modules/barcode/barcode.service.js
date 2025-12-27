const repo = require('./barcode.repository');
const bwipjs = require('bwip-js');
const PDFDocument = require('pdfkit');
const componentRepo = require('../component/component.repo');
const categoryRepo = require('../category/category.repository');
const kitRepo = require('../kit/kit.repository');
const db = require('../../config/db');

exports.generate = async (data) => {
    const { product_id, component_id, quantity, description, user_id, object_type, object_id, category_id } = data;

    // New flow: Product (kit) + Component
    if (product_id && component_id) {
        // Get product (kit) details
        const product = await kitRepo.findById(product_id);
        if (!product) {
            throw new Error('Product (Kit) not found');
        }

        // Get component details
        const component = await componentRepo.findById(component_id);
        if (!component) {
            throw new Error('Component not found');
        }

        // Get component-specific prefix from kit_components table
        let componentPrefix = null;
        try {
            const [kitComponentRows] = await db.query(
                `SELECT barcode_prefix FROM kit_components 
                 WHERE kit_id = ? AND component_id = ? 
                 LIMIT 1`,
                [product_id, component_id]
            );
            componentPrefix = kitComponentRows[0]?.barcode_prefix;
        } catch (err) {
            // If barcode_prefix column doesn't exist, fall back to category prefix
            console.log('barcode_prefix column not found, using category prefix');
        }

        // If no component-specific prefix, fall back to category prefix
        if (!componentPrefix) {
            const [categoryRows] = await db.query(
                `SELECT prefix FROM categories WHERE name = ? LIMIT 1`,
                [component.category]
            );
            componentPrefix = categoryRows[0]?.prefix || 'CP';
        }

        // Use only component prefix (no kit prefix)
        const prefix = componentPrefix.toUpperCase();

        const count = quantity || 1;
        const result = [];
        const generatedBarcodes = [];

        // Get the last barcode number for this prefix to continue the sequence
        const [lastBarcodeRows] = await db.query(
            `SELECT barcode_value FROM barcodes 
             WHERE barcode_value LIKE ? AND object_type = 'COMPONENT'
             ORDER BY barcode_value DESC LIMIT 1`,
            [`${prefix}%`]
        );

        let nextNumber = 1; // Start from 1 if no barcode exists
        if (lastBarcodeRows.length > 0) {
            const lastBarcode = lastBarcodeRows[0].barcode_value;
            // Extract the number part (everything after the prefix)
            const numberPart = lastBarcode.substring(prefix.length);
            const lastNumber = parseInt(numberPart, 10);
            if (!isNaN(lastNumber)) {
                nextNumber = lastNumber + 1;
            }
        }

        for (let i = 0; i < count; i++) {
            // Generate barcode: prefix + 7-digit number with leading zeros
            const paddedNumber = String(nextNumber).padStart(7, '0');
            const value = prefix + paddedNumber;
            nextNumber++;

            const id = await repo.create({
                barcode_value: value,
                object_type: 'COMPONENT',
                object_id: component_id,
                quantity: component.is_packet && component.packet_quantity ? component.packet_quantity : 1,
                status: 'CREATED',
                barcode_rendered: false
            });

            // Log generation with user_id
            await repo.log(id, 'GENERATED', user_id);
            
            generatedBarcodes.push({ id, value, product_id, component_id });
            result.push(value);
        }

        // Return with metadata for history tracking
        return {
            barcodes: result,
            count: result.length,
            product_id,
            component_id,
            product_name: product.kit_name,
            component_name: component.name,
            description: description || component.description
        };
    }

    // New flow: Product (kit) + Box barcode (component_id is null, object_type is BOX)
    if (product_id && !component_id && object_type === 'BOX') {
        // Get product (kit) details
        const product = await kitRepo.findById(product_id);
        if (!product) {
            throw new Error('Product (Kit) not found');
        }

        // Generate prefix: Product prefix (first 3 chars of kit_name) + BOX prefix
        const productPrefix = product.kit_name.substring(0, 3).toUpperCase().replace(/\s/g, '');
        const prefix = productPrefix + 'BOX';

        const count = quantity || 1;
        const result = [];
        const generatedBarcodes = [];

        for (let i = 0; i < count; i++) {
            // Generate barcode with combined prefix
            const timestamp = Date.now();
            const random = Math.floor(100000 + Math.random() * 900000);
            const value = prefix + timestamp + random;

            const id = await repo.create({
                barcode_value: value,
                object_type: 'BOX',
                object_id: product_id, // Store kit_id as object_id for box barcodes
                quantity: 1,
                status: 'CREATED',
                barcode_rendered: false
            });

            // Log generation with user_id
            await repo.log(id, 'GENERATED', user_id);
            
            generatedBarcodes.push({ id, value, product_id, object_type: 'BOX' });
            result.push(value);
        }

        // Return with metadata for history tracking
        return {
            barcodes: result,
            count: result.length,
            product_id,
            component_id: null,
            product_name: product.kit_name,
            component_name: null,
            object_type: 'BOX',
            description: `Box barcode for ${product.kit_name}`
        };
    }

    // Legacy flow: object_type based (for backward compatibility)
    if (!object_type || !['COMPONENT', 'BOX'].includes(object_type)) {
        throw new Error('object_type must be COMPONENT or BOX');
    }

    let prefix = 'BC'; // Default prefix
    let itemQuantity = quantity || 1;

    // If generating for a component, get category prefix and packet quantity
    if (object_type === 'COMPONENT' && object_id) {
        const component = await componentRepo.findById(object_id);
        if (!component) {
            throw new Error('Component not found');
        }

        // Get category prefix if category_id provided, otherwise use component category
        if (category_id) {
            const category = await categoryRepo.findById(category_id);
            if (category) {
                prefix = category.prefix;
            }
        }

        // If component is a packet, use packet_quantity
        if (component.is_packet && component.packet_quantity) {
            itemQuantity = component.packet_quantity;
        }
    } else if (object_type === 'BOX' && category_id) {
        const category = await categoryRepo.findById(category_id);
        if (category) {
            prefix = category.prefix;
        }
    }

    const count = quantity || 1;
    const result = [];

    for (let i = 0; i < count; i++) {
        // Generate barcode with prefix
        const value = prefix + Date.now() + Math.floor(100000 + Math.random() * 900000);

        const id = await repo.create({
            barcode_value: value,
            object_type,
            object_id,
            quantity: itemQuantity,
            status: 'CREATED',
            barcode_rendered: false
        });

        await repo.log(id, 'GENERATED', user_id);
        result.push(value);
    }
    return result;
};

exports.downloadPdf = async (barcodeValues, res, user_id = null) => {
    const doc = new PDFDocument({ margin: 10, size: 'A4' });
    doc.pipe(res);

    let downloadCount = 0;

    for (const val of barcodeValues) {
        const barcode = await repo.findByValue(val);
        if (!barcode) continue;

        try {
            // Generate Code128 barcode image (without text to avoid duplication)
            const barcodeImage = await bwipjs.toBuffer({
                bcid: 'code128',      // Barcode type: Code128 (supports alphanumeric)
                text: val,             // Barcode value
                scale: 3,              // Scaling factor
                height: 10,            // Bar height in mm
                includetext: false     // Don't include text in barcode image (we'll add it separately below)
            });

            // Add barcode image to PDF (centered)
            doc.image(barcodeImage, { 
                width: 200,
                align: 'center'
            });
            
            // Add text below barcode (centered, with spacing)
            doc.moveDown(0.5);
            doc.text(val, { 
                align: 'center', 
                fontSize: 12,
                lineGap: 2
            });
            
            // Mark barcode as rendered
            if (barcode.id) {
                await repo.update(barcode.id, { barcode_rendered: true });
                // Log download action
                await repo.log(barcode.id, 'DOWNLOADED', user_id);
                downloadCount++;
            }
            
            doc.moveDown(2);
        } catch (error) {
            console.error(`Error generating barcode for ${val}:`, error);
            // Still add the text even if barcode generation fails
            doc.text(val, { align: 'center', fontSize: 12 });
            doc.moveDown(2);
        }
    }

    doc.end();
    
    return { downloaded: downloadCount };
};

// Preview/Validate barcode without saving (for frontend preview)
exports.previewBarcode = async (barcodeValue) => {
    const bc = await repo.findByValue(barcodeValue);
    if (!bc) throw "INVALID_BARCODE";
    if (bc.status === 'SCRAPPED') throw "SCRAPPED_ITEM";

    // Get component details if it's a component barcode
    let component = null;
    let product = null;
    
    if (bc.object_type === 'COMPONENT' && bc.object_id) {
        component = await componentRepo.findById(bc.object_id);
        
        // Try to find which product/kit this component belongs to
        if (component) {
            const [kitRows] = await db.query(
                `SELECT k.* FROM kits k
                 JOIN kit_components kc ON k.id = kc.kit_id
                 JOIN categories cat ON kc.category_id = cat.id
                 WHERE cat.name = ? LIMIT 1`,
                [component.category]
            );
            if (kitRows.length > 0) {
                product = kitRows[0];
            }
        }
    } else if (bc.object_type === 'BOX' && bc.object_id) {
        // For box barcodes, object_id is the kit_id
        product = await kitRepo.findById(bc.object_id);
    }

    // Get category name for component
    let categoryName = null;
    if (component && component.category) {
        const [catRows] = await db.query(
            `SELECT name FROM categories WHERE name = ? LIMIT 1`,
            [component.category]
        );
        categoryName = catRows[0]?.name || component.category;
    }

    // Return enriched data WITHOUT saving
    return {
        barcode_id: bc.id,
        barcode_value: bc.barcode_value,
        current_status: bc.status,
        component: component ? {
            id: component.id,
            name: component.name,
            category: component.category,
            category_name: categoryName,
            description: component.description
        } : null,
        product: product ? {
            id: product.id,
            name: product.kit_name,
            description: product.description
        } : null,
        object_type: bc.object_type
    };
};

exports.unscan = async (barcodeValue, userId) => {
    const barcode = await repo.findByValue(barcodeValue);
    if (!barcode) throw "INVALID_BARCODE";
    
    // Only allow unscanning if status is SCANNED and not boxed
    if (barcode.status !== 'SCANNED') {
        throw "CAN_ONLY_UNSCAN_SCANNED_ITEMS";
    }
    
    if (barcode.parent_barcode_id !== null) {
        throw "CANNOT_UNSCAN_BOXED_ITEMS";
    }

    // Update status back to CREATED
    await repo.update(barcode.id, {
        status: 'CREATED'
    });

    // Log unscan action
    await repo.log(barcode.id, 'UNSCANNED', userId, 'Barcode unscan - status reset to CREATED');

    // Get component details
    let component = null;
    if (barcode.object_type === 'COMPONENT' && barcode.object_id) {
        const [components] = await db.query(
            "SELECT * FROM components WHERE id = ?",
            [barcode.object_id]
        );
        component = components[0] || null;
    }

    return {
        barcode_value: barcode.barcode_value,
        status: 'CREATED',
        component: component ? {
            id: component.id,
            name: component.name,
            category: component.category
        } : null
    };
};

exports.validateScan = async (barcodeValue, userId) => {
    const bc = await repo.findByValue(barcodeValue);
    if (!bc) throw "INVALID_BARCODE";
    if (bc.status === 'SCRAPPED') throw "SCRAPPED_ITEM";
    // Check if already scanned - prevent duplicate scanning
    if (bc.status === 'SCANNED' || bc.status === 'BOXED') {
        throw `ALREADY_SCANNED: This barcode has already been scanned (Status: ${bc.status}). It cannot be scanned again.`;
    }

    // Get component details if it's a component barcode
    let component = null;
    let product = null;
    
    if (bc.object_type === 'COMPONENT' && bc.object_id) {
        component = await componentRepo.findById(bc.object_id);
        
        // Try to find which product/kit this component belongs to
        // This is a bit tricky since we don't store product_id in barcodes
        // We can check kit_components to see if this component's category matches any kit
        if (component) {
            const [kitRows] = await db.query(
                `SELECT k.* FROM kits k
                 JOIN kit_components kc ON k.id = kc.kit_id
                 JOIN categories cat ON kc.category_id = cat.id
                 WHERE cat.name = ? LIMIT 1`,
                [component.category]
            );
            if (kitRows.length > 0) {
                product = kitRows[0];
            }
        }
    }

    // Get user details
    let user = null;
    if (userId) {
        const [userRows] = await db.query(
            `SELECT id, full_name, email FROM users WHERE id = ?`,
            [userId]
        );
        if (userRows.length > 0) {
            user = userRows[0];
        }
    }

    // Update barcode status to SCANNED
    await repo.update(bc.id, {
        status: 'SCANNED',
        last_scanned_at: new Date(),
        last_scanned_by: userId
    });

    // Log scan action
    await repo.log(bc.id, 'SCANNED', userId);

    // Return enriched data
    return {
        barcode_id: bc.id,
        barcode_value: bc.barcode_value,
        component: component ? {
            id: component.id,
            name: component.name,
            category: component.category,
            description: component.description
        } : null,
        product: product ? {
            id: product.id,
            name: product.kit_name,
            description: product.description
        } : null,
        user: user ? {
            id: user.id,
            full_name: user.full_name,
            email: user.email
        } : null,
        scanned_at: new Date(),
        status: 'SCANNED'
    };
};

exports.getAllBarcodes = async (filters = {}) => {
    return repo.findAll(filters);
};

// Get scanned barcodes that are not boxed (for export)
exports.getScannedNotBoxed = async (filters = {}) => {
    const db = require('../../config/db');
    
    let query = `
        SELECT 
            b.id,
            b.barcode_value,
            b.status,
            b.created_at,
            b.last_scanned_at,
            c.name as component_name,
            c.category as component_category,
            c.description as component_description,
            u_scanned.full_name as scanned_by_name,
            u_scanned.email as scanned_by_email,
            u_generated.full_name as generated_by_name,
            u_generated.email as generated_by_email,
            k.kit_name as product_name
        FROM barcodes b
        LEFT JOIN components c ON b.object_type = 'COMPONENT' AND b.object_id = c.id
        LEFT JOIN users u_scanned ON b.last_scanned_by = u_scanned.id
        LEFT JOIN barcode_scan_history bsh_gen ON bsh_gen.barcode_id = b.id AND bsh_gen.scan_action = 'GENERATED'
        LEFT JOIN users u_generated ON bsh_gen.scanned_by = u_generated.id
        LEFT JOIN kits k ON (
            SELECT kc.kit_id FROM kit_components kc
            JOIN categories cat ON kc.category_id = cat.id
            WHERE cat.name = c.category LIMIT 1
        ) = k.id
        WHERE b.status = 'SCANNED' 
          AND b.parent_barcode_id IS NULL
          AND b.object_type = 'COMPONENT'
    `;
    
    const params = [];
    
    if (filters.kit_id) {
        query += ` AND k.id = ?`;
        params.push(filters.kit_id);
    }
    
    if (filters.start_date) {
        query += ` AND b.last_scanned_at >= ?`;
        params.push(filters.start_date);
    }
    
    if (filters.end_date) {
        query += ` AND b.last_scanned_at <= ?`;
        params.push(filters.end_date);
    }
    
    query += ` ORDER BY b.last_scanned_at DESC`;
    
    if (filters.limit) {
        query += ` LIMIT ?`;
        params.push(filters.limit);
    }
    
    const [rows] = await db.query(query, params);
    return rows;
};

// Export scanned barcodes to CSV/Excel format
exports.exportScannedNotBoxed = async (filters = {}) => {
    const data = await exports.getScannedNotBoxed(filters);
    
    // Convert to CSV format
    const headers = [
        'Barcode Number',
        'Component Name',
        'Category',
        'Product/Kit Name',
        'Status',
        'Scanned By',
        'Scanned By Email',
        'Scanned At',
        'Generated By',
        'Generated By Email',
        'Created At'
    ];
    
    const rows = data.map(item => [
        item.barcode_value || '',
        item.component_name || '',
        item.component_category || '',
        item.product_name || '',
        item.status || '',
        item.scanned_by_name || '',
        item.scanned_by_email || '',
        item.last_scanned_at ? new Date(item.last_scanned_at).toLocaleString() : '',
        item.generated_by_name || '',
        item.generated_by_email || '',
        item.created_at ? new Date(item.created_at).toLocaleString() : ''
    ]);
    
    // Create CSV content
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    return csvContent;
};

// Lookup barcodes by list and generate box code PDF
exports.lookupBarcodesForBoxCode = async (barcodeList) => {
    if (!Array.isArray(barcodeList) || barcodeList.length === 0) {
        throw "BARCODE_LIST_REQUIRED";
    }
    
    const db = require('../../config/db');
    
    // Find all barcodes
    const placeholders = barcodeList.map(() => '?').join(',');
    const [barcodes] = await db.query(
        `SELECT b.*, c.name as component_name, c.category as component_category
         FROM barcodes b
         LEFT JOIN components c ON b.object_type = 'COMPONENT' AND b.object_id = c.id
         WHERE b.barcode_value IN (${placeholders})`,
        barcodeList
    );
    
    if (barcodes.length === 0) {
        throw "NO_BARCODES_FOUND";
    }
    
    // Check if all barcodes are valid
    const foundValues = barcodes.map(b => b.barcode_value);
    const missing = barcodeList.filter(b => !foundValues.includes(b));
    
    if (missing.length > 0) {
        throw `BARCODES_NOT_FOUND: ${missing.join(', ')}`;
    }
    
    return barcodes;
};
