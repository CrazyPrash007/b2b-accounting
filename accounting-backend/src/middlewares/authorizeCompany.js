// src/middlewares/authorizeCompany.js

/**
 * Middleware to verify accountCompanyName is provided
 * In future, can add ownership verification if needed
 */
module.exports = async (req, res, next) => {
  try {
    const requestedCompany = req.body.accountCompanyName || req.query.accountCompanyName;

    if (!requestedCompany) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'accountCompanyName is required',
          code: 'MISSING_COMPANY'
        }
      });
    }

    // For now, just pass through
    // TODO: Add proper company ownership verification when Company model is standardized
    next();
  } catch (error) {
    console.error('[authorizeCompany] Error:', error);
    next(error);
  }
};
