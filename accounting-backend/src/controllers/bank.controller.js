// src/controllers/bank.controller.js
const Bank = require('../models/Bank');
const mongoose = require('mongoose');

function toObjectId(id) {
    if (!id || !mongoose.isValidObjectId(id)) return null;
    return new mongoose.Types.ObjectId(id);
}

/**
 * LIST BANK ACCOUNTS
 */
async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({ message: "Valid accountCompanyName (companyId) is required" });
        }

        const { page = 1, limit = 50, search, sort } = req.query;

        const q = {
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        };

        if (search) {
            const s = search.trim();
            q.$or = [
                { accountDisplayName: { $regex: s, $options: 'i' } },
                { bankName: { $regex: s, $options: 'i' } },
                { accountNumber: { $regex: s, $options: 'i' } }
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
            Bank.countDocuments(q)
        ]);

        res.json({ success: true, data: items, meta: { page: Number(page), limit: Number(limit), total } });

    } catch (err) {
        next(err);
    }
}

/**
 * GET SINGLE BANK ACCOUNT
 */
async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({ message: "Valid accountCompanyName (companyId) is required" });
        }

        const doc = await Bank.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        });

        if (!doc) return res.status(404).json({ success: false, error: { message: "Not found" } });

        res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

/**
 * CREATE BANK ENTRY
 */
async function create(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.body.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({ message: "Valid accountCompanyName (companyId) is required" });
        }

        const payload = {
            ...req.body,
            ownerId,
            accountCompanyName: companyId,
            createdBy: req.user.id
        };

        const exists = await Bank.findOne({
            ownerId,
            accountCompanyName: companyId,
            accountNumber: payload.accountNumber,
            isDeleted: false
        });

        if (exists) {
            return res.status(409).json({ success: false, error: { message: "account already exists" } });
        }

        const doc = await Bank.create(payload);

        res.status(201).json({ success: true, data: doc });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, error: { message: "account already exists" } });
        }
        next(err);
    }
}

/**
 * UPDATE BANK ENTRY
 */
async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.body.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({ message: "Valid accountCompanyName (companyId) is required" });
        }

        const id = req.params.id;

        const payload = {
            ...req.body,
            accountCompanyName: companyId,
            updatedBy: req.user.id
        };

        if (payload.status) {
            payload.isActive = payload.status === "Active";
        }

        if (payload.openingBalance != null) {
            payload.openingBalance = Number(payload.openingBalance) || 0;
        }

        const doc = await Bank.findOneAndUpdate(
            { _id: id, ownerId, accountCompanyName: companyId },
            payload,
            { new: true, runValidators: true }
        );

        if (!doc) return res.status(404).json({ success: false, error: { message: "Not found" } });

        res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

/**
 * DELETE BANK ENTRY (Soft Delete)
 */
async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({ message: "Valid accountCompanyName (companyId) is required" });
        }

        const doc = await Bank.findOneAndUpdate(
            { _id: req.params.id, ownerId, accountCompanyName: companyId },
            { isDeleted: true, updatedBy: req.user.id },
            { new: true }
        );

        if (!doc) return res.status(404).json({ success: false, error: { message: "Not found" } });

        res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove };
