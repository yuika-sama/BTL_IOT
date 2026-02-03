const express = require('express');
const router = express.Router();
const SensorController = require('../controllers/sensorController');

// Get all sensors with pagination, search, filters
router.get('/', SensorController.getAll);

// Dashboard: Get latest values for 4 sensors (temperature, humidity, light, dust)
router.get('/latest', SensorController.getLatestValues);

// Get sensor by ID
router.get('/:id', SensorController.getById);

// Get sensors by device ID
router.get('/device/:deviceId', SensorController.getByDeviceId);

// Create new sensor
router.post('/', SensorController.create);

// Update sensor
router.put('/:id', SensorController.update);

// Delete sensor
router.delete('/:id', SensorController.delete);

module.exports = router;
