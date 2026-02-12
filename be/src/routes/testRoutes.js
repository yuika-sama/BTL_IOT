const express = require('express');
const router = express.Router();
const socketService = require('../services/socketService');

// Test endpoint để emit dữ liệu thử
router.post('/emit-test-data', (req, res) => {
    try {
        // Emit test sensor data
        socketService.broadcastSensorData({
            sensor_id: 'test-sensor-id',
            device_id: 'test-device-id',
            type: 'temperature',
            value: Math.random() * 30 + 20,
            unit: '°C',
            timestamp: new Date()
        });

        res.json({
            success: true,
            message: 'Test data emitted via socket'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Test endpoint để kiểm tra socket status
router.get('/socket-status', (req, res) => {
    try {
        const hasSocket = !!socketService.io;
        const connectedClients = hasSocket ? socketService.io.engine.clientsCount : 0;

        res.json({
            success: true,
            data: {
                socketInitialized: hasSocket,
                connectedClients: connectedClients,
                serverTime: new Date()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
