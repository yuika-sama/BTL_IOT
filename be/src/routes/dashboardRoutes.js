const express = require('express');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.get('/devices', dashboardController.getDeviceList);
router.get('/sensors/initial', dashboardController.getInitialSensorData);
router.get('/sensors/latest', dashboardController.getLatestSensorValues);
router.post('/devices/:id/toggle', dashboardController.toggleDevice);
router.post('/devices/:id/toggle-auto', dashboardController.toggleAutoMode);

module.exports = router;
