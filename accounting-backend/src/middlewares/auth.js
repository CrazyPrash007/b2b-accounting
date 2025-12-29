// src/middlewares/auth.js
/**
 * Auth middleware that validates tokens from the main full-stack app.
 * 
 * Token format: "proto-token:<userId>" where userId is a valid MongoDB ObjectId
 * 
 * Accepts token via (in order of priority):
 * 1. Authorization header (e.g., "proto-token:64abc123...")
 * 2. x-owner-id header (legacy support)
 * 3. DEV_OWNER_ID env variable (development only)
 * 
 * Security Notes:
 * - This uses a simple token format for inter-service communication
 * - For production, consider implementing signed JWTs
 * - Token validity depends on the ObjectId existing in the chat-starter DB
 */
const mongoose = require('mongoose');

/**
 * Validate if a string is a valid MongoDB ObjectId
 */
function isValidObjectId(id) {
    if (!id || typeof id !== 'string') return false;
    return mongoose.isValidObjectId(id) && /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Extract userId from various token formats
 * Supports:
 * - "proto-token:<userId>"
 * - "Bearer proto-token:<userId>"
 * - Raw ObjectId (for x-owner-id header)
 */
function extractUserIdFromToken(token) {
    if (!token) return null;

    const tokenStr = String(token).trim();

    // Handle "proto-token:<userId>" format
    const protoMatch = tokenStr.match(/^proto-token:([0-9a-fA-F]{24})$/);
    if (protoMatch && isValidObjectId(protoMatch[1])) {
        return protoMatch[1];
    }

    // Handle "Bearer proto-token:<userId>" format
    if (tokenStr.startsWith('Bearer ')) {
        const bearerToken = tokenStr.slice(7).trim();
        const bearerMatch = bearerToken.match(/^proto-token:([0-9a-fA-F]{24})$/);
        if (bearerMatch && isValidObjectId(bearerMatch[1])) {
            return bearerMatch[1];
        }
    }

    // Handle raw ObjectId (for legacy x-owner-id header)
    if (isValidObjectId(tokenStr)) {
        return tokenStr;
    }

    return null;
}

/**
 * Auth middleware
 */
module.exports = function (req, res, next) {
    let ownerId = null;
    let authSource = null;

    // 1. Try Authorization header first (primary method)
    const authHeader = req.headers.authorization;
    if (authHeader) {
        ownerId = extractUserIdFromToken(authHeader);
        if (ownerId) authSource = 'authorization';
    }

    // 2. Fallback to x-owner-id header (legacy support)
    if (!ownerId) {
        const headerOwner = req.headers['x-owner-id'] || req.headers['x-ownerid'] || req.headers['x-owner'];
        if (headerOwner) {
            ownerId = extractUserIdFromToken(headerOwner);
            if (ownerId) authSource = 'x-owner-id';
        }
    }

    // 3. Fallback to DEV_OWNER_ID (development only)
    if (!ownerId && process.env.DEV_OWNER_ID && process.env.NODE_ENV !== 'production') {
        if (isValidObjectId(process.env.DEV_OWNER_ID)) {
            ownerId = process.env.DEV_OWNER_ID;
            authSource = 'dev-env';
            console.warn('[AUTH] Using DEV_OWNER_ID - do not use in production!');
        }
    }

    // No valid auth found
    if (!ownerId) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required. Please log in to continue.',
                code: 'AUTH_REQUIRED'
            },
        });
    }

    // Final validation of ownerId format
    if (!isValidObjectId(ownerId)) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Invalid authentication token format.',
                code: 'INVALID_TOKEN_FORMAT'
            },
        });
    }

    // Attach user object to request
    req.user = {
        ownerId,
        id: ownerId,
        authSource // For debugging
    };

    next();
};
