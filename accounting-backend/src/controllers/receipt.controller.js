// src/controllers/receipt.controller.js
const Receipt = require('../models/Receipt');

/**
 * Controllers enforce owner scoping: ownerId is taken from req.user.ownerId
 */

async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const { page = 1, limit = 50, search, sort, fromDate, toDate } = req.query;
        const q = { ownerId, isDeleted: false };

        // search by party name or referenceNumber
        if (search) {
            q.$or = [
                { party: { $regex: search, $options: 'i' } },
                { referenceNumber: { $regex: search, $options: 'i' } },
                { invoiceLabel: { $regex: search, $options: 'i' } },
            ];
        }

        if (fromDate || toDate) {
            q.date = {};
            if (fromDate) q.date.$gte = new Date(fromDate);
            if (toDate) q.date.$lte = new Date(toDate);
            if (Object.keys(q.date).length === 0) delete q.date;
        }

        const sortObj = {};
        if (sort) {
            const [k, dir] = sort.split(':');
            sortObj[k || 'date'] = dir === 'desc' ? -1 : 1;
        } else {
            sortObj.date = -1;
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [docs, total] = await Promise.all([
            Receipt.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Receipt.countDocuments(q),
        ]);

        res.json({ success: true, data: docs, meta: { page: Number(page), limit: Number(limit), total } });
    } catch (err) {
        next(err);
    }
}

async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const doc = await Receipt.findOne({ _id: req.params.id, ownerId, isDeleted: false });
        if (!doc) return res.status(404).json({ success: false, error: { message: 'Not found' } });
        res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

async function create(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        // Accept payload from client
        const payload = {
            ...req.body,
            ownerId,
            createdBy: req.user.id,
        };

        // Normalize types
        if (payload.date) payload.date = new Date(payload.date);
        payload.amount = payload.amount != null ? Number(payload.amount) : 0;

        // Ensure strings exist
        payload.party = payload.party ? String(payload.party) : '';
        payload.paymentMethod = payload.paymentMethod ? String(payload.paymentMethod) : 'Cash';
        payload.referenceNumber = payload.referenceNumber ? String(payload.referenceNumber) : '';
        payload.description = payload.description ? String(payload.description) : '';
        payload.invoiceLabel = payload.invoiceLabel ? String(payload.invoiceLabel) : '';

        // Normalize optional ids
        if (!payload.partyId) payload.partyId = null;
        if (!payload.invoiceId) payload.invoiceId = null;

        const doc = await Receipt.create(payload);
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

        if (payload.date) payload.date = new Date(payload.date);
        if (payload.amount != null) payload.amount = Number(payload.amount);

        // normalize optional strings/ids
        if (payload.party !== undefined) payload.party = payload.party ? String(payload.party) : '';
        if (payload.paymentMethod !== undefined) payload.paymentMethod = payload.paymentMethod ? String(payload.paymentMethod) : 'Cash';
        if (payload.referenceNumber !== undefined) payload.referenceNumber = payload.referenceNumber ? String(payload.referenceNumber) : '';
        if (payload.description !== undefined) payload.description = payload.description ? String(payload.description) : '';
        if (payload.invoiceLabel !== undefined) payload.invoiceLabel = payload.invoiceLabel ? String(payload.invoiceLabel) : '';

        if (payload.partyId === '' || payload.partyId == null) payload.partyId = null;
        if (payload.invoiceId === '' || payload.invoiceId == null) payload.invoiceId = null;

        const doc = await Receipt.findOneAndUpdate({ _id: id, ownerId }, payload, { new: true });
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
        const doc = await Receipt.findOneAndUpdate({ _id: id, ownerId }, { isDeleted: true, updatedBy: req.user.id }, { new: true });
        if (!doc) return res.status(404).json({ success: false, error: { message: 'Not found' } });
        res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove };
