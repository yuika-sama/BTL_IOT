const express = require('express');
const router = express.Router();
const DeviceController = require('../controllers/deviceController');

// Dashboard: Get all devices info
router.get('/info', DeviceController.getAllDevicesInfo);

// Dashboard: Toggle device status (ON/OFF)
router.patch('/:id/toggle', DeviceController.toggleStatus);

module.exports = router;