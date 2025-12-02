// src/controllers/unit.controller.js
const Unit = require('../models/Unit');

async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const { page = 1, limit = 50, search, sort } = req.query;
        const q = { ownerId, isDeleted: false };

        if (search) q.fullName = { $regex: search, $options: 'i' };

        const sortObj = {};
        if (sort) {
            const [k, dir] = sort.split(':');
            sortObj[k || 'createdAt'] = dir === 'desc' ? -1 : 1;
        } else {
            sortObj.createdAt = -1;
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [items, total] = await Promise.all([
            Unit.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Unit.countDocuments(q),
        ]);

        res.json({ success: true, data: items, meta: { page: Number(page), limit: Number(limit), total } });
    } catch (err) {
        next(err);
    }
}

async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const doc = await Unit.findOne({ _id: req.params.id, ownerId, isDeleted: false });
        if (!doc) return res.status(404).json({ success: false, error: { message: 'Not found' } });
        res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

async function create(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const payload = { ...req.body, ownerId, createdBy: req.user.id };
        const doc = await Unit.create(payload);
        res.status(201).json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;
        const payload = { ...req.body, updatedBy: req.user.id };
        const doc = await Unit.findOneAndUpdate({ _id: id, ownerId }, payload, { new: true });
        if (!doc) return res.status(404).json({ success: false, error: { message: 'Not found' } });
        res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;
        const doc = await Unit.findOneAndUpdate({ _id: id, ownerId }, { isDeleted: true }, { new: true });
        if (!doc) return res.status(404).json({ success: false, error: { message: 'Not found' } });
        res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove };
