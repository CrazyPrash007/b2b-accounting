// src/utils/ApiError.js

/**
 * Custom API Error class for consistent error handling
 * Extends the native Error class with additional properties for API responses
 *
 * @class ApiError
 * @extends Error
 *
 * @example
 * throw new ApiError(404, 'Staff not found', 'STAFF_NOT_FOUND');
 *
 * @example with details
 * throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', [
 *   { field: 'email', message: 'Invalid email format' }
 * ]);
 */
class ApiError extends Error {
  /**
   * Create an API Error
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {string} code - Error code for programmatic handling
   * @param {*} details - Optional additional error details
   */
  constructor(statusCode, message, code = 'ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Indicates this is an expected operational error

    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);

    // Set the name to the class name
    this.name = this.constructor.name;
  }
}

module.exports = ApiError;
