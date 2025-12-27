const service = require('./box.service');

exports.start = async (req, res) => {
    try {
        const result = await service.startPacking(
            req.body.kit_id,
            req.body.box_barcode,
            req.body.packed_by || req.user?.userId || null
        );
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(400).json({ error: String(e) });
    }
};

exports.getRequirements = async (req, res) => {
    try {
        const kit_id = req.params.kit_id || req.query.kit_id;
        if (!kit_id) {
            return res.status(400).json({ error: 'kit_id is required' });
        }
        const requirements = await service.getKitRequirements(kit_id);
        res.json({ success: true, data: requirements });
    } catch (e) {
        res.status(400).json({ error: String(e) });
    }
};

exports.scan = async (req, res) => {
    try {
        const user_id = req.body.user_id || req.user?.userId || null;
        const result = await service.scanItem(
            req.body.box_barcode,
            req.body.item_barcode,
            user_id
        );
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(400).json({ error: String(e) });
    }
};

exports.getStatus = async (req, res) => {
    try {
        const box_barcode = req.params.box_barcode || req.query.box_barcode;
        if (!box_barcode) {
            return res.status(400).json({ error: 'box_barcode is required' });
        }
        const status = await service.getPackingStatus(box_barcode);
        res.json({ success: true, data: status });
    } catch (e) {
        res.status(400).json({ error: String(e) });
    }
};

exports.complete = async (req, res) => {
    try {
        const user_id = req.body.user_id || req.user?.userId || null;
        const result = await service.completeBox(req.body.box_barcode, user_id);
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(400).json({ error: String(e) });
    }
};

exports.removeItem = async (req, res) => {
    try {
        const user_id = req.body.user_id || req.user?.userId || null;
        const result = await service.removeItem(
            req.body.box_barcode,
            req.body.item_barcode,
            user_id
        );
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(400).json({ error: String(e) });
    }
};
