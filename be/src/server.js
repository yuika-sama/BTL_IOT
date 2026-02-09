require('dotenv').config();
const http = require('http');
const app = require('./app');
const { socketService, mqttService } = require('./services');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Initialize Socket.IO
socketService.initialize(server);

// Initialize MQTT Service
mqttService.initialize();

// Start scheduled data cleanup (optional)
// dataCleanupService.startScheduledCleanup();

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('\n👋 Shutting down gracefully...');
  
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
server.listen(PORT, () => {
  console.log('=================================');
  console.log('🚀 IoT Backend Server Started');
  console.log('=================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.IO: http://localhost:${PORT}`);
  console.log(`💾 Database: ${process.env.DB_NAME}`);
  console.log(`📨 MQTT Broker: ${process.env.MQTT_BROKER}`);
  console.log('=================================');
});
