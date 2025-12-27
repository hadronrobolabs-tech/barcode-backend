const repo = require('./box.repository');
const barcodeRepo = require('../barcode/barcode.repository');
const kitRepo = require('../kit/kit.repository');
const componentRepo = require('../component/component.repo');
const db = require('../../config/db');

exports.startPacking = async (kit_id, box_barcode, packed_by = null) => {
    const box = await barcodeRepo.findByValue(box_barcode);
    if (!box || box.object_type !== 'BOX') throw "INVALID_BOX";

    const existingSession = await repo.findSessionByBoxId(box.id);
    
    // If session exists and is completed, throw error
    if (existingSession && existingSession.status === 'COMPLETED') {
        throw "BOX_ALREADY_COMPLETED";
    }

    // If session exists and is IN_PROGRESS, return existing session with packing status
    if (existingSession && existingSession.status === 'IN_PROGRESS') {
        // Get current packing status
        const packingStatus = await exports.getPackingStatus(box_barcode);
        return {
            kit_id: existingSession.kit_id,
            box_barcode_id: box.id,
            status: 'IN_PROGRESS',
            existing_session: true,
            packing_status: packingStatus
        };
    }

    // For new sessions, kit_id is required
    if (!kit_id || kit_id === 0) {
        throw "KIT_ID_REQUIRED";
    }

    // Verify kit exists
    const kit = await kitRepo.findById(kit_id);
    if (!kit) throw "KIT_NOT_FOUND";

    // Create new session
    await repo.createSession({
        kit_id,
        box_barcode_id: box.id,
        packed_by,
        status: 'IN_PROGRESS'
    });

    // Log packing start (using BOXED action for tracking)
    await barcodeRepo.log(box.id, 'BOXED', packed_by);

    return { 
        kit_id, 
        box_barcode_id: box.id, 
        status: 'IN_PROGRESS',
        existing_session: false
    };
};

// Get kit requirements with component details and barcodes
// Returns component-level requirements (not category-level)
exports.getKitRequirements = async (kit_id) => {
    const kit = await kitRepo.findById(kit_id);
    if (!kit) throw "KIT_NOT_FOUND";

    // Get required components from kit_components (using component_id if available)
    const kitComponents = await kitRepo.getKitComponents(kit_id);
    
    const requirements = [];
    for (const kc of kitComponents) {
        let component = null;
        
        // If component_id exists, get that specific component
        if (kc.component_id) {
            component = await componentRepo.findById(kc.component_id);
        } else {
            // Fallback: get first component from category (legacy support)
            const [components] = await db.query(
                `SELECT * FROM components 
                 WHERE category = ? AND status = 'ACTIVE' 
                 ORDER BY name LIMIT 1`,
                [kc.category_name]
            );
            component = components[0] || null;
        }

        if (!component) continue;

        // Get available barcodes (status = 'SCANNED' and not already boxed)
        const [barcodes] = await db.query(
            `SELECT b.id, b.barcode_value, b.status
             FROM barcodes b
             WHERE b.object_type = 'COMPONENT' 
               AND b.object_id = ?
               AND b.status = 'SCANNED'
               AND b.parent_barcode_id IS NULL
             ORDER BY b.created_at`,
            [component.id]
        );

        // Get category name for display
        const [catRows] = await db.query(
            `SELECT name, prefix FROM categories WHERE name = ? LIMIT 1`,
            [component.category]
        );
        const categoryInfo = catRows[0] || { name: component.category, prefix: '' };

        requirements.push({
            id: component.id,
            component_id: component.id,
            component_name: component.name,
            name: component.name, // For backward compatibility
            category: component.category,
            category_name: categoryInfo.name,
            description: component.description,
            required_quantity: kc.required_quantity,
            scanned: 0, // Will be updated when packing starts
            status: 'Pending', // Initial status
            barcodes: barcodes.map(b => ({
                id: b.id,
                value: b.barcode_value,
                status: b.status
            }))
        });
    }

    return {
        kit_id,
        kit_name: kit.kit_name,
        requirements
    };
};

