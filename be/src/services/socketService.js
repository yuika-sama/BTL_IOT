class SocketService {
  constructor() {
    this.io = null;
  }

  initialize(server) {
    const socketIO = require('socket.io');
    
    this.io = socketIO(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.io.on('connection', (socket) => {
      console.log('✅ Client connected:', socket.id);

      socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
      });
    });

    console.log('✅ Socket.IO initialized');
  }

  broadcastSensorData(data) {
    if (this.io) {
      this.io.emit('sensor_data', data);
      console.log('📤 Broadcast sensor data to clients');
    }
  }

  broadcastAlert(alert) {
    if (this.io) {
      this.io.emit('alert', alert);
      console.log('🚨 Broadcast alert to clients');
    }
  }

  broadcastDeviceStatus(status) {
    if (this.io) {
      this.io.emit('device_status', status);
      console.log('📡 Broadcast device status to clients');
    }
  }
}

// Export instance (singleton)
module.exports = new SocketService();