const componentRepo = require('./component.repo');

const create = async (data) => {
  const { name, category, is_packet, packet_quantity } = data;

  if (!name || !category) {
    throw new Error('Name and category are required');
  }

  if (is_packet && !packet_quantity) {
    throw new Error('Packet quantity required for packet components');
  }

  return componentRepo.create(data);
};

const getAll = async () => {
  return componentRepo.findAll();
};

const getById = async (id) => {
  const component = await componentRepo.findById(id);
  if (!component) {
    throw new Error('Component not found');
  }
  return component;
};

const update = async (id, data) => {
  const { name, category, is_packet, packet_quantity, description, status } = data;

  if (!name || !category) {
    throw new Error('Name and category are required');
  }

  if (is_packet && !packet_quantity) {
    throw new Error('Packet quantity required for packet components');
  }

  const component = await componentRepo.findById(id);
  if (!component) {
    throw new Error('Component not found');
  }

  return componentRepo.update(id, {
    name,
    category,
    is_packet: is_packet || false,
    packet_quantity: packet_quantity || null,
    description: description || null,
    status: status || 'ACTIVE'
  });
};

const remove = async (id) => {
  const component = await componentRepo.findById(id);
  if (!component) {
    throw new Error('Component not found');
  }
  return componentRepo.remove(id);
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove
};