exports.scanItem = async (box_barcode, item_barcode, user_id = null) => {
    const box = await barcodeRepo.findByValue(box_barcode);
    const item = await barcodeRepo.findByValue(item_barcode);

    if (!item) throw "ITEM_NOT_FOUND";
    if (item.object_type !== 'COMPONENT') throw "ITEM_MUST_BE_COMPONENT";
    if (item.status !== 'SCANNED') throw "ITEM_NOT_SCANNED";
    if (item.parent_barcode_id) throw "ITEM_ALREADY_BOXED";

    const session = await repo.findSessionByBoxId(box.id);
    if (!session) throw "PACKING_NOT_STARTED";

    // Get kit requirements (component-level)
    const kitRequirements = await exports.getKitRequirements(session.kit_id);
    
    // Get component details
    const component = await componentRepo.findById(item.object_id);
    if (!component) throw "COMPONENT_NOT_FOUND";

    // Verify component is in kit requirements
    const componentRequirement = kitRequirements.requirements.find(
        req => req.component_id === component.id || req.id === component.id
    );
    if (!componentRequirement) {
        throw "COMPONENT_NOT_REQUIRED_FOR_KIT";
    }

    // Check if we've already scanned enough of this specific component
    const packedItems = await repo.getPackedItems(session.id);
    const componentScanned = packedItems.filter(pi => 
        pi.component_id === component.id
    ).length;

    if (componentScanned >= componentRequirement.required_quantity) {
        throw "COMPONENT_QUANTITY_EXCEEDED";
    }

    // Add item to packing
    await repo.addPackedItem(session.id, item.id);
    await barcodeRepo.update(item.id, {
        status: 'BOXED',
        parent_barcode_id: box.id
    });

    // Log scan action
    await barcodeRepo.log(item.id, 'BOXED', user_id);

    // Check if all requirements are met (component-level)
    const allPacked = await repo.getPackedItems(session.id);
    const componentCounts = {};
    allPacked.forEach(pi => {
        componentCounts[pi.component_id] = (componentCounts[pi.component_id] || 0) + 1;
    });

    let allComplete = true;
    for (const req of kitRequirements.requirements) {
        const scannedCount = componentCounts[req.component_id] || 0;
        if (scannedCount < req.required_quantity) {
            allComplete = false;
            break;
        }
    }

    return {
        success: true,
        component: {
            id: component.id,
            name: component.name,
            category: component.category
        },
        progress: {
            scanned: allPacked.length,
            required: kitRequirements.requirements.reduce((sum, req) => sum + req.required_quantity, 0),
            component_counts: componentCounts,
            all_complete: allComplete
        }
    };
};

exports.removeItem = async (box_barcode, item_barcode, user_id = null) => {
    const box = await barcodeRepo.findByValue(box_barcode);
    const item = await barcodeRepo.findByValue(item_barcode);

    if (!item) throw "ITEM_NOT_FOUND";
    if (item.object_type !== 'COMPONENT') throw "ITEM_MUST_BE_COMPONENT";

    const session = await repo.findSessionByBoxId(box.id);
    if (!session) throw "PACKING_NOT_STARTED";
    
    if (session.status === 'COMPLETED') {
        throw "CANNOT_REMOVE_FROM_COMPLETED_BOX";
    }

    // Check if item is in this box
    const packedItems = await repo.getPackedItems(session.id);
    const itemInBox = packedItems.find(pi => pi.barcode_id === item.id);
    
    if (!itemInBox) {
        throw "ITEM_NOT_IN_THIS_BOX";
    }

    // Remove item from box_packing_items
    const removed = await repo.removePackedItem(session.id, item.id);
    if (!removed) {
        throw "FAILED_TO_REMOVE_ITEM";
    }

    // Update barcode status back to SCANNED (unbox it)
    await barcodeRepo.update(item.id, {
        status: 'SCANNED',
        parent_barcode_id: null
    });

    // Log removal action
    await barcodeRepo.log(item.id, 'UNBOXED', user_id, `Removed from box ${box.barcode_value}`);

    // Get updated progress
    const updatedPackedItems = await repo.getPackedItems(session.id);
    const componentCounts = {};
    updatedPackedItems.forEach(pi => {
        componentCounts[pi.component_id] = (componentCounts[pi.component_id] || 0) + 1;
    });

    const kitRequirements = await exports.getKitRequirements(session.kit_id);
    let allComplete = true;
    for (const req of kitRequirements.requirements) {
        const scannedCount = componentCounts[req.component_id] || 0;
        if (scannedCount < req.required_quantity) {
            allComplete = false;
            break;
        }
    }

    return {
        success: true,
        component: {
            id: item.object_id,
            name: itemInBox.component_name || 'Unknown'
        },
        progress: {
            scanned: updatedPackedItems.length,
            required: kitRequirements.requirements.reduce((sum, req) => sum + req.required_quantity, 0),
            component_counts: componentCounts,
            all_complete: allComplete
        }
    };
};

