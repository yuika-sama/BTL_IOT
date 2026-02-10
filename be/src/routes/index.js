const express = require('express');
const router = express.Router();

const deviceRoutes = require('./deviceRoutes');
const sensorRoutes = require('./sensorRoutes');
const dataSensorRoutes = require('./dataSensorRoutes');
const actionHistoryRoutes = require('./actionHistoryRoutes');
const alertRoutes = require('./alertRoutes');

// API Routes
router.use('/devices', deviceRoutes);
router.use('/sensors', sensorRoutes);
router.use('/data-sensors', dataSensorRoutes);
router.use('/action-history', actionHistoryRoutes);
router.use('/alerts', alertRoutes);

// API Info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'IoT Backend API',
    version: '1.0.0',
    endpoints: {
      devices: '/api/devices',
      sensors: '/api/sensors',
      dataSensors: '/api/data-sensors',
      actionHistory: '/api/action-history',
      alerts: '/api/alerts'
    }
  });
});

module.exports = router;
