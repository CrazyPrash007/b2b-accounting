// src/controllers/item.controller.js
const Item = require("../models/Item");
const mongoose = require("mongoose");

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

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                success: false,
                error: { message: "Valid accountCompanyName (companyId) is required" }
            });
        }

        const { page = 1, limit = 50, search, sort, category, brand } = req.query;

        const q = {
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        };

        // Search: item name + alias name + hsn
        if (search) {
            const s = search.trim();
            q.$or = [
                { name: { $regex: s, $options: "i" } },
                { itemName: { $regex: s, $options: "i" } },
                { hsnNo: { $regex: s, $options: "i" } }
            ];
        }

        // optional category, brand filters
        if (category) q.category = category;
        if (brand) q.brandName = brand;

        // Sorting
        const sortObj = {};
        if (sort) {
            const [key, dir] = sort.split(":");
            sortObj[key || "createdAt"] = dir === "desc" ? -1 : 1;
        } else {
            sortObj.createdAt = -1;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [items, total] = await Promise.all([
            Item.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Item.countDocuments(q)
        ]);

        return res.json({
            success: true,
            data: items,
            meta: { page: Number(page), limit: Number(limit), total }
        });

    } catch (err) {
        next(err);
    }
}

/* ============================= GET ONE ============================= */
async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                success: false,
                error: { message: "Valid accountCompanyName (companyId) is required" }
            });
        }

        const doc = await Item.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        });

        if (!doc) {
            return res.status(404).json({
                success: false,
                error: { message: "Not found" }
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

        const companyId = toObjectId(req.body.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                success: false,
                error: { message: "Valid accountCompanyName is required" }
            });
        }

        if (!req.body.name && !req.body.itemName) {
            return res.status(400).json({
                success: false,
                error: { message: "Item name (name or itemName) is required" }
            });
        }

        const payload = {
            ...req.body,
            ownerId,
            accountCompanyName: companyId,
            createdBy: req.user.id,
            // canonical name fallback
            name: req.body.name?.trim() || req.body.itemName?.trim()
        };

        // Numeric coercions
        ["gstRate", "buyPrice", "sellPrice", "openingStock", "minStock"].forEach((field) => {
            if (payload[field] != null && payload[field] !== "") {
                payload[field] = Number(payload[field]) || 0;
            }
        });

        // Date coercion
        if (payload.openingDate) {
            payload.openingDate = new Date(payload.openingDate);
        }

        const doc = await Item.create(payload);

        return res.status(201).json({ success: true, data: doc });

    } catch (err) {
        if (err?.code === 11000) {
            return res.status(409).json({
                success: false,
                error: { message: "Item with same name already exists for this company" }
            });
        }
        next(err);
    }
}

/* ============================= UPDATE ============================= */
async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;

        const companyId = toObjectId(req.body.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                success: false,
                error: { message: "Valid accountCompanyName is required" }
            });
        }

        const payload = {
            ...req.body,
            updatedBy: req.user.id
        };

        // Canonical name sync
        if (payload.itemName && !payload.name) {
            payload.name = payload.itemName.trim();
        }
        if (payload.name) {
            payload.name = payload.name.trim();
        }

        // Numeric coercions
        ["gstRate", "buyPrice", "sellPrice", "openingStock", "minStock"].forEach((field) => {
            if (payload[field] != null && payload[field] !== "") {
                payload[field] = Number(payload[field]) || 0;
            }
        });

        // Date coercion
        if (payload.openingDate) {
            payload.openingDate = new Date(payload.openingDate);
        }

        const doc = await Item.findOneAndUpdate(
            {
                _id: id,
                ownerId,
                accountCompanyName: companyId
            },
            payload,
            { new: true, runValidators: true }
        );

        if (!doc) {
            return res.status(404).json({
                success: false,
                error: { message: "Not found" }
            });
        }

        return res.json({ success: true, data: doc });

    } catch (err) {
        if (err?.code === 11000) {
            return res.status(409).json({
                success: false,
                error: { message: "Item with same name already exists for this company" }
            });
        }
        next(err);
    }
}

/* ============================= DELETE (SOFT DELETE) ============================= */
async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                success: false,
                error: { message: "Valid accountCompanyName is required" }
            });
        }

        const doc = await Item.findOneAndUpdate(
            {
                _id: req.params.id,
                ownerId,
                accountCompanyName: companyId
            },
            { isDeleted: true, updatedBy: req.user.id },
            { new: true }
        );

        if (!doc) {
            return res.status(404).json({
                success: false,
                error: { message: "Not found" }
            });
        }

        res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove };
