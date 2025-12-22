// src/middlewares/auth.js
/**
 * Auth middleware that validates tokens from the main full-stack app.
 * 
 * Token format: "proto-token:<userId>" where userId is a valid MongoDB ObjectId
 * 
 * Accepts token via:
 * 1. Authorization header (e.g., "proto-token:64abc123...")
 * 2. x-owner-id header (legacy support)
 * 3. DEV_OWNER_ID env variable (development only)
 */
const mongoose = require('mongoose');

function isValidObjectId(id) {
    return id && mongoose.isValidObjectId(id);
}

function extractUserIdFromToken(token) {
    if (!token) return null;
    
    // Handle "proto-token:<userId>" format
    const match = String(token).match(/^proto-token:([0-9a-fA-F]{24})$/);
    if (match && isValidObjectId(match[1])) {
        return match[1];
    }
    
    // Handle Bearer token format (if we ever switch to JWT)
    if (token.startsWith('Bearer ')) {
        const bearerToken = token.slice(7);
        // For now, treat it as proto-token format
        const bearerMatch = bearerToken.match(/^proto-token:([0-9a-fA-F]{24})$/);
        if (bearerMatch && isValidObjectId(bearerMatch[1])) {
            return bearerMatch[1];
        }
    }
    
    return null;
}

module.exports = function (req, res, next) {
    // 1. Try Authorization header first (primary method)
    const authHeader = req.headers.authorization;
    let ownerId = extractUserIdFromToken(authHeader);
    
    // 2. Fallback to x-owner-id header (legacy support)
    if (!ownerId) {
        const headerOwner = req.headers['x-owner-id'] || req.headers['x-ownerid'] || req.headers['x-owner'];
        if (headerOwner && isValidObjectId(headerOwner)) {
            ownerId = headerOwner;
        }
    }
    
    // 3. Fallback to DEV_OWNER_ID (development only)
    if (!ownerId && process.env.DEV_OWNER_ID) {
        if (isValidObjectId(process.env.DEV_OWNER_ID)) {
            ownerId = process.env.DEV_OWNER_ID;
        }
    }

    if (!ownerId) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required. Please log in to continue.',
                code: 'AUTH_REQUIRED'
            },
        });
    }

    // Validate that ownerId is a proper ObjectId
    if (!isValidObjectId(ownerId)) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Invalid authentication token.',
                code: 'INVALID_TOKEN'
            },
        });
    }

    // Attach user object to request
    req.user = {
        ownerId,
        id: ownerId,
    };

    next();
};
