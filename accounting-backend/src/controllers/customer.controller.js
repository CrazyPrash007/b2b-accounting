// src/controllers/customer.controller.js
const Customer = require('../models/Customer');

function normalizeString(v) {
    if (v === undefined || v === null) return "";
    return String(v).trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * LIST CUSTOMERS
 */
async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const { page = 1, limit = 50, search, sort } = req.query;

        const accountCompanyName = req.query.accountCompanyName;
        if (!accountCompanyName) {
            return res.status(400).json({ message: "accountCompanyName is required" });
        }

        const q = {
            ownerId,
            accountCompanyName,
            isDeleted: false
        };

        if (search) {
            const s = search.trim();
            q.$or = [
                { customerName: { $regex: s, $options: "i" } },
                { name: { $regex: s, $options: "i" } }
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
            Customer.countDocuments(q)
        ]);

        res.json({
            success: true,
            data: items,
            meta: { page: Number(page), limit: Number(limit), total }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET SINGLE CUSTOMER
 */
async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const accountCompanyName = req.query.accountCompanyName;
        if (!accountCompanyName) {
            return res.status(400).json({ message: "accountCompanyName is required" });
        }

        const doc = await Customer.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName,
            isDeleted: false
        });

        if (!doc)
            return res.status(404).json({ success: false, error: { message: "Not found" } });

        res.json({ success: true, data: doc });
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

        if (!req.body.accountCompanyName) {
            return res.status(400).json({ message: "accountCompanyName is required" });
        }

        const payload = {
            ...req.body,
            ownerId,
            accountCompanyName: req.body.accountCompanyName,
            createdBy: req.user.id
        };

        if (!payload.customerName) {
            return res.status(400).json({
                success: false,
                message: "customerName is required",
                error: { message: "customerName is required" }
            });
        }

        // normalize customer name
        const customerNameNorm = normalizeString(payload.customerName);

        // Do NOT use customer's own companyName in uniqueness
        const existing = await Customer.findOne({
            ownerId,
            accountCompanyName: payload.accountCompanyName,
            customerNameNorm,
            isDeleted: false
        }).lean();

        if (existing) {
            const msg = "customer already created";
            return res.status(409).json({ success: false, message: msg, error: { message: msg } });
        }

        payload.customerName = payload.customerName.trim();

        const doc = await Customer.create(payload);
        res.status(201).json({ success: true, data: doc });
    } catch (err) {
        if (err && err.code === 11000) {
            const msg = "customer already created";
            return res.status(409).json({
                success: false,
                message: msg,
                error: { message: msg },
                details: err.keyValue || null
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

        if (!req.body.accountCompanyName) {
            return res.status(400).json({ message: "accountCompanyName is required" });
        }

        const payload = {
            ...req.body,
            updatedBy: req.user.id
        };

        // normalize name
        let newNameNorm = null;
        if (payload.customerName !== undefined && payload.customerName !== null) {
            payload.customerName = payload.customerName.trim();
            newNameNorm = normalizeString(payload.customerName);
        }

        // Check uniqueness only if customerName is changing
        if (newNameNorm !== null) {
            const conflict = await Customer.findOne({
                ownerId,
                accountCompanyName: req.body.accountCompanyName,
                customerNameNorm: newNameNorm,
                isDeleted: false,
                _id: { $ne: id }
            }).lean();

            if (conflict) {
                const msg = "customer already created";
                return res.status(409).json({ success: false, message: msg, error: { message: msg } });
            }
        }

        const doc = await Customer.findOneAndUpdate(
            {
                _id: id,
                ownerId,
                accountCompanyName: req.body.accountCompanyName
            },
            payload,
            { new: true, runValidators: true }
        );

        if (!doc)
            return res.status(404).json({ success: false, error: { message: "Not found" } });

        res.json({ success: true, data: doc });
    } catch (err) {
        if (err && err.code === 11000) {
            const msg = "customer already created";
            return res.status(409).json({
                success: false,
                message: msg,
                error: { message: msg },
                details: err.keyValue || null
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

        if (!req.query.accountCompanyName) {
            return res.status(400).json({ message: "accountCompanyName is required" });
        }

        const doc = await Customer.findOneAndUpdate(
            {
                _id: req.params.id,
                ownerId,
                accountCompanyName: req.query.accountCompanyName
            },
            { isDeleted: true },
            { new: true }
        );

        if (!doc)
            return res.status(404).json({ success: false, error: { message: "Not found" } });

        res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove };
