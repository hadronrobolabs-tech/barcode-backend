const router = require('express').Router();
const ctrl = require('./box.controller');

router.post('/start', ctrl.start);
router.get('/requirements/:kit_id', ctrl.getRequirements);
router.get('/status', ctrl.getStatus);
router.post('/scan', ctrl.scan);
router.post('/remove-item', ctrl.removeItem);
router.post('/complete', ctrl.complete);

module.exports = router;
