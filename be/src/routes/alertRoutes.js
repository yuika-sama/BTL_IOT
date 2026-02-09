const express = require('express');
const router = express.Router();
const AlertController = require('../controllers/alertController');

// Notification Page: Get all alerts with pagination, search, filters
router.get('/', AlertController.getAll);

// Get statistics (nếu cần hiển thị thống kê)
router.get('/statistics', AlertController.getStatistics);

module.exports = router;