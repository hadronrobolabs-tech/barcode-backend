const router = require('express').Router();
const ctrl = require('./barcode.controller');

router.get('/', ctrl.getAll);
router.post('/generate', ctrl.generate);
router.post('/download/pdf', ctrl.downloadPdf);
router.post('/preview', ctrl.preview); // Preview barcode without saving
router.post('/preview-scan', ctrl.previewScan); // Preview scan for component scan screen
router.post('/scan', ctrl.scan);
router.post('/unscan', ctrl.unscan); // Unscan a barcode (reset status from SCANNED to CREATED)
router.get('/scanned-not-boxed', ctrl.getScannedNotBoxed); // Get scanned barcodes not boxed
router.get('/export-scanned-not-boxed', ctrl.exportScannedNotBoxed); // Export to CSV
router.post('/lookup-box-code', ctrl.lookupBarcodesForBoxCode); // Lookup barcodes and get box code PDF

module.exports = router;
