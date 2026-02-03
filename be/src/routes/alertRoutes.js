const express = require('express');
const router = express.Router();
const AlertController = require('../controllers/alertController');

// Notification Page: Get all alerts with pagination, search, filters
router.get('/', AlertController.getAll);

// Get alert by ID
router.get('/:id', AlertController.getById);

// Get alerts by device ID
router.get('/device/:deviceId', AlertController.getByDeviceId);

// Get alerts by sensor ID
router.get('/sensor/:sensorId', AlertController.getBySensorId);

// Get alerts by severity
router.get('/severity/:severity', AlertController.getBySeverity);

// Get alerts by date range
router.get('/range/dates', AlertController.getByDateRange);

// Get statistics
router.get('/stats/summary', AlertController.getStatistics);

// Create new alert
router.post('/', AlertController.create);

// Delete alert
router.delete('/:id', AlertController.delete);

// Delete old alerts
router.delete('/cleanup/old', AlertController.deleteOldAlerts);

module.exports = router;
