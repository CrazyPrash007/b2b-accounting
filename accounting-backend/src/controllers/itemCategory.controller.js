// src/controllers/itemCategory.controller.js
const ItemCategory = require("../models/ItemCategory");
const mongoose = require("mongoose");

/* --------------------------- Helper --------------------------- */
function toObjectId(id) {
    if (!id) return null;
    try {
        return new mongoose.Types.ObjectId(id);
    } catch (err) {
        return null;
    }
}

/* ============================= LIST ============================= */
async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const accountCompanyName = toObjectId(req.query.accountCompanyName);
        if (!accountCompanyName) {
            return res.status(400).json({
                success: false,
                error: { message: "accountCompanyName is required and must be valid" }
            });
        }

        const { page = 1, limit = 50, search, sort } = req.query;

        const q = {
            ownerId,
            accountCompanyName,
            isDeleted: false
        };

        if (search) {
            q.name = { $regex: search.trim(), $options: "i" };
        }

        const sortObj = {};
        if (sort) {
            const [key, dir] = sort.split(":");
            sortObj[key || "createdAt"] = dir === "desc" ? -1 : 1;
        } else {
            sortObj.createdAt = -1;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [items, total] = await Promise.all([
            ItemCategory.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            ItemCategory.countDocuments(q),
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

/* ============================= GET ONE ============================= */
async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const accountCompanyName = toObjectId(req.query.accountCompanyName);
        if (!accountCompanyName) {
            return res.status(400).json({
                success: false,
                error: { message: "accountCompanyName is required and must be valid" }
            });
        }

        const doc = await ItemCategory.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName,
            isDeleted: false
        });

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

/* ============================= CREATE ============================= */
async function create(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const accountCompanyName = toObjectId(req.body.accountCompanyName);
        if (!accountCompanyName) {
            return res.status(400).json({
                success: false,
                error: { message: "accountCompanyName is required and must be valid" }
            });
        }

        if (!req.body.name || !req.body.name.trim()) {
            return res.status(400).json({
                success: false,
                error: { message: "name is required" }
            });
        }

        const payload = {
            ...req.body,
            name: req.body.name.trim(),
            ownerId,
            accountCompanyName,
            createdBy: req.user.id
        };

        const doc = await ItemCategory.create(payload);

        res.status(201).json({ success: true, data: doc });

    } catch (err) {
        if (err?.code === 11000) {
            return res.status(409).json({
                success: false,
                error: { message: "category already exists for this company" }
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

        const accountCompanyName = toObjectId(req.body.accountCompanyName);
        if (!accountCompanyName) {
            return res.status(400).json({
                success: false,
                error: { message: "accountCompanyName is required and must be valid" }
            });
        }

        const payload = {
            ...req.body,
            updatedBy: req.user.id
        };

        if (payload.name) {
            payload.name = payload.name.trim();
        }

        const doc = await ItemCategory.findOneAndUpdate(
            { _id: id, ownerId, accountCompanyName },
            payload,
            { new: true, runValidators: true }
        );

        if (!doc) {
            return res.status(404).json({
                success: false,
                error: { message: "Not found" }
            });
        }

        res.json({ success: true, data: doc });

    } catch (err) {
        if (err?.code === 11000) {
            return res.status(409).json({
                success: false,
                error: { message: "category already exists for this company" }
            });
        }
        next(err);
    }
}

/* ============================= DELETE (SOFT) ============================= */
async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const accountCompanyName = toObjectId(req.query.accountCompanyName);
        if (!accountCompanyName) {
            return res.status(400).json({
                success: false,
                error: { message: "accountCompanyName is required and must be valid" }
            });
        }

        const id = req.params.id;

        const doc = await ItemCategory.findOneAndUpdate(
            { _id: id, ownerId, accountCompanyName },
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
