const express = require('express');
const router = express.Router();
const DeviceController = require('../controllers/deviceController');

// Get all devices with pagination, search, filters
router.get('/', DeviceController.getAll);

// Dashboard: Get all devices info
router.get('/info', DeviceController.getAllDevicesInfo);

// Get device by ID
router.get('/:id', DeviceController.getById);

// Get device with sensors
router.get('/:id/sensors', DeviceController.getWithSensors);

// Create new device
router.post('/', DeviceController.create);

// Update device
router.put('/:id', DeviceController.update);

// Dashboard: Toggle device status (ON/OFF)
router.patch('/:id/toggle', DeviceController.toggleStatus);

// Update connection status
router.patch('/:id/connection', DeviceController.updateConnection);

// Delete device
router.delete('/:id', DeviceController.delete);

module.exports = router;
