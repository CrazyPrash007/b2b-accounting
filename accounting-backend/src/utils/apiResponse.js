// src/utils/apiResponse.js

/**
 * Standardized API response helpers
 * Ensures consistent response format across all endpoints
 */

/**
 * Send a standardized success response
 *
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {Object} meta - Optional metadata (pagination, etc.)
 * @returns {Object} Express response
 *
 * @example
 * return successResponse(res, staff, 'Staff fetched successfully', 200, { pagination });
 */
const successResponse = (res, data, message = null, statusCode = 200, meta = null) => {
  const response = {
    success: true,
    ...(message && { message }),
    data,
    ...(meta && { meta })
  };

  return res.status(statusCode).json(response);
};

/**
 * Send a standardized error response
 *
 * @param {Object} res - Express response object
 * @param {Error|Object} error - Error object or custom error details
 * @param {number} statusCode - HTTP status code (default: 500)
 * @returns {Object} Express response
 *
 * @example
 * return errorResponse(res, new Error('Something went wrong'), 500);
 */
const errorResponse = (res, error, statusCode = 500) => {
  const response = {
    success: false,
    error: {
      message: error.message || 'An unexpected error occurred. Please try again.',
      code: error.code || 'SERVER_ERROR',
      ...(error.details && { details: error.details })
    }
  };

  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse
};
