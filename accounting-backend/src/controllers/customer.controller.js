// src/controllers/customer.controller.js
const Customer = require('../models/Customer');

function normalizeString(v) {
    if (v === undefined || v === null) return "";
    return String(v).trim().replace(/\s+/g, ' ').toLowerCase();
}

async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const { page = 1, limit = 50, search, sort } = req.query;
        const q = { ownerId, isDeleted: false };

        if (search) {
            q.$or = [
                { customerName: { $regex: search, $options: 'i' } },
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
            Customer.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Customer.countDocuments(q),
        ]);

        res.json({ success: true, data: items, meta: { page: Number(page), limit: Number(limit), total } });
    } catch (err) {
        next(err);
    }
}

async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const doc = await Customer.findOne({ _id: req.params.id, ownerId, isDeleted: false });
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

        if (payload.openingBalanceAmount === "" || payload.openingBalanceAmount === null || payload.openingBalanceAmount === undefined) {
            payload.openingBalanceAmount = 0;
        }

        if (!payload.customerName) {
            return res.status(400).json({ success: false, message: 'customerName is required', error: { message: 'customerName is required' } });
        }

        const customerNameNorm = normalizeString(payload.customerName);
        const companyNameNorm = normalizeString(payload.companyName);

        // pre-check using normalized fields
        const existing = await Customer.findOne({
            ownerId,
            customerNameNorm,
            companyNameNorm,
            isDeleted: false
        }).lean();

        if (existing) {
            const msg = 'customer already created';
            res.set('X-Error-Message', msg);
            return res.status(409).json({ success: false, message: msg, error: { message: msg } });
        }

        // you can optionally set normalized fields before create; model's pre-save will also populate them
        payload.customerName = String(payload.customerName).trim();
        payload.companyName = payload.companyName ? String(payload.companyName).trim() : "";

        const doc = await Customer.create(payload);
        res.status(201).json({ success: true, data: doc });
    } catch (err) {
        if (err && err.code === 11000) {
            const msg = 'customer already created';
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
        }

        // normalize input strings
        if (payload.customerName !== undefined && payload.customerName !== null) {
            payload.customerName = String(payload.customerName).trim();
        }
        if (payload.companyName !== undefined && payload.companyName !== null) {
            payload.companyName = String(payload.companyName).trim();
        }

        // If customerName or companyName is being changed, check uniqueness using normalized values
        if (payload.customerName !== undefined || payload.companyName !== undefined) {
            const existingDoc = await Customer.findOne({ _id: id, ownerId }).lean();
            if (!existingDoc) return res.status(404).json({ success: false, error: { message: 'Not found' } });

            const checkNameNorm = payload.customerName !== undefined ? normalizeString(payload.customerName) : existingDoc.customerNameNorm;
            const checkCompanyNorm = payload.companyName !== undefined ? normalizeString(payload.companyName) : existingDoc.companyNameNorm;

            const conflict = await Customer.findOne({
                ownerId,
                customerNameNorm: checkNameNorm,
                companyNameNorm: checkCompanyNorm,
                isDeleted: false,
                _id: { $ne: id }
            }).lean();

            if (conflict) {
                const msg = 'customer already created';
                res.set('X-Error-Message', msg);
                return res.status(409).json({ success: false, message: msg, error: { message: msg } });
            }
        }

        const doc = await Customer.findOneAndUpdate({ _id: id, ownerId }, payload, { new: true, runValidators: true });
        if (!doc) return res.status(404).json({ success: false, error: { message: 'Not found' } });
        res.json({ success: true, data: doc });
    } catch (err) {
        if (err && err.code === 11000) {
            const msg = 'customer already created';
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
        const doc = await Customer.findOneAndUpdate({ _id: id, ownerId }, { isDeleted: true }, { new: true });
        if (!doc) return res.status(404).json({ success: false, error: { message: 'Not found' } });
        res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove };
