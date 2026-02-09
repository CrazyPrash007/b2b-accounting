// src/utils/asyncHandler.js

/**
 * Wrapper for async route handlers
 * Eliminates try-catch boilerplate and automatically forwards errors to error middleware
 *
 * @param {Function} fn - The async route handler function
 * @returns {Function} - Express middleware function
 *
 * @example
 * const asyncHandler = require('../utils/asyncHandler');
 *
 * exports.getAllStaff = asyncHandler(async (req, res) => {
 *   const staff = await Staff.find({});
 *   res.json({ success: true, data: staff });
 * });
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
