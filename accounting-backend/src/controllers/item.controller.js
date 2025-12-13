// src/controllers/item.controller.js
const Item = require('../models/Item');

/**
 * Multi-company + owner-based scoping.
 * Requires: ownerId from auth middleware AND accountCompanyName from body/query.
 */

async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const accountCompanyName = req.query.accountCompanyName;

        if (!accountCompanyName) {
            return res.status(400).json({ message: "accountCompanyName is required" });
        }

        const { page = 1, limit = 50, search, sort, category, brand } = req.query;

        const q = { ownerId, accountCompanyName, isDeleted: false };

        // search by itemName, name, hsnNo
        if (search) {
            q.$or = [
                { name: { $regex: search, $options: 'i' } },
                { itemName: { $regex: search, $options: 'i' } },
                { hsnNo: { $regex: search, $options: 'i' } },
            ];
        }

        if (category) q.category = category;
        if (brand) q.brandName = brand;

        const sortObj = {};
        if (sort) {
            const [k, dir] = sort.split(':');
            sortObj[k || 'createdAt'] = dir === 'desc' ? -1 : 1;
        } else {
            sortObj.createdAt = -1;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [items, total] = await Promise.all([
            Item.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Item.countDocuments(q),
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

        const doc = await Item.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName,
            isDeleted: false
        });

        if (!doc) {
            return res.status(404).json({ success: false, error: { message: 'Not found' } });
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
            createdBy: req.user.id,
            accountCompanyName: req.body.accountCompanyName,
            name: req.body.name || req.body.itemName || ""
        };

        // number coercions
        if (payload.gstRate != null) payload.gstRate = Number(payload.gstRate);
        if (payload.buyPrice != null) payload.buyPrice = Number(payload.buyPrice);
        if (payload.sellPrice != null) payload.sellPrice = Number(payload.sellPrice);
        if (payload.openingStock != null) payload.openingStock = Number(payload.openingStock);
        if (payload.minStock != null) payload.minStock = Number(payload.minStock);
        if (payload.openingDate) payload.openingDate = new Date(payload.openingDate);

        const doc = await Item.create(payload);
        return res.status(201).json({ success: true, data: doc });

    } catch (err) {
        if (err && err.code === 11000) {
            return res.status(409).json({ success: false, error: { message: "Item with same name already exists" } });
        }
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

        const payload = { ...req.body, updatedBy: req.user.id };

        // number coercions
        if (payload.gstRate != null) payload.gstRate = Number(payload.gstRate);
        if (payload.buyPrice != null) payload.buyPrice = Number(payload.buyPrice);
        if (payload.sellPrice != null) payload.sellPrice = Number(payload.sellPrice);
        if (payload.openingStock != null) payload.openingStock = Number(payload.openingStock);
        if (payload.minStock != null) payload.minStock = Number(payload.minStock);
        if (payload.openingDate) payload.openingDate = new Date(payload.openingDate);

        // sync canonical name
        if (payload.itemName && !payload.name) payload.name = payload.itemName;

        const doc = await Item.findOneAndUpdate(
            { _id: id, ownerId, accountCompanyName: req.body.accountCompanyName },
            payload,
            { new: true, runValidators: true }
        );

        if (!doc) {
            return res.status(404).json({ success: false, error: { message: 'Not found' } });
        }

        return res.json({ success: true, data: doc });

    } catch (err) {
        if (err && err.code === 11000) {
            return res.status(409).json({ success: false, error: { message: "Item with same name already exists" } });
        }
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

        const doc = await Item.findOneAndUpdate(
            { _id: req.params.id, ownerId, accountCompanyName },
            { isDeleted: true, updatedBy: req.user.id },
            { new: true }
        );

        if (!doc) {
            return res.status(404).json({ success: false, error: { message: 'Not found' } });
        }

        return res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove };
