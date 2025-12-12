// src/controllers/sale.controller.js
const Sale = require('../models/Sale');

/**
 * Compute totals
 */
function computeTotalsFromItems(items = [], discount = 0, additionalCharges = [], withGst = true, autoRoundOff = true) {
    let taxableAmt = 0, totalGst = 0, totalFinalAmt = 0;

    items.forEach(it => {
        const qty = Number(it.qty) || 0;
        const rate = Number(it.rate) || 0;
        const gstPercent = (it.gstPercent != null && it.gstPercent !== '') ? Number(it.gstPercent) : 0;
        const gstType = it.gstType || 'Excluded';

        let actualAmount = 0;
        let finalAmount = 0;

        if (withGst && gstPercent > 0) {
            if (gstType === 'Excluded') {
                actualAmount = qty * rate;
                finalAmount = actualAmount + (actualAmount * gstPercent / 100);
            } else {
                finalAmount = qty * rate;
                actualAmount = finalAmount / (1 + gstPercent / 100);
            }
        } else {
            actualAmount = qty * rate;
            finalAmount = actualAmount;
        }

        actualAmount = Number(actualAmount.toFixed(2));
        finalAmount = Number(finalAmount.toFixed(2));

        taxableAmt += actualAmount;
        totalFinalAmt += finalAmount;
        totalGst += (finalAmount - actualAmount);
    });

    let subTotal = totalFinalAmt;
    let total = subTotal - (Number(discount) || 0);

    if (Array.isArray(additionalCharges)) {
        additionalCharges.forEach(c => {
            total += Number(c.amount) || 0;
        });
    }

    if (autoRoundOff) total = Math.round(total);
    else total = Number(total.toFixed(2));

    return {
        taxableAmount: Number(taxableAmt.toFixed(2)),
        gstAmount: Number(totalGst.toFixed(2)),
        subTotal: Number(subTotal.toFixed(2)),
        totalAmount: total
    };
}

async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const { page = 1, limit = 50, search, sort, fromDate, toDate, accountCompanyName } = req.query;

        const q = { ownerId, isDeleted: false };

        if (accountCompanyName) {
            q.accountCompanyName = accountCompanyName;
        }

        if (search) {
            q.$or = [
                { invoiceNumber: { $regex: search, $options: 'i' } },
                { customer: { $regex: search, $options: 'i' } },
            ];
        }

        if (fromDate || toDate) {
            q.invoiceDate = {};
            if (fromDate) q.invoiceDate.$gte = new Date(fromDate);
            if (toDate) q.invoiceDate.$lte = new Date(toDate);
        }

        const sortObj = {};
        if (sort) {
            const [k, dir] = sort.split(':');
            sortObj[k || 'invoiceDate'] = dir === 'desc' ? -1 : 1;
        } else {
            sortObj.invoiceDate = -1;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [docs, total] = await Promise.all([
            Sale.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Sale.countDocuments(q),
        ]);

        res.json({ success: true, data: docs, meta: { page: Number(page), limit: Number(limit), total } });
    } catch (err) {
        next(err);
    }
}


async function getOne(req, res, next) {
    try {
        const doc = await Sale.findOne({
            _id: req.params.id,
            ownerId: req.user.ownerId,
            isDeleted: false
        });

        if (!doc) return res.status(404).json({ success: false, error: { message: "Not found" } });

        res.json({ success: true, data: doc });
    } catch (err) { next(err); }
}

async function create(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const payload = { ...req.body };

        // REQUIRED business/company name
        payload.accountCompanyName = req.body.accountCompanyName;
        payload.ownerId = ownerId;
        payload.createdBy = req.user.id;

        if (payload.invoiceDate) payload.invoiceDate = new Date(payload.invoiceDate);

        if (!Array.isArray(payload.items) || payload.items.length === 0) {
            return res.status(400).json({ success: false, error: { message: 'Items are required' } });
        }

        payload.items = payload.items.map(it => ({
            itemId: it.itemId || null,
            name: (it.goodsService || it.name || '').toString(),
            description: it.description || '',
            qty: Number(it.qty) || 0,
            rate: Number(it.rate) || 0,
            sellPrice: it.sellPrice != null ? Number(it.sellPrice) : it.sellPrice,
            gstPercent: (it.gstPercent != null && it.gstPercent !== '') ? Number(it.gstPercent) : null,
            gstType: it.gstType || 'Excluded',
            hsnNo: it.hsnNo || '',
            unit: it.unit || '',
            actualAmount: it.actualAmount != null ? Number(it.actualAmount) : null,
            finalAmount: it.finalAmount != null ? Number(it.finalAmount) : null,
        }));

        payload.additionalCharges = Array.isArray(payload.additionalCharges)
            ? payload.additionalCharges.map(c => ({ name: c.name, amount: Number(c.amount) || 0 }))
            : [];

        payload.payments = Array.isArray(payload.payments)
            ? payload.payments.map(p => ({
                mode: p.mode,
                amount: Number(p.amount) || 0,
                refNo: p.refNo || '',
                depositTo: p.depositTo || ''
            }))
            : [];

        payload.discount = Number(payload.discount) || 0;
        payload.withGst = payload.withGst !== undefined ? Boolean(payload.withGst) : true;
        payload.autoRoundOff = payload.autoRoundOff !== undefined ? Boolean(payload.autoRoundOff) : true;

        // Compute totals
        const totals = computeTotalsFromItems(
            payload.items,
            payload.discount,
            payload.additionalCharges,
            payload.withGst,
            payload.autoRoundOff
        );

        payload.taxableAmount = totals.taxableAmount;
        payload.gstAmount = totals.gstAmount;
        payload.subTotal = totals.subTotal;
        payload.totalAmount = totals.totalAmount;

        const doc = await Sale.create(payload);
        res.status(201).json({ success: true, data: doc });
    } catch (err) {
        if (err && err.code === 11000) {
            return res.status(409).json({
                success: false,
                error: { message: 'Invoice with same identifier already exists' }
            });
        }
        next(err);
    }
}


