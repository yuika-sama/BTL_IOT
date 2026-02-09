const express = require('express');
const router = express.Router();
const SensorController = require('../controllers/sensorController');

// Dashboard: Get latest values for 4 sensors (temperature, humidity, light, dust)
router.get('/latest', SensorController.getLatestValues);

module.exports = router;