const service = require('./barcode.service');

exports.generate = async (req, res) => {
    try {
        const user_id = req.body.user_id || req.user?.userId || null;
        const result = await service.generate({
            ...req.body,
            user_id
        });
        
        // If new format (with product_id), return full details
        if (result.barcodes) {
            res.json({ 
                success: true, 
                barcodes: result.barcodes,
                count: result.count,
                product_id: result.product_id,
                component_id: result.component_id,
                product_name: result.product_name,
                component_name: result.component_name,
                object_type: result.object_type || 'COMPONENT'
            });
        } else {
            // Legacy format
            res.json({ success: true, barcodes: result });
        }
    } catch (e) {
        res.status(400).json({ error: String(e) });
    }
};

exports.downloadPdf = async (req, res) => {
    try {
        const user_id = req.body.user_id || req.user?.userId || null;
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=labels.pdf");
        const result = await service.downloadPdf(req.body.barcodes, res, user_id);
        // Note: PDF is streamed, so we can't send JSON response after
        // But download is logged in the service
    } catch (e) {
        res.status(400).json({ error: String(e) });
    }
};

exports.scan = async (req, res) => {
    try {
        const userId = req.body.user_id || req.user?.userId || null;
        const data = await service.validateScan(req.body.barcode, userId);
        res.json({ success: true, data });
    } catch (e) {
        res.status(400).json({ error: String(e) });
    }
};

exports.unscan = async (req, res) => {
    try {
        const userId = req.body.user_id || req.user?.userId || null;
        const data = await service.unscan(req.body.barcode, userId);
        res.json({ success: true, data });
    } catch (e) {
        res.status(400).json({ success: false, error: String(e) });
    }
};

exports.preview = async (req, res) => {
    try {
        const { barcode } = req.body;
        if (!barcode) {
            return res.status(400).json({ error: 'Barcode is required' });
        }
        const data = await service.previewBarcode(barcode);
        res.json({ 
            success: true, 
            data: {
                barcode: data.barcode_value,
                barcode_id: data.barcode_id,
                component: data.component?.name || "Unknown",
                category: data.component?.category || "UNKNOWN",
                product: data.product?.name || null,
                current_status: data.current_status,
                object_type: data.object_type
            }
        });
    } catch (e) {
        res.status(400).json({ success: false, error: String(e) });
    }
};

// Preview scan endpoint (same as preview but with different response format for component scan)
exports.previewScan = async (req, res) => {
    try {
        const { barcode } = req.body;
        if (!barcode) {
            return res.status(400).json({ error: 'Barcode is required' });
        }
        const data = await service.previewBarcode(barcode);
        res.json({ 
            success: true, 
            data: {
                barcode_id: data.barcode_id,
                barcode_value: data.barcode_value,
                component: data.component ? {
                    id: data.component.id,
                    name: data.component.name,
                    category: data.component.category,
                    description: data.component.description
                } : null,
                product: data.product ? {
                    id: data.product.id,
                    name: data.product.name,
                    description: data.product.description
                } : null,
                user: null, // No user for preview
                scanned_at: new Date(),
                status: data.current_status,
                object_type: data.object_type
            }
        });
    } catch (e) {
        res.status(400).json({ success: false, error: String(e) });
    }
};

exports.getAll = async (req, res) => {
    try {
        const filters = {
            object_type: req.query.object_type,
            object_id: req.query.object_id,
            status: req.query.status,
            limit: req.query.limit ? parseInt(req.query.limit) : 100
        };

        // Remove undefined filters
        Object.keys(filters).forEach(key => 
            filters[key] === undefined && delete filters[key]
        );

        const barcodes = await service.getAllBarcodes(filters);
        res.json({ success: true, data: barcodes, count: barcodes.length });
    } catch (e) {
        res.status(400).json({ error: String(e) });
    }
};

// Get scanned barcodes that are not boxed
exports.getScannedNotBoxed = async (req, res) => {
    try {
        const filters = {
            kit_id: req.query.kit_id ? parseInt(req.query.kit_id) : null,
            start_date: req.query.start_date,
            end_date: req.query.end_date,
            limit: req.query.limit ? parseInt(req.query.limit) : null
        };

        // Remove undefined/null filters
        Object.keys(filters).forEach(key => 
            (filters[key] === undefined || filters[key] === null) && delete filters[key]
        );

        const barcodes = await service.getScannedNotBoxed(filters);
        res.json({ success: true, data: barcodes, count: barcodes.length });
    } catch (e) {
        res.status(400).json({ success: false, error: String(e) });
    }
};

// Export scanned barcodes to CSV/Excel
exports.exportScannedNotBoxed = async (req, res) => {
    try {
        const filters = {
            kit_id: req.query.kit_id ? parseInt(req.query.kit_id) : null,
            start_date: req.query.start_date,
            end_date: req.query.end_date
        };

        // Remove undefined/null filters
        Object.keys(filters).forEach(key => 
            (filters[key] === undefined || filters[key] === null) && delete filters[key]
        );

        const csvContent = await service.exportScannedNotBoxed(filters);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=scanned_barcodes_${Date.now()}.csv`);
        res.send(csvContent);
    } catch (e) {
        res.status(400).json({ success: false, error: String(e) });
    }
};

// Lookup barcodes and generate box code PDF
exports.lookupBarcodesForBoxCode = async (req, res) => {
    try {
        const { barcodes } = req.body;
        
        if (!barcodes || !Array.isArray(barcodes) || barcodes.length === 0) {
            return res.status(400).json({ success: false, error: 'Barcode list is required' });
        }

        const barcodeData = await service.lookupBarcodesForBoxCode(barcodes);
        
        // Generate PDF with box codes for these barcodes
        const user_id = req.body.user_id || req.user?.userId || null;
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=box_codes_${Date.now()}.pdf`);
        
        await service.downloadPdf(barcodes, res, user_id);
    } catch (e) {
        res.status(400).json({ success: false, error: String(e) });
    }
};
