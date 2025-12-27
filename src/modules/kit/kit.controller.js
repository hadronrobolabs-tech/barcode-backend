const kitService = require('./kit.service');

const createKit = async (req, res, next) => {
  try {
    const kit = await kitService.create(req.body);
    res.status(201).json({ success: true, data: kit });
  } catch (err) {
    next(err);
  }
};

const getAllKits = async (req, res, next) => {
  try {
    const kits = await kitService.getAll();
    res.json({ success: true, data: kits });
  } catch (err) {
    next(err);
  }
};

const getKitById = async (req, res, next) => {
  try {
    const kit = await kitService.getById(req.params.id);
    res.json({ success: true, data: kit });
  } catch (err) {
    next(err);
  }
};

const addKitComponent = async (req, res, next) => {
  try {
    const { kit_id, component, required_quantity, barcode_prefix } = req.body;
    // component can be: { component_id } for existing, or { name, category, is_packet, packet_quantity, description } for new
    const components = await kitService.addComponent(kit_id, component, required_quantity, barcode_prefix);
    res.json({ success: true, data: components });
  } catch (err) {
    next(err);
  }
};

const updateKitComponent = async (req, res, next) => {
  try {
    const { kit_id, category_id, required_quantity } = req.body;
    const components = await kitService.updateComponent(kit_id, category_id, required_quantity);
    res.json({ success: true, data: components });
  } catch (err) {
    next(err);
  }
};

const removeKitComponent = async (req, res, next) => {
  try {
    const { kit_id, category_id, component_id } = req.body;
    const components = await kitService.removeComponent(kit_id, category_id, component_id);
    res.json({ success: true, data: components });
  } catch (err) {
    next(err);
  }
};

const updateKitComponentDetails = async (req, res, next) => {
  try {
    const { kit_id, component_id, component, required_quantity, barcode_prefix } = req.body;
    const components = await kitService.updateKitComponentDetails(
      kit_id, 
      component_id, 
      component, 
      required_quantity, 
      barcode_prefix
    );
    res.json({ success: true, data: components });
  } catch (err) {
    next(err);
  }
};

const deleteKitComponent = async (req, res, next) => {
  try {
    const { kit_id, component_id, delete_component } = req.body;
    const components = await kitService.deleteKitComponent(kit_id, component_id, delete_component || false);
    res.json({ success: true, data: components });
  } catch (err) {
    next(err);
  }
};

const getComponentsForKit = async (req, res, next) => {
  try {
    const components = await kitService.getComponentsForKit(req.params.kit_id);
    res.json({ success: true, data: components });
  } catch (err) {
    next(err);
  }
};

const updateKit = async (req, res, next) => {
  try {
    const kit = await kitService.update(req.params.id, req.body);
    res.json({ success: true, data: kit });
  } catch (err) {
    next(err);
  }
};

const deleteKit = async (req, res, next) => {
  try {
    await kitService.remove(req.params.id);
    res.json({ success: true, message: 'Kit deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createKit,
  getAllKits,
  getKitById,
  addKitComponent,
  updateKitComponent,
  updateKitComponentDetails,
  removeKitComponent,
  deleteKitComponent,
  getComponentsForKit,
  updateKit,
  deleteKit
};