exports.completeBox = async (box_barcode, user_id = null) => {
    const box = await barcodeRepo.findByValue(box_barcode);
    const session = await repo.findSessionByBoxId(box.id);
    if (!session) throw "PACKING_NOT_STARTED";

    // Get component-level requirements
    const kitRequirements = await exports.getKitRequirements(session.kit_id);
    const packedItems = await repo.getPackedItems(session.id);
    
    // Count scanned items by component_id
    const componentCounts = {};
    packedItems.forEach(pi => {
        componentCounts[pi.component_id] = (componentCounts[pi.component_id] || 0) + 1;
    });

    // Check if all component requirements are met
    const missingComponents = [];
    for (const req of kitRequirements.requirements) {
        const scannedCount = componentCounts[req.component_id] || 0;
        if (scannedCount < req.required_quantity) {
            missingComponents.push({
                component: req.component_name,
                category: req.category_name,
                required: req.required_quantity,
                scanned: scannedCount
            });
        }
    }

    if (missingComponents.length > 0) {
        const missingList = missingComponents.map(m => 
            `${m.component} (${m.category}): ${m.scanned}/${m.required}`
        ).join(', ');
        throw `MISSING_COMPONENTS: ${missingList}`;
    }

    // Mark all barcodes as used for this box
    for (const item of packedItems) {
        await barcodeRepo.update(item.barcode_id, {
            status: 'BOXED',
            parent_barcode_id: box.id
        });
    }

    // Complete session
    await repo.completeSession(session.id, user_id);
    await barcodeRepo.update(box.id, { status: 'BOXED' });

    // Get list of all component barcodes in this box for remarks
    const componentBarcodes = packedItems.map(pi => pi.barcode_value).join(', ');
    
    // Create remark with box barcode and component barcodes
    const remark = `Box Packed: Box Barcode: ${box.barcode_value}, Component Barcodes: ${componentBarcodes}`;

    // Log completion with remark (using BOXED action for tracking)
    await barcodeRepo.log(box.id, 'BOXED', user_id, remark);

    // Get list of all barcodes in this box for mapping
    const boxBarcodes = packedItems.map(pi => ({
        barcode_id: pi.barcode_id,
        barcode_value: pi.barcode_value,
        component_id: pi.component_id,
        component_name: pi.component_name
    }));

    return {
        success: true,
        box_barcode: box.barcode_value,
        kit_id: session.kit_id,
        kit_name: kitRequirements.kit_name,
        items_packed: packedItems.length,
        barcodes: boxBarcodes,
        completed_at: new Date()
    };
};

// Get packing status/progress (component-level tracking)
exports.getPackingStatus = async (box_barcode) => {
    const box = await barcodeRepo.findByValue(box_barcode);
    if (!box) throw "BOX_NOT_FOUND";

    const session = await repo.findSessionByBoxId(box.id);
    if (!session) throw "PACKING_NOT_STARTED";

    // Get component-level requirements
    const kitRequirements = await exports.getKitRequirements(session.kit_id);
    const packedItems = await repo.getPackedItems(session.id);

    // Count scanned items by component_id
    const componentCounts = {};
    packedItems.forEach(pi => {
        componentCounts[pi.component_id] = (componentCounts[pi.component_id] || 0) + 1;
    });

    // Build requirements with component-level tracking and scanned barcodes
    const requirements = kitRequirements.requirements.map(req => {
        const scannedBarcodes = packedItems
            .filter(pi => pi.component_id === req.component_id)
            .map(pi => pi.barcode_value);
        
        return {
            id: req.component_id,
            component_id: req.component_id,
            component_name: req.component_name,
            name: req.component_name, // For backward compatibility
            category: req.category,
            category_name: req.category_name,
            required: req.required_quantity,
            scanned: componentCounts[req.component_id] || 0,
            scanned_barcodes: scannedBarcodes,
            complete: (componentCounts[req.component_id] || 0) >= req.required_quantity,
            status: (componentCounts[req.component_id] || 0) >= req.required_quantity ? 'Success' : 'Pending'
        };
    });

    return {
        box_barcode: box.barcode_value,
        kit_id: session.kit_id,
        kit_name: kitRequirements.kit_name,
        status: session.status,
        requirements,
        total_scanned: packedItems.length,
        total_required: kitRequirements.requirements.reduce((sum, req) => sum + req.required_quantity, 0),
        all_complete: requirements.every(r => r.complete)
    };
};

