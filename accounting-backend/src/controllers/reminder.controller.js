// src/controllers/reminder.controller.js
const Reminder = require('../models/Reminder');
const { validateCreate, validateUpdate } = require('../validators/reminder.validator');
const mongoose = require('mongoose');

/* --------------------------- Helper --------------------------- */
function toObjectId(id) {
    if (!id) return null;
    try {
        return new mongoose.Types.ObjectId(id);
    } catch (e) {
        return null;
    }
}

/* ============================= LIST ============================= */
async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const { accountCompanyName, status, category, priority, fromDate, toDate } = req.query;

        const companyId = toObjectId(accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                success: false,
                error: { message: 'Valid accountCompanyName is required' }
            });
        }

        const query = {
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        };

        // Optional filters
        if (status) query.status = status;
        if (category) query.category = category;
        if (priority) query.priority = priority;

        // Date range filter
        if (fromDate || toDate) {
            query.dueDate = {};
            if (fromDate) query.dueDate.$gte = new Date(fromDate);
            if (toDate) query.dueDate.$lte = new Date(toDate);
        }

        const docs = await Reminder.find(query)
            .sort({ dueDate: 1, priority: -1, createdAt: -1 })
            .lean();

        // Calculate stats
        const stats = {
            total: docs.length,
            pending: docs.filter(d => d.status === 'pending').length,
            inProgress: docs.filter(d => d.status === 'in_progress').length,
            completed: docs.filter(d => d.status === 'completed').length,
            overdue: docs.filter(d => d.status !== 'completed' && d.status !== 'cancelled' && new Date(d.dueDate) < new Date()).length
        };

        return res.json({
            success: true,
            data: docs,
            meta: stats
        });

    } catch (err) {
        next(err);
    }
}

/* ============================= GET BY ID ============================= */
async function getById(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const { id } = req.params;
        const { accountCompanyName } = req.query;

        const companyId = toObjectId(accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                success: false,
                error: { message: 'Valid accountCompanyName is required' }
            });
        }

        const doc = await Reminder.findOne({
            _id: id,
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        }).lean();

        if (!doc) {
            return res.status(404).json({
                success: false,
                error: { message: 'Reminder not found' }
            });
        }

        return res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

/* ============================= CREATE ============================= */
async function create(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const { error, value } = validateCreate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: { message: error.details.map(d => d.message).join(', ') }
            });
        }

        const companyId = toObjectId(value.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                success: false,
                error: { message: 'Valid accountCompanyName is required' }
            });
        }

        const payload = {
            ...value,
            ownerId,
            accountCompanyName: companyId,
            createdBy: req.user.id
        };

        const doc = await Reminder.create(payload);

        return res.status(201).json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

/* ============================= UPDATE ============================= */
async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const { id } = req.params;

        const { error, value } = validateUpdate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: { message: error.details.map(d => d.message).join(', ') }
            });
        }

        const companyId = toObjectId(value.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                success: false,
                error: { message: 'Valid accountCompanyName is required' }
            });
        }

        const payload = {
            ...value,
            updatedBy: req.user.id
        };

        // If marking as completed, set completedAt
        if (payload.status === 'completed') {
            payload.completedAt = new Date();
            payload.completedBy = req.user.id;
        }

        const doc = await Reminder.findOneAndUpdate(
            {
                _id: id,
                ownerId,
                accountCompanyName: companyId,
                isDeleted: false
            },
            payload,
            { new: true }
        );

        if (!doc) {
            return res.status(404).json({
                success: false,
                error: { message: 'Reminder not found' }
            });
        }

        return res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

/* ============================= DELETE (Soft) ============================= */
async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const { id } = req.params;
        const { accountCompanyName } = req.query;

        const companyId = toObjectId(accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                success: false,
                error: { message: 'Valid accountCompanyName is required' }
            });
        }

        const doc = await Reminder.findOneAndUpdate(
            {
                _id: id,
                ownerId,
                accountCompanyName: companyId,
                isDeleted: false
            },
            { isDeleted: true, updatedBy: req.user.id },
            { new: true }
        );

        if (!doc) {
            return res.status(404).json({
                success: false,
                error: { message: 'Reminder not found' }
            });
        }

        return res.json({ success: true, data: { message: 'Reminder deleted successfully' } });

    } catch (err) {
        next(err);
    }
}

/* ============================= TOGGLE STATUS ============================= */
async function toggleStatus(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const { id } = req.params;
        const { accountCompanyName, status, completionNote } = req.body;

        const companyId = toObjectId(accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                success: false,
                error: { message: 'Valid accountCompanyName is required' }
            });
        }

        const updatePayload = {
            status,
            updatedBy: req.user.id
        };

        if (status === 'completed') {
            updatePayload.completedAt = new Date();
            updatePayload.completedBy = req.user.id;
            if (completionNote) updatePayload.completionNote = completionNote;
        }

        const doc = await Reminder.findOneAndUpdate(
            {
                _id: id,
                ownerId,
                accountCompanyName: companyId,
                isDeleted: false
            },
            updatePayload,
            { new: true }
        );

        if (!doc) {
            return res.status(404).json({
                success: false,
                error: { message: 'Reminder not found' }
            });
        }

        return res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

/* ============================= ADD FEEDBACK ============================= */
async function addFeedback(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const { id } = req.params;
        const { accountCompanyName, feedback } = req.body;

        const companyId = toObjectId(accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                success: false,
                error: { message: 'Valid accountCompanyName is required' }
            });
        }

        if (!feedback || !feedback.trim()) {
            return res.status(400).json({
                success: false,
                error: { message: 'Feedback is required' }
            });
        }

        const doc = await Reminder.findOneAndUpdate(
            {
                _id: id,
                ownerId,
                accountCompanyName: companyId,
                isDeleted: false
            },
            {
                latestFeedback: feedback.trim(),
                feedbackUpdatedAt: new Date(),
                feedbackUpdatedBy: req.user.id,
                updatedBy: req.user.id
            },
            { new: true }
        );

        if (!doc) {
            return res.status(404).json({
                success: false,
                error: { message: 'Reminder not found' }
            });
        }

        return res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

module.exports = {
    list,
    getById,
    create,
    update,
    remove,
    toggleStatus,
    addFeedback
};
