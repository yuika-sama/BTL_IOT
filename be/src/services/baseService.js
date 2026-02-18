/**
 * Base Service
 * Provides common database operations for all services
 */
const Logger = require('../utils/logger');

class BaseService {
  constructor(model) {
    this.model = model;
  }

  /**
   * Find record by ID
   */
  async findById(id, options = {}) {
    const record = await this.model.getById(id);
    
    if (!record) {
      throw this.notFoundError(`${this.model.name || 'Record'} not found`);
    }
    
    return record;
  }

  /**
   * Find all records
   */
  async findAll(options = {}) {
    return await this.model.getAll(options);
  }

  /**
   * Create new record
   */
  async create(data) {
    return await this.model.create(data);
  }

  /**
   * Update record by ID
   */
  async update(id, data) {
    const record = await this.findById(id);
    return await this.model.update(id, data);
  }

  /**
   * Delete record by ID
   */
  async delete(id) {
    const record = await this.findById(id);
    await this.model.delete(id);
    return true;
  }

  /**
   * Build pagination query object
   */
  buildPaginationQuery(page, limit) {
    return {
      offset: (page - 1) * limit,
      limit: limit
    };
  }

  /**
   * Build sort query
   */
  buildSortQuery(sortBy, sortOrder) {
    return {
      orderBy: sortBy,
      orderDirection: sortOrder.toUpperCase()
    };
  }

  /**
   * Create a not found error
   */
  notFoundError(message = 'Resource not found') {
    const error = new Error(message);
    error.statusCode = 404;
    return error;
  }

  /**
   * Create a validation error
   */
  validationError(message = 'Validation failed') {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
  }

  /**
   * Create a conflict error
   */
  conflictError(message = 'Resource conflict') {
    const error = new Error(message);
    error.statusCode = 409;
    return error;
  }

  /**
   * Create a service unavailable error
   */
  serviceUnavailableError(message = 'Service unavailable') {
    const error = new Error(message);
    error.statusCode = 503;
    return error;
  }
}

module.exports = BaseService;
