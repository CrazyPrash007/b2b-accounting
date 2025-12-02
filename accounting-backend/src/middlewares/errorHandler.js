// src/middlewares/errorHandler.js
module.exports = function (err, req, res, next) {
    console.error(err);

    // Joi validation
    if (err.isJoi) {
        return res.status(400).json({ success: false, error: { message: err.message, code: 'VALIDATION_ERROR' } });
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        return res.status(409).json({ success: false, error: { message: 'Duplicate entry', code: 'DUPLICATE' } });
    }

    const status = err.status || 500;
    return res.status(status).json({ success: false, error: { message: err.message || 'Server error' } });
};
