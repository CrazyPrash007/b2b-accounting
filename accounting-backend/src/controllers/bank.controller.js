// src/controllers/bank.controller.js
const Bank = require('../models/Bank');

/**
 * All controllers enforce owner scoping: ownerId is taken from req.user.ownerId
 */

async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const { page = 1, limit = 50, search, sort } = req.query;
        const q = { ownerId, isDeleted: false };

        if (search) {
            const s = search.trim();
            // search across display name and bank name and account number
            q.$or = [
                { accountDisplayName: { $regex: s, $options: 'i' } },
                { bankName: { $regex: s, $options: 'i' } },
                { accountNumber: { $regex: s, $options: 'i' } },
            ];
        }

        const sortObj = {};
        if (sort) {
            const [k, dir] = sort.split(':');
            sortObj[k || 'createdAt'] = dir === 'desc' ? -1 : 1;
        } else {
            sortObj.createdAt = -1;
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [items, total] = await Promise.all([
            Bank.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Bank.countDocuments(q),
        ]);

        res.json({ success: true, data: items, meta: { page: Number(page), limit: Number(limit), total } });
    } catch (err) {
        next(err);
    }
}

async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const doc = await Bank.findOne({ _id: req.params.id, ownerId, isDeleted: false });
        if (!doc) return res.status(404).json({ success: false, error: { message: 'Not found' } });
        res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

async function create(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const payload = { ...req.body, ownerId, createdBy: req.user.id };

        // ensure boolean/status coherence
        if (payload.status) {
            payload.isActive = payload.status === 'Active';
        } else if (typeof payload.isActive === 'boolean') {
            payload.status = payload.isActive ? 'Active' : 'Inactive';
        } else {
            payload.status = payload.status || 'Active';
            payload.isActive = payload.status === 'Active';
        }

        // openingBalance could come as string - coerce
        if (payload.openingBalance !== undefined && payload.openingBalance !== null) {
            payload.openingBalance = Number(payload.openingBalance) || 0;
        }

        // ---- explicit pre-check to provide friendly error (race possible but rare) ----
        if (!payload.accountNumber) {
            return res.status(400).json({ success: false, error: { message: 'accountNumber is required' } });
        }

        const existing = await Bank.findOne({ ownerId, accountNumber: payload.accountNumber, isDeleted: false }).lean();
        if (existing) {
            return res.status(409).json({ success: false, error: { message: 'account already exists' } });
        }

        const doc = await Bank.create(payload);
        res.status(201).json({ success: true, data: doc });
    } catch (err) {
        // handle duplicate key error to give friendly message
        if (err && err.code === 11000) {
            // try to detect duplicated field
            const key = (err.keyValue && Object.keys(err.keyValue)[0]) ||
                (err.keyPattern && Object.keys(err.keyPattern)[0]) ||
                (err.message && (err.message.match(/index:\s*(\S+)_1/) || [])[1]) ||
                null;

            if (key && /accountNumber/i.test(key)) {
                return res.status(409).json({ success: false, error: { message: 'account already exists' } });
            }
            return res.status(409).json({ success: false, error: { message: 'duplicate key error' } });
        }
        next(err);
    }
}

async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;
        const payload = { ...req.body, updatedBy: req.user.id };

        if (payload.status) {
            payload.isActive = payload.status === 'Active';
        } else if (typeof payload.isActive === 'boolean') {
            payload.status = payload.isActive ? 'Active' : 'Inactive';
        }

        if (payload.openingBalance !== undefined && payload.openingBalance !== null) {
            payload.openingBalance = Number(payload.openingBalance) || 0;
        }

        // If accountNumber is being changed, ensure uniqueness scoped to owner
        if (payload.accountNumber) {
            const conflict = await Bank.findOne({
                ownerId,
                accountNumber: payload.accountNumber,
                isDeleted: false,
                _id: { $ne: id }
            }).lean();
            if (conflict) {
                return res.status(409).json({ success: false, error: { message: 'account already exists' } });
            }
        }

        // runValidators true ensures schema validation on update
        const doc = await Bank.findOneAndUpdate({ _id: id, ownerId }, payload, { new: true, runValidators: true });
        if (!doc) return res.status(404).json({ success: false, error: { message: 'Not found' } });
        res.json({ success: true, data: doc });
    } catch (err) {
        // handle duplicate key error with friendly message
        if (err && err.code === 11000) {
            const key = (err.keyValue && Object.keys(err.keyValue)[0]) ||
                (err.keyPattern && Object.keys(err.keyPattern)[0]) ||
                null;
            if (key && /accountNumber/i.test(key)) {
                return res.status(409).json({ success: false, error: { message: 'account already exists' } });
            }
            return res.status(409).json({ success: false, error: { message: 'duplicate key error' } });
        }
        next(err);
    }
}

async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;
        const doc = await Bank.findOneAndUpdate({ _id: id, ownerId }, { isDeleted: true, updatedBy: req.user.id }, { new: true });
        if (!doc) return res.status(404).json({ success: false, error: { message: 'Not found' } });
        res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove };
