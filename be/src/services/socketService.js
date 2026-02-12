class SocketService {
  constructor() {
    this.io = null;
  }

  initialize(server) {
    const socketIO = require('socket.io');
    
    this.io = socketIO(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
      },
      transports: ['websocket'],
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6,
      allowEIO3: true,
      serveClient: false,
      path: '/socket.io/'
    });

    this.io.on('connection', (socket) => {
      console.log('✅ Client connected:', socket.id);

      // Join room cho specific device nếu cần
      socket.on('join_device', (deviceId) => {
        socket.join(`device_${deviceId}`);
        console.log(`📱 Socket ${socket.id} joined device room: ${deviceId}`);
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Client disconnected:', socket.id, 'Reason:', reason);
      });

      socket.on('error', (error) => {
        console.error('🔴 Socket error:', socket.id, error);
      });
    });

    this.io.on('error', (error) => {
      console.error('🔴 Socket.IO error:', error);
    });

    console.log('✅ Socket.IO initialized');
    console.log('🔌 Allowed origins:', process.env.CLIENT_URL || 'http://localhost:5173');
  }

  /**
   * Broadcast sensor data
   * Format: { sensor_id, device_id, type, value, unit, timestamp }
   */
  broadcastSensorData(data) {
    if (this.io) {
      this.io.emit('sensor_data', {
        sensor_id: data.sensor_id,
        device_id: data.device_id,
        type: data.type,
        value: data.value,
        unit: data.unit,
        timestamp: data.timestamp || new Date()
      });
      console.log('📤 Broadcast sensor data:', data.type, data.value);
    }
  }

  /**
   * Broadcast alert
   */
  broadcastAlert(alert) {
    if (this.io) {
      this.io.emit('alert', alert);
      console.log('🚨 Broadcast alert:', alert.message);
    }
  }

  /**
   * Broadcast device status change
   * Format: { device_id, status, timestamp }
   */
  broadcastDeviceStatus(status) {
    if (this.io) {
      this.io.emit('device_status', {
        device_id: status.device_id,
        status: status.status,
        timestamp: status.timestamp || new Date()
      });
      
      // Emit to specific device room
      this.io.to(`device_${status.device_id}`).emit('device_update', status);
      
      console.log('📡 Broadcast device status:', status.device_id, status.status);
    }
  }

  /**
   * Emit to specific device
   */
  emitToDevice(deviceId, event, data) {
    if (this.io) {
      this.io.to(`device_${deviceId}`).emit(event, data);
    }
  }
}

// Export instance (singleton)
module.exports = new SocketService();