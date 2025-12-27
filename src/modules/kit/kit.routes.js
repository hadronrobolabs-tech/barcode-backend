const express = require('express');
const router = express.Router();
const kitController = require('./kit.controller');

router.post('/', kitController.createKit);
router.get('/', kitController.getAllKits);
router.get('/:id', kitController.getKitById);
router.put('/:id', kitController.updateKit);
router.delete('/:id', kitController.deleteKit);
router.get('/:kit_id/components', kitController.getComponentsForKit);
router.post('/components', kitController.addKitComponent);
router.put('/components', kitController.updateKitComponent);
router.put('/components/details', kitController.updateKitComponentDetails);
router.delete('/components', kitController.removeKitComponent);
router.delete('/components/delete', kitController.deleteKitComponent);

module.exports = router;

