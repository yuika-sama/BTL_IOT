const express = require('express');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.get('/devices', dashboardController.getDeviceList);
router.get('/sensors/initial', dashboardController.getInitialSensorData);
router.get('/sensors/latest', dashboardController.getLatestSensorValues);

module.exports = router;
