// src/middlewares/auth.js
/**
 * Dev-friendly auth middleware:
 * - If header 'x-owner-id' present, treat it as the ownerId (Mongo ObjectId string)
 * - Else if process.env.DEV_OWNER_ID is set, use it
 * - Else respond 401 with instructions
 *
 * When main app integration happens, the main app should pass x-owner-id header
 * (or you can replace this middleware with proper JWT validation).
 */
module.exports = function (req, res, next) {
    const headerOwner = req.headers['x-owner-id'] || req.headers['x-ownerid'] || req.headers['x-owner'];
    const ownerId = headerOwner || process.env.DEV_OWNER_ID;

    if (!ownerId) {
        return res.status(401).json({
            success: false,
            error: {
                message:
                    "Missing owner id. For development, set DEV_OWNER_ID in .env or pass 'x-owner-id' header containing the user's Mongo ObjectId.",
            },
        });
    }

    // attach a minimal user object to req
    req.user = {
        ownerId,
        // createdBy/actor for audit can default to ownerId for now
        id: ownerId,
    };

    next();
};
