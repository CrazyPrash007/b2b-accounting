// src/controllers/purchase.controller.js
const Purchase = require('../models/Purchase');

/**
 * All controllers enforce owner scoping: ownerId is taken from req.user.ownerId
 */

async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const { page = 1, limit = 50, search, sort, fromDate, toDate, withGst, isPaid } = req.query;
        const q = { ownerId, isDeleted: false };

        // text search on supplier, invoiceNumber, supplierInvoiceNumber
        if (search) {
            q.$or = [
                { supplier: { $regex: search, $options: 'i' } },
                { invoiceNumber: { $regex: search, $options: 'i' } },
                { supplierInvoiceNumber: { $regex: search, $options: 'i' } },
            ];
        }

        if (typeof withGst !== 'undefined') {
            if (withGst === 'true' || withGst === '1') q.withGst = true;
            else if (withGst === 'false' || withGst === '0') q.withGst = false;
        }

        if (typeof isPaid !== 'undefined') {
            if (isPaid === 'true' || isPaid === '1') q.isPaymentMade = true;
            else if (isPaid === 'false' || isPaid === '0') q.isPaymentMade = false;
        }

        if (fromDate || toDate) {
            q.invoiceDate = {};
            if (fromDate) q.invoiceDate.$gte = new Date(fromDate);
            if (toDate) q.invoiceDate.$lte = new Date(toDate);
            if (Object.keys(q.invoiceDate).length === 0) delete q.invoiceDate;
        }

        const sortObj = {};
        if (sort) {
            const [k, dir] = sort.split(':');
            sortObj[k || 'createdAt'] = dir === 'desc' ? -1 : 1;
        } else {
            sortObj.createdAt = -1;
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [docs, total] = await Promise.all([
            Purchase.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Purchase.countDocuments(q),
        ]);

        res.json({ success: true, data: docs, meta: { page: Number(page), limit: Number(limit), total } });
    } catch (err) {
        next(err);
    }
}

async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const doc = await Purchase.findOne({ _id: req.params.id, ownerId, isDeleted: false });
        if (!doc) return res.status(404).json({ success: false, error: { message: 'Not found' } });
        res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

async function create(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const payload = {
            ...req.body,
            ownerId,
            createdBy: req.user.id,
        };

        // If incoming items use goodsService (old client), map to name (canonical)
        if (Array.isArray(payload.items)) {
            payload.items = payload.items.map(it => {
                const copy = { ...it };
                // prefer explicit name, fall back to goodsService
                copy.name = (copy.name && copy.name.toString().trim()) ? copy.name.toString() : (copy.goodsService ? copy.goodsService.toString() : '');
                // keep goodsService populated for backward compatibility
                copy.goodsService = copy.name;
                return copy;
            });
        }

        // Coerce numbers and dates
        if (payload.invoiceDate) payload.invoiceDate = new Date(payload.invoiceDate);
        if (payload.supplierInvoiceDate) payload.supplierInvoiceDate = new Date(payload.supplierInvoiceDate);

        payload.totalAmount = payload.totalAmount != null ? Number(payload.totalAmount) : 0;
        payload.taxableAmount = payload.taxableAmount != null ? Number(payload.taxableAmount) : 0;
        payload.gstAmount = payload.gstAmount != null ? Number(payload.gstAmount) : 0;
        payload.discount = payload.discount != null ? Number(payload.discount) : 0;
        payload.paymentAmount = payload.paymentAmount != null ? Number(payload.paymentAmount) : 0;

        // normalize items array numbers (and ensure name/goodsService exist)
        if (Array.isArray(payload.items)) {
            payload.items = payload.items.map(it => {
                const copy = { ...it };
                // ensure canonical name exists
                copy.name = (copy.name && copy.name.toString().trim()) ? copy.name.toString() : (copy.goodsService ? copy.goodsService.toString() : '');
                copy.goodsService = copy.name;
                copy.qty = copy.qty != null && copy.qty !== '' ? Number(copy.qty) : 0;
                copy.rate = copy.rate != null && copy.rate !== '' ? Number(copy.rate) : 0;
                copy.gstPercent = copy.gstPercent != null && copy.gstPercent !== '' ? Number(copy.gstPercent) : 0;
                copy.actualAmount = copy.actualAmount != null && copy.actualAmount !== '' ? Number(copy.actualAmount) : 0;
                copy.finalAmount = copy.finalAmount != null && copy.finalAmount !== '' ? Number(copy.finalAmount) : 0;
                return copy;
            });
        } else {
            payload.items = [];
        }

        if (Array.isArray(payload.additionalCharges)) {
            payload.additionalCharges = payload.additionalCharges.map(c => ({ name: c.name || '', amount: c.amount != null ? Number(c.amount) : 0 }));
        }

        if (Array.isArray(payload.payments)) {
            payload.payments = payload.payments.map(p => ({ mode: p.mode || '', amount: p.amount != null ? Number(p.amount) : 0 }));
        }

        const doc = await Purchase.create(payload);
        res.status(201).json({ success: true, data: doc });
    } catch (err) {
        if (err && err.code === 11000) {
            return res.status(409).json({ success: false, error: { message: "Purchase with same invoice number already exists" } });
        }
        next(err);
    }
}

