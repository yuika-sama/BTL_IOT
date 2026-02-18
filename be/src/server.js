require('dotenv').config();
const http = require('http');
const app = require('./app');
const config = require('./config');
const { socketService } = require('./services');
const Device = require('./models/deviceModel');
const Logger = require('./utils/logger');

const PORT = config.app.port;

const server = http.createServer(app);

// Initialize Socket.IO
socketService.initialize(server);

// Initialize devices as connected on server start
const initializeDevices = async () => {
  try {
    Logger.info('Initializing devices connection status...');
    await Device.setDevicesConnected(true);
    Logger.success('Devices initialized as connected');
  } catch (error) {
    Logger.error('Error initializing devices:', error);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  Logger.info('Shutting down gracefully...');
  
  try {
    // Set all devices as disconnected
    Logger.info('Updating devices to disconnected...');
    await Device.setAllDevicesDisconnected();
    Logger.success('Devices set to disconnected');
  } catch (error) {
    Logger.error('Error updating device status:', error);
  }

  server.close(() => {
    Logger.success('HTTP server closed');
    
    // Close database connections if needed
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    Logger.error('Forcing shutdown...');
    process.exit(1);
  }, 10000);
};

// Handle process events
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('unhandledRejection', (reason, promise) => {
  Logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  Logger.error('Uncaught Exception:', error);
  gracefulShutdown();
});

// Start server
server.listen(PORT, async () => {
  console.log('=================================');
  Logger.success('IoT Backend Server Started');
  console.log('=================================');
  Logger.info(`Server running on port ${PORT}`);
  Logger.info(`Environment: ${config.app.nodeEnv}`);
  Logger.info(`API: http://localhost:${PORT}/api`);
  Logger.info(`Socket.IO: http://localhost:${PORT}`);
  Logger.info(`Database: ${config.db.name}`);
  Logger.info(`MQTT Broker: ${config.mqtt.broker}`);
  console.log('=================================');
  
  // Initialize devices after server starts
  await initializeDevices();
});
