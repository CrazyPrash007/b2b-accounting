// src/controllers/customer.controller.js
const Customer = require("../models/Customer");
const mongoose = require("mongoose");

function toObjectId(id) {
    if (!id || !mongoose.isValidObjectId(id)) return null;
    return new mongoose.Types.ObjectId(id);
}

function normalizeString(v) {
    if (!v) return "";
    return String(v).trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * LIST CUSTOMERS
 */
async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                message: "Valid accountCompanyName (companyId) is required",
            });
        }

        const { page = 1, limit = 50, search, sort } = req.query;

        const q = {
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false,
        };

        // Searching multiple fields
        if (search?.trim()) {
            const s = search.trim();
            q.$or = [
                { customerName: { $regex: s, $options: "i" } },
                { name: { $regex: s, $options: "i" } },
                { companyName: { $regex: s, $options: "i" } },
                { mobileNumber: { $regex: s, $options: "i" } },
            ];
        }

        const sortObj = {};
        if (sort) {
            const [k, dir] = sort.split(":");
            sortObj[k || "createdAt"] = dir === "desc" ? -1 : 1;
        } else {
            sortObj.createdAt = -1;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [items, total] = await Promise.all([
            Customer.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Customer.countDocuments(q),
        ]);

        return res.json({
            success: true,
            data: items,
            meta: { page: Number(page), limit: Number(limit), total },
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET ONE CUSTOMER
 */
async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                message: "Valid accountCompanyName (companyId) is required",
            });
        }

        const doc = await Customer.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false,
        });

        if (!doc) {
            return res
                .status(404)
                .json({ success: false, error: { message: "Not found" } });
        }

        return res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

/**
 * CREATE CUSTOMER
 */
async function create(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.body.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                message: "Valid accountCompanyName (companyId) is required",
            });
        }

        if (!req.body.customerName?.trim()) {
            const msg = "customerName is required";
            return res.status(400).json({ success: false, error: { message: msg } });
        }

        const payload = {
            ...req.body,
            ownerId,
            accountCompanyName: companyId,
            createdBy: req.user.id,
        };

        payload.customerName = payload.customerName.trim();
        payload.customerNameNorm = normalizeString(payload.customerName);
        payload.companyNameNorm = normalizeString(payload.companyName);

        // Prevent duplicates (scoped by owner + company)
        const exists = await Customer.findOne({
            ownerId,
            accountCompanyName: companyId,
            customerNameNorm: payload.customerNameNorm,
            companyNameNorm: payload.companyNameNorm,
            isDeleted: false,
        }).lean();

        if (exists) {
            const msg = "customer already created";
            return res
                .status(409)
                .json({ success: false, error: { message: msg } });
        }

        const doc = await Customer.create(payload);

        return res.status(201).json({ success: true, data: doc });
    } catch (err) {
        if (err.code === 11000) {
            const msg = "customer already created";
            return res.status(409).json({
                success: false,
                error: { message: msg },
            });
        }
        next(err);
    }
}

/**
 * UPDATE CUSTOMER
 */
async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;

        const companyId = toObjectId(req.body.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                message: "Valid accountCompanyName (companyId) is required",
            });
        }

        const payload = {
            ...req.body,
            updatedBy: req.user.id,
        };

        // Normalize if customerName/companyName was modified
        if (payload.customerName !== undefined) {
            payload.customerName = payload.customerName.trim();
            payload.customerNameNorm = normalizeString(payload.customerName);
        }
        if (payload.companyName !== undefined) {
            payload.companyNameNorm = normalizeString(payload.companyName);
        }

        // Duplicate check only when name fields change
        if (payload.customerNameNorm || payload.companyNameNorm) {
            const conflict = await Customer.findOne({
                ownerId,
                accountCompanyName: companyId,
                customerNameNorm: payload.customerNameNorm,
                companyNameNorm: payload.companyNameNorm,
                isDeleted: false,
                _id: { $ne: id },
            }).lean();

            if (conflict) {
                const msg = "customer already created";
                return res
                    .status(409)
                    .json({ success: false, error: { message: msg } });
            }
        }

        const doc = await Customer.findOneAndUpdate(
            {
                _id: id,
                ownerId,
                accountCompanyName: companyId,
            },
            payload,
            { new: true, runValidators: true }
        );

        if (!doc) {
            return res
                .status(404)
                .json({ success: false, error: { message: "Not found" } });
        }

        return res.json({ success: true, data: doc });
    } catch (err) {
        if (err.code === 11000) {
            const msg = "customer already created";
            return res.status(409).json({
                success: false,
                error: { message: msg },
            });
        }
        next(err);
    }
}

/**
 * DELETE CUSTOMER (SOFT DELETE)
 */
async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                message: "Valid accountCompanyName (companyId) is required",
            });
        }

        const doc = await Customer.findOneAndUpdate(
            {
                _id: req.params.id,
                ownerId,
                accountCompanyName: companyId,
            },
            { isDeleted: true, updatedBy: req.user.id },
            { new: true }
        );

        if (!doc) {
            return res
                .status(404)
                .json({ success: false, error: { message: "Not found" } });
        }

        return res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove };
