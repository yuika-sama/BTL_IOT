const express = require('express');
const router = express.Router();
const ActionHistoryController = require('../controllers/actionHistoryController');

// Action History Page: Get all action history with pagination, search, filters
router.get('/', ActionHistoryController.getAll);

// Get statistics (nếu cần hiển thị thống kê)
router.get('/statistics', ActionHistoryController.getStatistics);


module.exports = router;