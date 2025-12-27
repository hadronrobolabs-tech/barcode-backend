const categoryRepo = require('./category.repository');

const create = async (data) => {
  const { name, prefix, scan_type } = data;

  if (!name || !prefix || !scan_type) {
    throw new Error('Name, prefix, and scan_type are required');
  }

  if (!['PACKET', 'ITEM', 'BOX'].includes(scan_type)) {
    throw new Error('scan_type must be PACKET, ITEM, or BOX');
  }

  // Check if prefix already exists
  const existing = await categoryRepo.findByPrefix(prefix);
  if (existing) {
    throw new Error('Category with this prefix already exists');
  }

  return categoryRepo.create(data);
};

const getAll = async () => {
  return categoryRepo.findAll();
};

const getById = async (id) => {
  const category = await categoryRepo.findById(id);
  if (!category) {
    throw new Error('Category not found');
  }
  return category;
};

const update = async (id, data) => {
  const { name, prefix, scan_type } = data;

  if (!name || !prefix || !scan_type) {
    throw new Error('Name, prefix, and scan_type are required');
  }

  if (!['PACKET', 'ITEM', 'BOX'].includes(scan_type)) {
    throw new Error('scan_type must be PACKET, ITEM, or BOX');
  }

  const category = await categoryRepo.findById(id);
  if (!category) {
    throw new Error('Category not found');
  }

  // Check if prefix already exists (excluding current category)
  const existing = await categoryRepo.findByPrefix(prefix);
  if (existing && existing.id !== id) {
    throw new Error('Category with this prefix already exists');
  }

  return categoryRepo.update(id, data);
};

const remove = async (id) => {
  const category = await categoryRepo.findById(id);
  if (!category) {
    throw new Error('Category not found');
  }
  return categoryRepo.remove(id);
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove
};

