const componentService = require('./component.service');

const createComponent = async (req, res, next) => {
  try {
    const component = await componentService.create(req.body);
    res.status(201).json({ success: true, data: component });
  } catch (err) {
    next(err);
  }
};

const getAllComponents = async (req, res, next) => {
  try {
    const components = await componentService.getAll();
    res.json({ success: true, data: components });
  } catch (err) {
    next(err);
  }
};

const getComponentById = async (req, res, next) => {
  try {
    const component = await componentService.getById(req.params.id);
    res.json({ success: true, data: component });
  } catch (err) {
    next(err);
  }
};

const updateComponent = async (req, res, next) => {
  try {
    const component = await componentService.update(req.params.id, req.body);
    res.json({ success: true, data: component });
  } catch (err) {
    next(err);
  }
};

const deleteComponent = async (req, res, next) => {
  try {
    await componentService.remove(req.params.id);
    res.json({ success: true, message: 'Component deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createComponent,
  getAllComponents,
  getComponentById,
  updateComponent,
  deleteComponent
};
