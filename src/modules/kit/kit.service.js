const kitRepo = require('./kit.repository');

const create = async (data) => {
  const { kit_name, description, components } = data;

  if (!kit_name) {
    throw new Error('Kit name is required');
  }

  // Check if kit name already exists
  const existing = await kitRepo.findAll();
  if (existing.some(k => k.kit_name === kit_name)) {
    throw new Error('Kit with this name already exists');
  }

  const kit = await kitRepo.create({ kit_name, description });

  // Add components if provided
  if (components && Array.isArray(components)) {
    for (const comp of components) {
      if (comp.category_id && comp.required_quantity) {
        await kitRepo.addKitComponent(kit.id, comp.category_id, comp.required_quantity);
      }
    }
  }

  return { ...kit, components: await kitRepo.getKitComponents(kit.id) };
};

const getAll = async () => {
  const kits = await kitRepo.findAll();
  // Get components for each kit
  for (const kit of kits) {
    kit.components = await kitRepo.getKitComponents(kit.id);
  }
  return kits;
};

const getById = async (id) => {
  const kit = await kitRepo.findById(id);
  if (!kit) {
    throw new Error('Kit not found');
  }
  kit.components = await kitRepo.getKitComponents(id);
  return kit;
};

const addComponent = async (kit_id, componentData, required_quantity, barcode_prefix = null) => {
  if (!kit_id || !required_quantity) {
    throw new Error('Kit ID and required quantity are required');
  }

  if (!barcode_prefix || barcode_prefix.trim().length < 2) {
    throw new Error('Barcode prefix is required (2-10 characters)');
  }

  // Normalize prefix: uppercase and trim
  barcode_prefix = barcode_prefix.trim().toUpperCase();

  const kit = await kitRepo.findById(kit_id);
  if (!kit) {
    throw new Error('Kit not found');
  }

  const componentRepo = require('../component/component.repo');
  
  // Create component if it doesn't exist (componentData contains name, category, etc.)
  let component_id = componentData.component_id;
  
  if (!component_id && componentData.name && componentData.category) {
    // Create new component
    const newComponent = await componentRepo.create({
      name: componentData.name,
      category: componentData.category,
      is_packet: componentData.is_packet || false,
      packet_quantity: componentData.packet_quantity || null,
      description: componentData.description || null,
      status: 'ACTIVE'
    });
    component_id = newComponent.id;
  } else if (!component_id) {
    throw new Error('Component data (name, category) is required to create a new component');
  }

  // Get category_id from category name
  const db = require('../../config/db');
  const [catRows] = await db.query(`SELECT id FROM categories WHERE name = ?`, [componentData.category]);
  if (catRows.length === 0) {
    throw new Error('Category not found');
  }
  const category_id = catRows[0].id;

  // Check if component already exists in this kit
  const existing = await kitRepo.getKitComponents(kit_id);
  if (existing.some(c => c.component_id === component_id)) {
    throw new Error('Component already exists in this kit');
  }

  // Add component to kit with prefix
  await kitRepo.addKitComponentById(kit_id, component_id, required_quantity, barcode_prefix);
  
  return kitRepo.getKitComponents(kit_id);
};

const updateComponent = async (kit_id, category_id, required_quantity) => {
  await kitRepo.updateKitComponent(kit_id, category_id, required_quantity);
  return kitRepo.getKitComponents(kit_id);
};

// Update component details (component itself and kit_components relationship)
const updateKitComponentDetails = async (kit_id, component_id, componentData, required_quantity, barcode_prefix) => {
  if (!kit_id || !component_id) {
    throw new Error('Kit ID and Component ID are required');
  }

  const componentRepo = require('../component/component.repo');
  
  // Update component details
  await componentRepo.update(component_id, {
    name: componentData.name,
    category: componentData.category,
    is_packet: componentData.is_packet || false,
    packet_quantity: componentData.packet_quantity || null,
    description: componentData.description || null
  });

  // Update kit_components relationship (required_quantity and barcode_prefix)
  if (barcode_prefix) {
    barcode_prefix = barcode_prefix.trim().toUpperCase();
    if (barcode_prefix.length < 2) {
      throw new Error('Barcode prefix must be at least 2 characters');
    }
  }

  // Get category_id from category name
  const db = require('../../config/db');
  const [catRows] = await db.query(`SELECT id FROM categories WHERE name = ?`, [componentData.category]);
  if (catRows.length === 0) {
    throw new Error('Category not found');
  }
  const category_id = catRows[0].id;

  // Update kit_components
  await kitRepo.updateKitComponentWithPrefix(kit_id, component_id, category_id, required_quantity, barcode_prefix);
  
  return kitRepo.getKitComponents(kit_id);
};

// Delete component from kit and optionally delete the component itself
const deleteKitComponent = async (kit_id, component_id, deleteComponent = false) => {
  if (!kit_id || !component_id) {
    throw new Error('Kit ID and Component ID are required');
  }

  // Remove from kit_components
  await kitRepo.removeKitComponentById(kit_id, component_id);

  // Optionally delete the component itself
  if (deleteComponent) {
    const componentRepo = require('../component/component.repo');
    await componentRepo.remove(component_id);
  }

  return kitRepo.getKitComponents(kit_id);
};

const removeComponent = async (kit_id, category_id, component_id = null) => {
  await kitRepo.removeKitComponent(kit_id, category_id, component_id);
  return kitRepo.getKitComponents(kit_id);
};

const getComponentsForKit = async (kit_id) => {
  const kit = await kitRepo.findById(kit_id);
  if (!kit) {
    throw new Error('Kit not found');
  }
  return kitRepo.getComponentsForKit(kit_id);
};

const update = async (id, data) => {
  const { kit_name, description } = data;

  if (!kit_name) {
    throw new Error('Kit name is required');
  }

  const kit = await kitRepo.findById(id);
  if (!kit) {
    throw new Error('Kit not found');
  }

  // Check if kit name already exists (excluding current kit)
  const existing = await kitRepo.findAll();
  if (existing.some(k => k.kit_name === kit_name && k.id !== id)) {
    throw new Error('Kit with this name already exists');
  }

  return kitRepo.update(id, { kit_name, description });
};

const remove = async (id) => {
  const kit = await kitRepo.findById(id);
  if (!kit) {
    throw new Error('Kit not found');
  }
  return kitRepo.remove(id);
};

module.exports = {
  create,
  getAll,
  getById,
  addComponent,
  updateComponent,
  updateKitComponentDetails,
  deleteKitComponent,
  removeComponent,
  getComponentsForKit,
  update,
  remove
};

