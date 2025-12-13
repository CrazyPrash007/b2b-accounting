// src/controllers/vendor.controller.js
const Vendor = require('../models/Vendor');

function normalizeString(v) {
    if (v === undefined || v === null) return "";
    return String(v).trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * All controllers enforce owner scoping + company scoping
 */

async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const accountCompanyName = req.query.accountCompanyName;

        if (!accountCompanyName) {
            return res.status(400).json({ success: false, message: "accountCompanyName is required" });
        }

        const { page = 1, limit = 50, search, sort } = req.query;

        const q = {
            ownerId,
            accountCompanyName,
            isDeleted: false
        };

        if (search) {
            q.$or = [
                { vendorName: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
                { companyName: { $regex: search, $options: 'i' } },
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
            Vendor.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Vendor.countDocuments(q),
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

async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const accountCompanyName = req.query.accountCompanyName;

        if (!accountCompanyName) {
            return res.status(400).json({ success: false, message: "accountCompanyName is required" });
        }

        const doc = await Vendor.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName,
            isDeleted: false
        });

        if (!doc) {
            return res.status(404).json({ success: false, error: { message: "Not found" } });
        }

        res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

async function create(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        if (!req.body.accountCompanyName) {
            return res.status(400).json({ success: false, message: "accountCompanyName is required" });
        }

        const payload = {
            ...req.body,
            ownerId,
            accountCompanyName: req.body.accountCompanyName,
            createdBy: req.user.id
        };

        // Normalize openingBalanceAmount
        if (payload.openingBalanceAmount === "" ||
            payload.openingBalanceAmount === null ||
            payload.openingBalanceAmount === undefined) {
            payload.openingBalanceAmount = 0;
        } else {
            payload.openingBalanceAmount = Number(payload.openingBalanceAmount) || 0;
        }

        if (!payload.vendorName) {
            return res.status(400).json({
                success: false,
                message: "vendorName is required",
                error: { message: "vendorName is required" }
            });
        }

        // default display name
        if (!payload.name) payload.name = payload.vendorName;

        // normalized values for check
        const vendorNameNorm = normalizeString(payload.vendorName);
        const companyNameNorm = normalizeString(payload.companyName);

        const existing = await Vendor.findOne({
            ownerId,
            accountCompanyName: payload.accountCompanyName,
            vendorNameNorm,
            companyNameNorm,
            isDeleted: false
        }).lean();

        if (existing) {
            const msg = "vendor already created";
            res.set("X-Error-Message", msg);
            return res.status(409).json({
                success: false,
                message: msg,
                error: { message: msg }
            });
        }

        // trim source fields
        payload.vendorName = String(payload.vendorName).trim();
        payload.companyName = payload.companyName ? String(payload.companyName).trim() : "";

        const doc = await Vendor.create(payload);

        res.status(201).json({ success: true, data: doc });

    } catch (err) {
        if (err && err.code === 11000) {
            const msg = "vendor already created";
            res.set("X-Error-Message", msg);
            return res.status(409).json({
                success: false,
                message: msg,
                error: { message: msg },
                details: err.keyValue
            });
        }
        next(err);
    }
}

async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const accountCompanyName = req.body.accountCompanyName;

        if (!accountCompanyName) {
            return res.status(400).json({ success: false, message: "accountCompanyName is required" });
        }

        const id = req.params.id;

        const payload = { ...req.body, updatedBy: req.user.id };

        if (payload.openingBalanceAmount === "" || payload.openingBalanceAmount === null) {
            delete payload.openingBalanceAmount;
        } else if (payload.openingBalanceAmount !== undefined) {
            payload.openingBalanceAmount = Number(payload.openingBalanceAmount) || 0;
        }

        if (payload.vendorName) payload.vendorName = payload.vendorName.trim();
        if (payload.companyName) payload.companyName = payload.companyName.trim();

        // Check conflicts when vendorName/companyName changes
        if (payload.vendorName !== undefined || payload.companyName !== undefined) {
            const existingDoc = await Vendor.findOne({
                _id: id,
                ownerId,
                accountCompanyName
            }).lean();

            if (!existingDoc) {
                return res.status(404).json({ success: false, error: { message: "Not found" } });
            }

            const checkVendorNorm =
                payload.vendorName !== undefined ?
                    normalizeString(payload.vendorName) :
                    existingDoc.vendorNameNorm;

            const checkCompanyNorm =
                payload.companyName !== undefined ?
                    normalizeString(payload.companyName) :
                    existingDoc.companyNameNorm;

            const conflict = await Vendor.findOne({
                ownerId,
                accountCompanyName,
                vendorNameNorm: checkVendorNorm,
                companyNameNorm: checkCompanyNorm,
                isDeleted: false,
                _id: { $ne: id }
            }).lean();

            if (conflict) {
                const msg = "vendor already created";
                res.set("X-Error-Message", msg);
                return res.status(409).json({
                    success: false,
                    message: msg,
                    error: { message: msg }
                });
            }
        }

        const doc = await Vendor.findOneAndUpdate(
            { _id: id, ownerId, accountCompanyName },
            payload,
            { new: true, runValidators: true }
        );

        if (!doc) {
            return res.status(404).json({ success: false, error: { message: "Not found" } });
        }

        res.json({ success: true, data: doc });

    } catch (err) {
        if (err && err.code === 11000) {
            const msg = "vendor already created";
            res.set("X-Error-Message", msg);
            return res.status(409).json({
                success: false,
                message: msg,
                error: { message: msg },
                details: err.keyValue
            });
        }
        next(err);
    }
}

async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const accountCompanyName = req.query.accountCompanyName;

        if (!accountCompanyName) {
            return res.status(400).json({ success: false, message: "accountCompanyName is required" });
        }

        const id = req.params.id;

        const doc = await Vendor.findOneAndUpdate(
            { _id: id, ownerId, accountCompanyName },
            { isDeleted: true },
            { new: true }
        );

        if (!doc) {
            return res.status(404).json({ success: false, error: { message: "Not found" } });
        }

        res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove };
