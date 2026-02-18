/**
 * Base Controller
 * Provides common functionality for all controllers
 */
const ApiResponse = require('../utils/response');
const Logger = require('../utils/logger');

class BaseController {
  constructor(service) {
    this.service = service;
  }

  /**
   * Handle service requests with automatic error handling
   */
  async handleRequest(req, res, serviceMethod, ...args) {
    try {
      const result = await serviceMethod.call(this.service, ...args);
      
      // Check if result has pagination
      if (result && result.pagination) {
        return ApiResponse.paginated(res, result.data, result.pagination);
      }
      
      // Standard success response
      return ApiResponse.success(res, result);
    } catch (error) {
      Logger.error(`Error in ${serviceMethod.name}:`, error.message);
      
      // Handle different error types
      if (error.statusCode === 404) {
        return ApiResponse.notFound(res, error.message);
      }
      
      if (error.statusCode === 400) {
        return ApiResponse.badRequest(res, error.message);
      }
      
      if (error.statusCode === 503) {
        return ApiResponse.serviceUnavailable(res, error.message);
      }
      
      return ApiResponse.error(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Extract pagination parameters from request
   */
  getPaginationParams(req) {
    return {
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 10, 100),
      sortBy: req.query.sortBy || req.query.orderBy || 'created_at',
      sortOrder: (req.query.sortOrder || req.query.orderDirection || 'desc').toLowerCase()
    };
  }

  /**
   * Extract filter parameters from request
   */
  getFilterParams(req) {
    const filters = {};
    const allowedFilters = this.getAllowedFilters();
    
    allowedFilters.forEach(filter => {
      if (req.query[filter] !== undefined && req.query[filter] !== '') {
        filters[filter] = req.query[filter];
      }
    });
    
    return filters;
  }

  /**
   * Extract date range parameters from request
   */
  getDateRangeParams(req) {
    const dateRange = {};
    
    if (req.query.startDate) {
      dateRange.startDate = new Date(req.query.startDate);
    }
    
    if (req.query.endDate) {
      dateRange.endDate = new Date(req.query.endDate);
    }
    
    return dateRange;
  }

  /**
   * Override this method in child controllers to specify allowed filters
   */
  getAllowedFilters() {
    return [];
  }
}

module.exports = BaseController;