async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;
        const payload = { ...req.body, updatedBy: req.user.id };

        // If incoming items use goodsService (old client), map to name (canonical)
        if (Array.isArray(payload.items)) {
            payload.items = payload.items.map(it => {
                const copy = { ...it };
                copy.name = (copy.name && copy.name.toString().trim()) ? copy.name.toString() : (copy.goodsService ? copy.goodsService.toString() : '');
                copy.goodsService = copy.name;
                return copy;
            });
        }

        if (payload.invoiceDate) payload.invoiceDate = new Date(payload.invoiceDate);
        if (payload.supplierInvoiceDate) payload.supplierInvoiceDate = new Date(payload.supplierInvoiceDate);

        if (payload.totalAmount != null) payload.totalAmount = Number(payload.totalAmount);
        if (payload.taxableAmount != null) payload.taxableAmount = Number(payload.taxableAmount);
        if (payload.gstAmount != null) payload.gstAmount = Number(payload.gstAmount);
        if (payload.discount != null) payload.discount = Number(payload.discount);
        if (payload.paymentAmount != null) payload.paymentAmount = Number(payload.paymentAmount);

        if (Array.isArray(payload.items)) {
            payload.items = payload.items.map(it => {
                const copy = { ...it };
                // maintain canonical name + goodsService
                copy.name = (copy.name && copy.name.toString().trim()) ? copy.name.toString() : (copy.goodsService ? copy.goodsService.toString() : '');
                copy.goodsService = copy.name;
                copy.qty = copy.qty != null && copy.qty !== '' ? Number(copy.qty) : 0;
                copy.rate = copy.rate != null && copy.rate !== '' ? Number(copy.rate) : 0;
                copy.gstPercent = copy.gstPercent != null && copy.gstPercent !== '' ? Number(copy.gstPercent) : 0;
                copy.actualAmount = copy.actualAmount != null && copy.actualAmount !== '' ? Number(copy.actualAmount) : 0;
                copy.finalAmount = copy.finalAmount != null && copy.finalAmount !== '' ? Number(copy.finalAmount) : 0;
                return copy;
            });
        }

        if (Array.isArray(payload.additionalCharges)) {
            payload.additionalCharges = payload.additionalCharges.map(c => ({ name: c.name || '', amount: c.amount != null ? Number(c.amount) : 0 }));
        }

        if (Array.isArray(payload.payments)) {
            payload.payments = payload.payments.map(p => ({ mode: p.mode || '', amount: p.amount != null ? Number(p.amount) : 0 }));
        }

        const doc = await Purchase.findOneAndUpdate({ _id: id, ownerId }, payload, { new: true });
        if (!doc) return res.status(404).json({ success: false, error: { message: 'Not found' } });
        res.json({ success: true, data: doc });
    } catch (err) {
        if (err && err.code === 11000) {
            return res.status(409).json({ success: false, error: { message: "Purchase with same invoice number already exists" } });
        }
        next(err);
    }
}

async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;
        const doc = await Purchase.findOneAndUpdate({ _id: id, ownerId }, { isDeleted: true, updatedBy: req.user.id }, { new: true });
        if (!doc) return res.status(404).json({ success: false, error: { message: 'Not found' } });
        res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove };
