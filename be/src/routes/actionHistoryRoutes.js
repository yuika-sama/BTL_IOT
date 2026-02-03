const express = require('express');
const router = express.Router();
const ActionHistoryController = require('../controllers/actionHistoryController');

// Action History Page: Get all action history with pagination, search, filters
router.get('/', ActionHistoryController.getAll);

// Get action history by ID
router.get('/:id', ActionHistoryController.getById);

// Get action history by device ID
router.get('/device/:deviceId', ActionHistoryController.getByDeviceId);

// Get action history by executor
router.get('/executor/:executor', ActionHistoryController.getByExecutor);

// Get action history by status
router.get('/status/:status', ActionHistoryController.getByStatus);

// Get action history by date range
router.get('/range/dates', ActionHistoryController.getByDateRange);

// Get statistics
router.get('/stats/summary', ActionHistoryController.getStatistics);

// Create action history
router.post('/', ActionHistoryController.create);

// Update action status
router.patch('/:id/status', ActionHistoryController.updateStatus);

// Delete action history
router.delete('/:id', ActionHistoryController.delete);

// Delete old actions
router.delete('/cleanup/old', ActionHistoryController.deleteOldActions);

module.exports = router;
