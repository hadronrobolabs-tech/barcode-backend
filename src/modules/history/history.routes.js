const express = require('express');
const router = express.Router();
const historyController = require('./history.controller');

router.get('/', historyController.getHistory);
router.get('/statistics', historyController.getStatistics);
router.get('/stats', historyController.getStats);
router.get('/barcode/:barcode_id', historyController.getBarcodeHistory);

module.exports = router;

