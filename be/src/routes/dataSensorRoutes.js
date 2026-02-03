const express = require('express');
const router = express.Router();
const DataSensorController = require('../controllers/dataSensorController');

// Get all sensor data with pagination, search, filters
router.get('/', DataSensorController.getAll);

// Data Sensor Page: Get history of 4 sensor types
router.get('/history', DataSensorController.getSensorHistory);

// Get sensor data by ID
router.get('/:id', DataSensorController.getById);

// Get sensor data by sensor ID
router.get('/sensor/:sensorId', DataSensorController.getBySensorId);

// Get latest sensor data by sensor ID
router.get('/sensor/:sensorId/latest', DataSensorController.getLatest);

// Get aggregate data (hourly, daily, monthly)
router.get('/sensor/:sensorId/aggregate', DataSensorController.getAggregateData);

// Get statistics
router.get('/sensor/:sensorId/statistics', DataSensorController.getStatistics);

// Create new sensor data
router.post('/', DataSensorController.create);

// Delete sensor data
router.delete('/:id', DataSensorController.delete);

// Delete old data
router.delete('/cleanup/old', DataSensorController.deleteOldData);

module.exports = router;
