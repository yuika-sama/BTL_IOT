const express = require('express');
const cors = require('cors');
const config = require('./config');
const apiRoutes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const Logger = require('./utils/logger');

const app = express();

// Middleware
app.use(cors({
  origin: config.app.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    Logger.http(req.method, req.path, res.statusCode, duration);
  });
  
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.app.nodeEnv
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'IoT Backend API Server',
    version: '1.0.0',
    environment: config.app.nodeEnv,
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

// API Routes
app.use('/api', apiRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling
app.use(errorHandler);

module.exports = app;
