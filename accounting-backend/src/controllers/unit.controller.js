// src/controllers/unit.controller.js
const Unit = require('../models/Unit');

/**
 * All controllers enforce:
 * - owner scoping via req.user.ownerId
 * - company scoping via accountCompanyName
 */

async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const accountCompanyName = req.query.accountCompanyName;

        if (!accountCompanyName) {
            return res.status(400).json({ message: "accountCompanyName is required" });
        }

        const { page = 1, limit = 50, search, sort } = req.query;

        const q = { ownerId, accountCompanyName, isDeleted: false };

        if (search) {
            q.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { shortName: { $regex: search, $options: 'i' } }
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

        return res.json({
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
            return res.status(400).json({ message: "accountCompanyName is required" });
        }

        const doc = await Unit.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName,
            isDeleted: false
        });

        if (!doc) {
            return res.status(404).json({ success: false, error: { message: "Not found" } });
        }

        return res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

async function create(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        if (!req.body.accountCompanyName) {
            return res.status(400).json({ message: "accountCompanyName is required" });
        }

        const payload = {
            ...req.body,
            ownerId,
            createdBy: req.user.id
        };

        const doc = await Unit.create(payload);
        return res.status(201).json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        if (!req.body.accountCompanyName) {
            return res.status(400).json({ message: "accountCompanyName is required" });
        }

        const id = req.params.id;

        const payload = {
            ...req.body,
            updatedBy: req.user.id
        };

        const doc = await Unit.findOneAndUpdate(
            { _id: id, ownerId, accountCompanyName: req.body.accountCompanyName },
            payload,
            { new: true, runValidators: true }
        );

        if (!doc) {
            return res.status(404).json({ success: false, error: { message: "Not found" } });
        }

        return res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const accountCompanyName = req.query.accountCompanyName;

        if (!accountCompanyName) {
            return res.status(400).json({ message: "accountCompanyName is required" });
        }

        const doc = await Unit.findOneAndUpdate(
            { _id: req.params.id, ownerId, accountCompanyName },
            { isDeleted: true, updatedBy: req.user.id },
            { new: true }
        );

        if (!doc) {
            return res.status(404).json({ success: false, error: { message: "Not found" } });
        }

        return res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove };
