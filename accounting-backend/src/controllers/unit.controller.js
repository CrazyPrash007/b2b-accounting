// src/controllers/unit.controller.js
const Unit = require("../models/Unit");
const mongoose = require("mongoose");

function toObjectId(id) {
    if (!id || !mongoose.isValidObjectId(id)) return null;
    return new mongoose.Types.ObjectId(id);
}

/**
 * LIST UNITS
 */
async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res
                .status(400)
                .json({ message: "Valid accountCompanyName (companyId) is required" });
        }

        const { page = 1, limit = 50, search, sort } = req.query;

        const q = {
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false,
        };

        if (search) {
            const s = search.trim();
            q.$or = [
                { fullName: { $regex: s, $options: "i" } },
                { aliasName: { $regex: s, $options: "i" } },
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
            Unit.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Unit.countDocuments(q),
        ]);

        res.json({
            success: true,
            data: items,
            meta: { page: Number(page), limit: Number(limit), total },
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET ONE UNIT
 */
async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res
                .status(400)
                .json({ message: "Valid accountCompanyName (companyId) is required" });
        }

        const doc = await Unit.findOne({
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

        res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

/**
 * CREATE UNIT
 */
async function create(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.body.accountCompanyName);
        if (!companyId) {
            return res
                .status(400)
                .json({ message: "Valid accountCompanyName (companyId) is required" });
        }

        const payload = {
            ...req.body,
            ownerId,
            accountCompanyName: companyId,
            createdBy: req.user.id,
        };

        // Unique fullName per owner + company
        const exists = await Unit.findOne({
            ownerId,
            accountCompanyName: companyId,
            fullName: payload.fullName,
            isDeleted: false,
        });

        if (exists) {
            return res.status(409).json({
                success: false,
                error: { message: "Unit already exists" },
            });
        }

        const doc = await Unit.create(payload);

        res.status(201).json({ success: true, data: doc });
    } catch (err) {
        if (err.code === 11000) {
            return res
                .status(409)
                .json({ success: false, error: { message: "Unit already exists" } });
        }
        next(err);
    }
}

/**
 * UPDATE UNIT
 */
async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.body.accountCompanyName);
        if (!companyId) {
            return res
                .status(400)
                .json({ message: "Valid accountCompanyName (companyId) is required" });
        }

        const id = req.params.id;

        const payload = {
            ...req.body,
            accountCompanyName: companyId,
            updatedBy: req.user.id,
        };

        const doc = await Unit.findOneAndUpdate(
            { _id: id, ownerId, accountCompanyName: companyId },
            payload,
            { new: true, runValidators: true }
        );

        if (!doc) {
            return res
                .status(404)
                .json({ success: false, error: { message: "Not found" } });
        }

        res.json({ success: true, data: doc });
    } catch (err) {
        if (err.code === 11000) {
            return res
                .status(409)
                .json({ success: false, error: { message: "Unit already exists" } });
        }
        next(err);
    }
}

/**
 * DELETE UNIT (SOFT DELETE)
 */
async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res
                .status(400)
                .json({ message: "Valid accountCompanyName (companyId) is required" });
        }

        const doc = await Unit.findOneAndUpdate(
            { _id: req.params.id, ownerId, accountCompanyName: companyId },
            { isDeleted: true, updatedBy: req.user.id },
            { new: true }
        );

        if (!doc) {
            return res
                .status(404)
                .json({ success: false, error: { message: "Not found" } });
        }

        res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove };
