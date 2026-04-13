const express = require('express');
const actionHistoryController = require('../controllers/actionHistoryController');

const router = express.Router();

router.get('/', actionHistoryController.getAllActionHistory);
router.get('/stats', actionHistoryController.getDeviceActionStats);

module.exports = router;