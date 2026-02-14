const express = require('express');
const router = express.Router();
const DeviceController = require('../controllers/deviceController');

// Dashboard: Get all devices info
router.get('/info', DeviceController.getAllDevicesInfo);

// Dashboard: Toggle device status (ON/OFF) - Manual mode (disables auto_toggle)
router.patch('/:id/toggle', DeviceController.toggleStatus);

// Dashboard: Toggle auto_toggle mode (AUTO/MANUAL)
router.patch('/:id/auto-toggle', DeviceController.toggleAutoMode);

module.exports = router;