async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;
        const payload = { ...req.body, updatedBy: req.user.id };

        // Allow updating company name
        if (payload.accountCompanyName !== undefined) {
            payload.accountCompanyName = String(payload.accountCompanyName);
        }

        if (payload.invoiceDate) payload.invoiceDate = new Date(payload.invoiceDate);

        if (payload.items) {
            payload.items = payload.items.map(it => ({
                itemId: it.itemId || null,
                name: (it.goodsService || it.name || '').toString(),
                description: it.description || '',
                qty: Number(it.qty) || 0,
                rate: Number(it.rate) || 0,
                sellPrice: it.sellPrice != null ? Number(it.sellPrice) : it.sellPrice,
                gstPercent: (it.gstPercent != null && it.gstPercent !== '') ? Number(it.gstPercent) : null,
                gstType: it.gstType || 'Excluded',
                hsnNo: it.hsnNo || '',
                unit: it.unit || '',
                actualAmount: it.actualAmount != null ? Number(it.actualAmount) : null,
                finalAmount: it.finalAmount != null ? Number(it.finalAmount) : null,
            }));
        }

        if (payload.additionalCharges) {
            payload.additionalCharges = payload.additionalCharges.map(c => ({
                name: c.name,
                amount: Number(c.amount) || 0
            }));
        }

        if (payload.payments) {
            payload.payments = payload.payments.map(p => ({
                mode: p.mode,
                amount: Number(p.amount) || 0,
                refNo: p.refNo || '',
                depositTo: p.depositTo || ''
            }));
        }

        payload.discount = payload.discount != null ? Number(payload.discount) : undefined;
        payload.withGst = payload.withGst !== undefined ? Boolean(payload.withGst) : undefined;
        payload.autoRoundOff = payload.autoRoundOff !== undefined ? Boolean(payload.autoRoundOff) : undefined;

        const existing = await Sale.findOne({ _id: id, ownerId });
        if (!existing) {
            return res.status(404).json({ success: false, error: { message: 'Not found' } });
        }

        // Recompute totals
        const totals = computeTotalsFromItems(
            payload.items || existing.items,
            payload.discount != null ? payload.discount : existing.discount,
            payload.additionalCharges != null ? payload.additionalCharges : existing.additionalCharges,
            payload.withGst != null ? payload.withGst : existing.withGst,
            payload.autoRoundOff != null ? payload.autoRoundOff : existing.autoRoundOff
        );

        payload.taxableAmount = totals.taxableAmount;
        payload.gstAmount = totals.gstAmount;
        payload.subTotal = totals.subTotal;
        payload.totalAmount = totals.totalAmount;

        const doc = await Sale.findOneAndUpdate({ _id: id, ownerId }, payload, { new: true });
        if (!doc) {
            return res.status(404).json({ success: false, error: { message: 'Not found' } });
        }

        res.json({ success: true, data: doc });
    } catch (err) {
        if (err && err.code === 11000) {
            return res.status(409).json({ success: false, error: { message: 'Invoice with same identifier already exists' } });
        }
        next(err);
    }
}


async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const updated = await Sale.findOneAndUpdate(
            { _id: req.params.id, ownerId },
            { isDeleted: true, updatedBy: req.user.id },
            { new: true }
        );

        if (!updated)
            return res.status(404).json({ success: false, error: { message: "Not found" } });

        res.json({ success: true, data: updated });
    } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, remove, computeTotalsFromItems };
