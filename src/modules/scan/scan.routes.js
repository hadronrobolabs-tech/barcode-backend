const router = require('express').Router();
const ctrl = require('./scan.controller');

router.post('/', ctrl.scan);

module.exports = router;
