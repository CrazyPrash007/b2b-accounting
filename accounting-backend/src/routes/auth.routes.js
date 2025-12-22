// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { getChatStarterConnection } = require('../db/mongo');
const UserSchema = require('../models/UserSchema');

// Cache for User model
let UserModel = null;

function getUserModel() {
    if (!UserModel) {
        const chatStarterConn = getChatStarterConnection();
        // Check if model already exists on connection to avoid overwrite error
        UserModel = chatStarterConn.models.User || chatStarterConn.model('User', UserSchema);
    }
    return UserModel;
}

/**
 * GET /api/auth/me
 * Returns the authenticated user's info
 * Used by the frontend to validate auth and get user details
 */
router.get('/me', auth, async (req, res, next) => {
    try {
        const ownerId = req.user.ownerId;
        
        const User = getUserModel();
        
        const user = await User.findById(ownerId)
            .select('name email phone')
            .lean();
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }
        
        return res.json({
            success: true,
            data: {
                id: user._id,
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || ''
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/auth/validate
 * Simple endpoint to validate if the current token is valid
 * Returns 200 if valid, 401 if not
 */
router.get('/validate', auth, (req, res) => {
    return res.json({
        success: true,
        data: {
            valid: true,
            userId: req.user.ownerId
        }
    });
});

module.exports = router;
