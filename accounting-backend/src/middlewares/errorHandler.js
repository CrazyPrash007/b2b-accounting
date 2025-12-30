// src/middlewares/errorHandler.js

/**
 * Extract user-friendly error message from Joi validation errors
 */
function extractJoiMessage(err) {
    if (err.details && Array.isArray(err.details) && err.details.length > 0) {
        // Return the first validation error message
        const firstError = err.details[0];
        return firstError.message || err.message;
    }
    return err.message;
}

/**
 * Extract field name from Joi error for better UX
 */
function extractJoiFields(err) {
    if (err.details && Array.isArray(err.details)) {
        return err.details.map(detail => ({
            field: detail.path ? detail.path.join('.') : 'unknown',
            message: detail.message,
            type: detail.type
        }));
    }
    return [];
}

/**
 * Get user-friendly message for MongoDB duplicate key errors
 */
function extractDuplicateKeyMessage(err) {
    if (err.keyValue) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        const fieldName = field.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
        return `A record with this ${fieldName} "${value}" already exists`;
    }
    return 'This record already exists. Please use a different value.';
}

module.exports = function (err, req, res, next) {
    console.error('[ErrorHandler]', err.message || err);

    // Joi validation errors
    if (err.isJoi) {
        const message = extractJoiMessage(err);
        const fields = extractJoiFields(err);
        return res.status(400).json({ 
            success: false, 
            error: { 
                message, 
                code: 'VALIDATION_ERROR',
                fields: fields.length > 0 ? fields : undefined
            } 
        });
    }

    // Mongoose validation errors
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors || {}).map(e => e.message);
        const message = messages.length > 0 ? messages[0] : 'Validation failed';
        return res.status(400).json({ 
            success: false, 
            error: { 
                message, 
                code: 'VALIDATION_ERROR',
                details: messages
            } 
        });
    }

    // Mongoose CastError (invalid ObjectId, etc.)
    if (err.name === 'CastError') {
        const fieldName = err.path ? err.path.replace(/([A-Z])/g, ' $1').toLowerCase().trim() : 'field';
        return res.status(400).json({ 
            success: false, 
            error: { 
                message: `Invalid ${fieldName} format`,
                code: 'CAST_ERROR'
            } 
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const message = extractDuplicateKeyMessage(err);
        return res.status(409).json({ 
            success: false, 
            error: { 
                message, 
                code: 'DUPLICATE_ENTRY'
            } 
        });
    }

    // Custom application errors with status
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'An unexpected error occurred. Please try again.';
    
    return res.status(status).json({ 
        success: false, 
        error: { 
            message,
            code: err.code || 'SERVER_ERROR'
        } 
    });
};
