const express = require('express');
const router = express.Router();
const DataSensorController = require('../controllers/dataSensorController');

// Data Sensor Page: Get history of 4 sensor types with pagination, search, filters
router.get('/history', DataSensorController.getSensorHistory);

// Get aggregate data for charts (nếu cần hiển thị biểu đồ)
router.get('/aggregate/:sensorId', DataSensorController.getAggregateData);

module.exports = router;