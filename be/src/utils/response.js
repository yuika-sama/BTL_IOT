/**
 * Standardized API Response Helper
 * Provides consistent response format across all endpoints
 */
class ApiResponse {
  /**
   * Success response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {*} errors - Additional error details
   */
  static error(res, message = 'Error', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };
    
    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Paginated response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {Object} pagination - Pagination metadata
   * @param {string} message - Success message
   */
  static paginated(res, data, pagination, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        currentPage: pagination.page || pagination.currentPage,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems || pagination.total,
        itemsPerPage: pagination.limit || pagination.itemsPerPage,
        hasNext: (pagination.page || pagination.currentPage) < pagination.totalPages,
        hasPrev: (pagination.page || pagination.currentPage) > 1
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Created response (201)
   */
  static created(res, data, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  /**
   * No content response (204)
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Not found response (404)
   */
  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  /**
   * Bad request response (400)
   */
  static badRequest(res, message = 'Bad request', errors = null) {
    return this.error(res, message, 400, errors);
  }

  /**
   * Unauthorized response (401)
   */
  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, 401);
  }

  /**
   * Forbidden response (403)
   */
  static forbidden(res, message = 'Forbidden') {
    return this.error(res, message, 403);
  }

  /**
   * Service unavailable response (503)
   */
  static serviceUnavailable(res, message = 'Service unavailable') {
    return this.error(res, message, 503);
  }
}

module.exports = ApiResponse;
