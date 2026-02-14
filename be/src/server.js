require('dotenv').config();
const http = require('http');
const app = require('./app');
const { socketService } = require('./services');
const Device = require('./models/deviceModel');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Initialize Socket.IO
socketService.initialize(server);

// Start scheduled data cleanup (optional)
// dataCleanupService.startScheduledCleanup();

// Initialize devices as connected on server start
const initializeDevices = async () => {
  try {
    console.log('🔌 Initializing devices connection status...');
    await Device.setDevicesConnected(true);
    console.log('✅ Devices initialized as connected');
  } catch (error) {
    console.error('❌ Error initializing devices:', error);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n👋 Shutting down gracefully...');
  
  try {
    // Set all devices as disconnected
    console.log('📡 Updating devices to disconnected...');
    await Device.setAllDevicesDisconnected();
    console.log('✅ Devices set to disconnected');
  } catch (error) {
    console.error('❌ Error updating device status:', error);
  }

  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close database connections if needed
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown...');
    process.exit(1);
  }, 10000);
};

// Handle process events
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown();
});

// Start server
server.listen(PORT, async () => {
  console.log('=================================');
  console.log('🚀 IoT Backend Server Started');
  console.log('=================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.IO: http://localhost:${PORT}`);
  console.log(`💾 Database: ${process.env.DB_NAME}`);
  console.log(`📨 MQTT Broker: ${process.env.MQTT_BROKER}`);
  console.log('=================================');
  
  // Initialize devices after server starts
  await initializeDevices();
});
