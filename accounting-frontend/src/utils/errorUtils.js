// src/utils/errorUtils.js

/**
 * Extract user-friendly error message from API responses
 * Handles various error formats from backend
 * 
 * @param {Error|Object|string} error - The error object or string
 * @param {string} fallbackMessage - Default message if extraction fails
 * @returns {string} User-friendly error message
 */
export function extractErrorMessage(error, fallbackMessage = 'An error occurred. Please try again.') {
    if (!error) return fallbackMessage;

    // String error
    if (typeof error === 'string') {
        return error;
    }

    // Axios error with response
    if (error.response?.data) {
        const data = error.response.data;
        
        // Standard API error format: { success: false, error: { message, fields } }
        if (data.error?.message) {
            return data.error.message;
        }
        
        // Direct message in response
        if (data.message) {
            return data.message;
        }

        // Fields array with validation errors
        if (data.error?.fields && Array.isArray(data.error.fields)) {
            const fieldErrors = data.error.fields.map(f => f.message).filter(Boolean);
            if (fieldErrors.length > 0) {
                return fieldErrors[0];
            }
        }
    }

    // Error object with message
    if (error.message) {
        // Clean up common prefixes like "400 " or "500 "
        const msg = error.message.replace(/^\d{3}\s+/, '');
        return msg || fallbackMessage;
    }

    // Try to stringify if object
    if (typeof error === 'object') {
        try {
            const str = JSON.stringify(error);
            if (str && str !== '{}') {
                return str.substring(0, 200);
            }
        } catch {
            // Ignore stringify errors
        }
    }

    return fallbackMessage;
}

/**
 * Extract field-specific errors from API response
 * Useful for inline field validation display
 * 
 * @param {Error|Object} error - The error object
 * @returns {Object} Map of field names to error messages
 */
export function extractFieldErrors(error) {
    const fieldErrors = {};

    if (!error) return fieldErrors;

    // Axios error with field details
    if (error.response?.data?.error?.fields && Array.isArray(error.response.data.error.fields)) {
        error.response.data.error.fields.forEach(field => {
            if (field.field && field.message) {
                fieldErrors[field.field] = field.message;
            }
        });
    }

    return fieldErrors;
}

/**
 * Check if error is a validation error
 * 
 * @param {Error|Object} error - The error object
 * @returns {boolean}
 */
export function isValidationError(error) {
    if (!error) return false;
    
    const code = error.response?.data?.error?.code;
    return code === 'VALIDATION_ERROR' || error.response?.status === 400;
}

/**
 * Check if error is a duplicate entry error
 * 
 * @param {Error|Object} error - The error object
 * @returns {boolean}
 */
export function isDuplicateError(error) {
    if (!error) return false;
    
    const code = error.response?.data?.error?.code;
    return code === 'DUPLICATE_ENTRY' || code === 'DUPLICATE' || error.response?.status === 409;
}

/**
 * Check if error is an authentication error
 * 
 * @param {Error|Object} error - The error object
 * @returns {boolean}
 */
export function isAuthError(error) {
    if (!error) return false;
    return error.response?.status === 401 || error.response?.status === 403;
}

/**
 * Get appropriate error message based on error type
 * 
 * @param {Error|Object} error - The error object
 * @param {Object} options - Custom messages for different error types
 * @returns {string}
 */
export function getErrorMessage(error, options = {}) {
    const {
        validationMessage = 'Please check the form and correct any errors.',
        duplicateMessage = 'This record already exists.',
        authMessage = 'Please log in to continue.',
        serverMessage = 'Something went wrong. Please try again later.',
        networkMessage = 'Unable to connect. Please check your internet connection.',
    } = options;

    if (!error) return serverMessage;

    // Network error
    if (!error.response && error.request) {
        return networkMessage;
    }

    // Get specific message from API if available
    const apiMessage = extractErrorMessage(error, null);
    if (apiMessage) return apiMessage;

    // Fallback based on error type
    if (isValidationError(error)) return validationMessage;
    if (isDuplicateError(error)) return duplicateMessage;
    if (isAuthError(error)) return authMessage;

    return serverMessage;
}

export default {
    extractErrorMessage,
    extractFieldErrors,
    isValidationError,
    isDuplicateError,
    isAuthError,
    getErrorMessage
};
