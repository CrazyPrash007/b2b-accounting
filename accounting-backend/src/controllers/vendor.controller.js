// src/controllers/vendor.controller.js
const Vendor = require('../models/Vendor');

function normalizeString(v) {
    if (v === undefined || v === null) return "";
    return String(v).trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * All controllers enforce owner scoping: ownerId is taken from req.user.ownerId
 */

async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const { page = 1, limit = 50, search, sort } = req.query;
        const q = { ownerId, isDeleted: false };

        if (search) {
            q.$or = [
                { vendorName: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
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
            Vendor.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Vendor.countDocuments(q),
        ]);

        res.json({ success: true, data: items, meta: { page: Number(page), limit: Number(limit), total } });
    } catch (err) {
        next(err);
    }
}

async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const doc = await Vendor.findOne({ _id: req.params.id, ownerId, isDeleted: false });
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

        // Normalize openingBalanceAmount
        if (payload.openingBalanceAmount === "" || payload.openingBalanceAmount === null || payload.openingBalanceAmount === undefined) {
            payload.openingBalanceAmount = 0;
        } else {
            payload.openingBalanceAmount = Number(payload.openingBalanceAmount) || 0;
        }

        // Ensure display name exists
        if (!payload.name && payload.vendorName) payload.name = payload.vendorName;

        // required safe check
        if (!payload.vendorName) {
            return res.status(400).json({ success: false, message: 'vendorName is required', error: { message: 'vendorName is required' } });
        }

        // normalized values for pre-check
        const vendorNameNorm = normalizeString(payload.vendorName);
        const companyNameNorm = normalizeString(payload.companyName);

        const existing = await Vendor.findOne({ ownerId, vendorNameNorm, companyNameNorm, isDeleted: false }).lean();
        if (existing) {
            const msg = 'vendor already created';
            res.set('X-Error-Message', msg);
            return res.status(409).json({ success: false, message: msg, error: { message: msg } });
        }

        // trim the source fields before create (middleware also sets normalized)
        payload.vendorName = String(payload.vendorName).trim();
        payload.companyName = payload.companyName ? String(payload.companyName).trim() : "";

        const doc = await Vendor.create(payload);
        res.status(201).json({ success: true, data: doc });
    } catch (err) {
        if (err && err.code === 11000) {
            const msg = 'vendor already created';
            res.set('X-Error-Message', msg);
            return res.status(409).json({ success: false, message: msg, error: { message: msg }, details: err.keyValue || null });
        }
        next(err);
    }
}

async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;
        const payload = { ...req.body, updatedBy: req.user.id };

        if (payload.openingBalanceAmount === "" || payload.openingBalanceAmount === null) {
            delete payload.openingBalanceAmount;
        } else if (payload.openingBalanceAmount !== undefined) {
            payload.openingBalanceAmount = Number(payload.openingBalanceAmount) || 0;
        }

        // normalize user input for checks
        if (payload.vendorName !== undefined && payload.vendorName !== null) {
            payload.vendorName = String(payload.vendorName).trim();
        }
        if (payload.companyName !== undefined && payload.companyName !== null) {
            payload.companyName = String(payload.companyName).trim();
        }

        // If vendorName or companyName is changing, check normalized uniqueness
        if (payload.vendorName !== undefined || payload.companyName !== undefined) {
            const existingDoc = await Vendor.findOne({ _id: id, ownerId }).lean();
            if (!existingDoc) return res.status(404).json({ success: false, error: { message: 'Not found' } });

            const checkVendorNorm = payload.vendorName !== undefined ? normalizeString(payload.vendorName) : existingDoc.vendorNameNorm;
            const checkCompanyNorm = payload.companyName !== undefined ? normalizeString(payload.companyName) : existingDoc.companyNameNorm;

            const conflict = await Vendor.findOne({
                ownerId,
                vendorNameNorm: checkVendorNorm,
                companyNameNorm: checkCompanyNorm,
                isDeleted: false,
                _id: { $ne: id }
            }).lean();

            if (conflict) {
                const msg = 'vendor already created';
                res.set('X-Error-Message', msg);
                return res.status(409).json({ success: false, message: msg, error: { message: msg } });
            }
        }

        const doc = await Vendor.findOneAndUpdate({ _id: id, ownerId }, payload, { new: true, runValidators: true });
        if (!doc) return res.status(404).json({ success: false, error: { message: 'Not found' } });
        res.json({ success: true, data: doc });
    } catch (err) {
        if (err && err.code === 11000) {
            const msg = 'vendor already created';
            res.set('X-Error-Message', msg);
            return res.status(409).json({ success: false, message: msg, error: { message: msg }, details: err.keyValue || null });
        }
        next(err);
    }
}

async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;
        const doc = await Vendor.findOneAndUpdate({ _id: id, ownerId }, { isDeleted: true }, { new: true });
        if (!doc) return res.status(404).json({ success: false, error: { message: 'Not found' } });
        res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove };
