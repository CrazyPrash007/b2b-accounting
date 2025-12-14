// src/controllers/gst.controller.js
const Gst = require("../models/Gst");
const mongoose = require("mongoose");

/* ---------------------------- Helpers ---------------------------- */

function toObjectId(id) {
    if (!id) return null;
    try {
        return new mongoose.Types.ObjectId(id);
    } catch (err) {
        return null;
    }
}

/* =========================== LIST =========================== */
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

        // Search by rate
        if (search) {
            const maybeNum = parseFloat(search);
            if (!isNaN(maybeNum)) q.rate = maybeNum;
        }

        // Sorting
        const sortObj = {};
        if (sort) {
            const [k, dir] = sort.split(":");
            sortObj[k || "createdAt"] = dir === "desc" ? -1 : 1;
        } else {
            sortObj.createdAt = -1;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [items, total] = await Promise.all([
            Gst.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Gst.countDocuments(q)
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

/* =========================== GET ONE =========================== */
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

        const doc = await Gst.findOne({
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

/* =========================== CREATE =========================== */
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

        const payload = {
            ...req.body,
            ownerId,
            accountCompanyName,
            createdBy: req.user.id
        };

        if (!payload.rate && payload.rate !== 0) {
            return res.status(400).json({
                success: false,
                error: { message: "rate is required" }
            });
        }

        payload.rate = Number(payload.rate);

        const doc = await Gst.create(payload);

        res.status(201).json({ success: true, data: doc });

    } catch (err) {
        if (err?.code === 11000) {
            return res.status(409).json({
                success: false,
                error: { message: "rate already exists for this company" }
            });
        }
        next(err);
    }
}

/* =========================== UPDATE =========================== */
async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const accountCompanyName = toObjectId(req.body.accountCompanyName);
        if (!accountCompanyName) {
            return res.status(400).json({
                success: false,
                error: { message: "accountCompanyName is required and must be valid" }
            });
        }

        const id = req.params.id;

        const payload = {
            ...req.body,
            updatedBy: req.user.id
        };

        if (payload.rate !== undefined) {
            payload.rate = Number(payload.rate);
        }

        const doc = await Gst.findOneAndUpdate(
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
                error: { message: "rate already exists for this company" }
            });
        }
        next(err);
    }
}

/* =========================== DELETE (SOFT) =========================== */
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

        const doc = await Gst.findOneAndUpdate(
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
