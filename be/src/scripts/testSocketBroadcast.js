/**
 * Script test để broadcast sensor data và device status qua Socket.IO
 * Sử dụng script này để test dashboard realtime
 */

const socketService = require('../services/socketService');
const http = require('http');

// Tạo mock server
const server = http.createServer();
socketService.initialize(server);

const PORT = 5000;

server.listen(PORT, () => {
  console.log(`🚀 Test Socket Server running on port ${PORT}`);
  console.log('📡 Socket.IO ready to broadcast\n');

  // Broadcast sensor data mỗi 3 giây
  setInterval(() => {
    // Temperature
    const tempData = {
      sensor_id: 'temp-001',
      device_id: 1,
      type: 'temperature',
      value: (20 + Math.random() * 10).toFixed(1),
      unit: '°C',
      timestamp: new Date()
    };
    socketService.broadcastSensorData(tempData);

    // Humidity
    const humiData = {
      sensor_id: 'humi-001',
      device_id: 2,
      type: 'humidity',
      value: (40 + Math.random() * 40).toFixed(1),
      unit: '%',
      timestamp: new Date()
    };
    socketService.broadcastSensorData(humiData);

    // Light
    const lightData = {
      sensor_id: 'light-001',
      device_id: 3,
      type: 'light',
      value: Math.floor(Math.random() * 700),
      unit: 'lux',
      timestamp: new Date()
    };
    socketService.broadcastSensorData(lightData);

    // Dust
    const dustData = {
      sensor_id: 'dust-001',
      device_id: 4,
      type: 'dust',
      value: Math.floor(Math.random() * 100),
      unit: 'PM2.5',
      timestamp: new Date()
    };
    socketService.broadcastSensorData(dustData);

  }, 3000);

  // Broadcast device status mỗi 10 giây
  setInterval(() => {
    const devices = [1, 2, 3, 4];
    const randomDevice = devices[Math.floor(Math.random() * devices.length)];
    const randomStatus = Math.random() > 0.5 ? 1 : 0;

    const statusData = {
      device_id: randomDevice,
      status: randomStatus,
      timestamp: new Date()
    };
    
    socketService.broadcastDeviceStatus(statusData);
    console.log(`📡 Device ${randomDevice} status changed to ${randomStatus === 1 ? 'ON' : 'OFF'}`);
  }, 10000);

  // Broadcast alert ngẫu nhiên mỗi 15 giây
  setInterval(() => {
    const alerts = [
      { message: 'Temperature too high!', level: 'warning' },
      { message: 'Humidity critical!', level: 'danger' },
      { message: 'Light intensity low', level: 'info' }
    ];
    
    const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
    socketService.broadcastAlert({
      ...randomAlert,
      timestamp: new Date(),
      device_id: Math.floor(Math.random() * 4) + 1
    });
  }, 15000);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping test server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
