// src/controllers/ad.controller.js
const { Ad, BUSINESS_CATEGORIES, AD_POSITIONS, AD_DIMENSIONS, INDIAN_STATES } = require('../models/Ad');

// Get targeting options (for form dropdowns)
exports.getTargetingOptions = async (req, res, next) => {
    try {
        res.json({
            success: true,
            data: {
                categories: BUSINESS_CATEGORIES,
                positions: AD_POSITIONS,
                dimensions: AD_DIMENSIONS,
                states: INDIAN_STATES
            }
        });
    } catch (err) {
        next(err);
    }
};

// Create a new ad (user submission - status will be 'pending')
exports.create = async (req, res, next) => {
    try {
        const userId = req.userId;
        const {
            title,
            description,
            imageUrl,
            linkUrl,
            linkTarget,
            position,
            placement,
            startDate,
            endDate,
            targetCategories,
            targetStates,
            companyId,
            companyName,
            ownerName,
            contactEmail,
            contactPhone
        } = req.body;

        // Validate required fields
        if (!title || !imageUrl || !position || !companyId) {
            return res.status(400).json({
                success: false,
                message: 'Title, image URL, position, and company are required'
            });
        }

        // Validate position
        if (!AD_POSITIONS.includes(position)) {
            return res.status(400).json({
                success: false,
                message: `Invalid position. Must be one of: ${AD_POSITIONS.join(', ')}`
            });
        }

        const ad = new Ad({
            title,
            description,
            imageUrl,
            linkUrl,
            linkTarget: linkTarget || '_blank',
            position,
            placement: placement || 'chat',
            startDate: startDate || null,
            endDate: endDate || null,
            targetCategories: targetCategories || [],
            targetStates: targetStates || [],
            status: 'pending', // Always pending for user submissions
            ownerId: userId,
            companyId,
            companyName,
            ownerName,
            contactEmail,
            contactPhone
        });

        await ad.save();

        res.status(201).json({
            success: true,
            message: 'Ad submitted successfully. It will be reviewed by admin.',
            data: ad
        });
    } catch (err) {
        next(err);
    }
};

// List user's own ads
exports.listMyAds = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { status, page = 1, limit = 20 } = req.query;

        const filter = {
            ownerId: userId,
            isDeleted: false
        };

        if (status) {
            filter.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [ads, total] = await Promise.all([
            Ad.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Ad.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: ads,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        next(err);
    }
};

// Get single ad
exports.getOne = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        const ad = await Ad.findOne({
            _id: id,
            ownerId: userId,
            isDeleted: false
        }).lean();

        if (!ad) {
            return res.status(404).json({
                success: false,
                message: 'Ad not found'
            });
        }

        res.json({
            success: true,
            data: ad
        });
    } catch (err) {
        next(err);
    }
};

// Update ad (only if pending)
exports.update = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const updates = req.body;

        const ad = await Ad.findOne({
            _id: id,
            ownerId: userId,
            isDeleted: false
        });

        if (!ad) {
            return res.status(404).json({
                success: false,
                message: 'Ad not found'
            });
        }

        // Only allow updates if status is pending or rejected
        if (ad.status !== 'pending' && ad.status !== 'rejected') {
            return res.status(400).json({
                success: false,
                message: 'Can only edit ads that are pending or rejected'
            });
        }

        // Allowed fields to update
        const allowedFields = [
            'title', 'description', 'imageUrl', 'linkUrl', 'linkTarget',
            'position', 'placement', 'startDate', 'endDate',
            'targetCategories', 'targetStates', 'contactEmail', 'contactPhone'
        ];

        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                ad[field] = updates[field];
            }
        });

        // If ad was rejected, resubmit as pending
        if (ad.status === 'rejected') {
            ad.status = 'pending';
            ad.rejectionReason = '';
        }

        await ad.save();

        res.json({
            success: true,
            message: 'Ad updated successfully',
            data: ad
        });
    } catch (err) {
        next(err);
    }
};

// Delete ad (soft delete)
exports.remove = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        const ad = await Ad.findOne({
            _id: id,
            ownerId: userId,
            isDeleted: false
        });

        if (!ad) {
            return res.status(404).json({
                success: false,
                message: 'Ad not found'
            });
        }

        ad.isDeleted = true;
        await ad.save();

        res.json({
            success: true,
            message: 'Ad deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};

// Stop ad (user can stop their own approved ad)
exports.stopAd = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        const ad = await Ad.findOne({
            _id: id,
            ownerId: userId,
            isDeleted: false
        });

        if (!ad) {
            return res.status(404).json({
                success: false,
                message: 'Ad not found'
            });
        }

        if (ad.status !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Can only stop approved ads'
            });
        }

        ad.status = 'stopped';
        await ad.save();

        res.json({
            success: true,
            message: 'Ad stopped successfully',
            data: ad
        });
    } catch (err) {
        next(err);
    }
};

// Reactivate stopped ad (sets back to pending for review)
exports.reactivateAd = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        const ad = await Ad.findOne({
            _id: id,
            ownerId: userId,
            isDeleted: false
        });

        if (!ad) {
            return res.status(404).json({
                success: false,
                message: 'Ad not found'
            });
        }

        if (ad.status !== 'stopped' && ad.status !== 'rejected') {
            return res.status(400).json({
                success: false,
                message: 'Can only reactivate stopped or rejected ads'
            });
        }

        ad.status = 'pending';
        ad.rejectionReason = '';
        await ad.save();

        res.json({
            success: true,
            message: 'Ad resubmitted for review',
            data: ad
        });
    } catch (err) {
        next(err);
    }
};

// Get ad stats for user's ads
exports.getMyStats = async (req, res, next) => {
    try {
        const userId = req.userId;

        const stats = await Ad.aggregate([
            { $match: { ownerId: userId, isDeleted: false } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalImpressions: { $sum: '$impressions' },
                    totalClicks: { $sum: '$clicks' }
                }
            }
        ]);

        const result = {
            pending: 0,
            approved: 0,
            rejected: 0,
            stopped: 0,
            totalImpressions: 0,
            totalClicks: 0
        };

        stats.forEach(stat => {
            result[stat._id] = stat.count;
            result.totalImpressions += stat.totalImpressions;
            result.totalClicks += stat.totalClicks;
        });

        result.total = result.pending + result.approved + result.rejected + result.stopped;

        res.json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};
