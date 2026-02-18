const ApiResponse = require('../utils/response');
const Logger = require('../utils/logger');

/**
 * Custom Application Error
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Main Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error with context
  Logger.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return ApiResponse.badRequest(res, 'Validation error', errors);
  }

  // MySQL duplicate entry error
  if (err.code === 'ER_DUP_ENTRY') {
    return ApiResponse.error(res, 'Duplicate entry: Resource already exists', 409);
  }

  // MySQL foreign key constraint error
  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_NO_REFERENCED_ROW_2') {
    return ApiResponse.badRequest(res, 'Cannot perform operation: Foreign key constraint violation');
  }

  // MySQL connection error
  if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR') {
    return ApiResponse.error(res, 'Database connection error', 500);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, 'Invalid authentication token');
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, 'Authentication token expired');
  }

  // Cast error (invalid ID format)
  if (err.name === 'CastError') {
    return ApiResponse.badRequest(res, 'Invalid resource ID format');
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = err.isOperational ? err.message : 'Internal Server Error';

  // In production, don't leak error details
  const errorResponse = process.env.NODE_ENV === 'development' 
    ? { message, stack: err.stack }
    : { message };

  return ApiResponse.error(res, errorResponse.message, statusCode);
};

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
  ApiResponse.notFound(res, `Route ${req.method} ${req.originalUrl} not found`);
};

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler
};
