/**
 * Validation Middleware
 * Simple validation helpers for common request parameters
 */

const ApiResponse = require('../utils/response');

class Validator {
  /**
   * Validate UUID parameter
   */
  static validateUUID(paramName = 'id') {
    return (req, res, next) => {
      const value = req.params[paramName];
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!value || !uuidRegex.test(value)) {
        return ApiResponse.badRequest(res, `Invalid ${paramName}: must be a valid UUID`);
      }
      
      next();
    };
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(req, res, next) {
    const { page, limit } = req.query;
    
    if (page && (isNaN(page) || parseInt(page) < 1)) {
      return ApiResponse.badRequest(res, 'Page must be a positive integer');
    }
    
    if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
      return ApiResponse.badRequest(res, 'Limit must be between 1 and 100');
    }
    
    next();
  }

  /**
   * Validate sort order
   */
  static validateSortOrder(req, res, next) {
    const { sortOrder } = req.query;
    
    if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
      return ApiResponse.badRequest(res, 'Sort order must be "asc" or "desc"');
    }
    
    next();
  }

  /**
   * Validate date range
   */
  static validateDateRange(req, res, next) {
    const { startDate, endDate } = req.query;
    
    if (startDate && isNaN(Date.parse(startDate))) {
      return ApiResponse.badRequest(res, 'Invalid start date format');
    }
    
    if (endDate && isNaN(Date.parse(endDate))) {
      return ApiResponse.badRequest(res, 'Invalid end date format');
    }
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return ApiResponse.badRequest(res, 'Start date must be before end date');
    }
    
    next();
  }

  /**
   * Validate sensor type
   */
  static validateSensorType(req, res, next) {
    const { sensorType } = req.query;
    const validTypes = ['temperature', 'humidity', 'light', 'dust'];
    
    if (sensorType && !validTypes.includes(sensorType.toLowerCase())) {
      return ApiResponse.badRequest(res, `Invalid sensor type. Must be one of: ${validTypes.join(', ')}`);
    }
    
    next();
  }

  /**
   * Validate interval
   */
  static validateInterval(req, res, next) {
    const { interval } = req.query;
    const validIntervals = ['minute', 'hour', 'day', 'week', 'month'];
    
    if (interval && !validIntervals.includes(interval.toLowerCase())) {
      return ApiResponse.badRequest(res, `Invalid interval. Must be one of: ${validIntervals.join(', ')}`);
    }
    
    next();
  }

  /**
   * Combine multiple validators
   */
  static combine(...validators) {
    return (req, res, next) => {
      const runValidator = (index) => {
        if (index >= validators.length) {
          return next();
        }
        
        validators[index](req, res, (err) => {
          if (err) return next(err);
          runValidator(index + 1);
        });
      };
      
      runValidator(0);
    };
  }
}

module.exports = Validator;
