// src/controllers/sale.controller.js
const Sale = require("../models/Sale");
const mongoose = require("mongoose");

/* --------------------- Helpers --------------------- */
function toObjectId(v) {
    if (!v) return null;
    try { return new mongoose.Types.ObjectId(v); }
    catch { return null; }
}

/* --------------------- Compute Totals --------------------- */
function computeTotalsFromItems(items = [], discount = 0, additionalCharges = [], withGst = true, autoRoundOff = true) {
    let taxableAmt = 0, totalGst = 0, totalFinalAmt = 0;

    items.forEach(it => {
        const qty = Number(it.qty) || 0;
        const rate = Number(it.rate) || 0;
        const gstPercent = it.gstPercent != null ? Number(it.gstPercent) : 0;
        const gstType = it.gstType || "Excluded";

        let actual = 0, final = 0;

        if (withGst && gstPercent > 0) {
            if (gstType === "Excluded") {
                actual = qty * rate;
                final = actual + (actual * gstPercent / 100);
            } else {
                final = qty * rate;
                actual = final / (1 + gstPercent / 100);
            }
        } else {
            actual = qty * rate;
            final = actual;
        }

        actual = Number(actual.toFixed(2));
        final = Number(final.toFixed(2));

        taxableAmt += actual;
        totalFinalAmt += final;
        totalGst += (final - actual);
    });

    let subTotal = totalFinalAmt;
    let total = subTotal - (Number(discount) || 0);

    if (Array.isArray(additionalCharges)) {
        additionalCharges.forEach(c => total += Number(c.amount) || 0);
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

/* --------------------- LIST --------------------- */
async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId)
            return res.status(400).json({ success: false, error: { message: "Valid accountCompanyName is required" } });

        const { page = 1, limit = 50, search, sort, fromDate, toDate } = req.query;

        const q = { ownerId, accountCompanyName: companyId, isDeleted: false };

        if (search) {
            const s = search.trim();
            q.$or = [
                { invoiceNumber: { $regex: s, $options: "i" } },
                { customer: { $regex: s, $options: "i" } }
            ];
        }

        // Date filters
        if (fromDate || toDate) {
            q.invoiceDate = {};
            if (fromDate) q.invoiceDate.$gte = new Date(fromDate);
            if (toDate) q.invoiceDate.$lte = new Date(toDate);
        }

        // Sorting
        const sortObj = {};
        if (sort) {
            const [k, d] = sort.split(":");
            sortObj[k || "invoiceDate"] = d === "desc" ? -1 : 1;
        } else {
            sortObj.invoiceDate = -1;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [docs, total] = await Promise.all([
            Sale.find(q).sort(sortObj).skip(skip).limit(Number(limit)),
            Sale.countDocuments(q)
        ]);

        res.json({ success: true, data: docs, meta: { page: Number(page), limit: Number(limit), total } });

    } catch (err) { next(err); }
}

/* --------------------- GET ONE --------------------- */
async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId)
            return res.status(400).json({ success: false, error: { message: "Valid accountCompanyName is required" } });

        const doc = await Sale.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        });

        if (!doc) return res.status(404).json({ success: false, error: { message: "Not found" } });

        res.json({ success: true, data: doc });

    } catch (err) { next(err); }
}

/* --------------------- CREATE --------------------- */
async function create(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.body.accountCompanyName);
        if (!companyId)
            return res.status(400).json({ success: false, error: { message: "Valid accountCompanyName is required" } });

        const payload = {
            ...req.body,
            ownerId,
            accountCompanyName: companyId,
            createdBy: req.user.id
        };

        if (!payload.items || payload.items.length === 0)
            return res.status(400).json({ success: false, error: { message: "Items are required" } });

        if (payload.invoiceDate)
            payload.invoiceDate = new Date(payload.invoiceDate);

        // Normalize items
        payload.items = payload.items.map(it => ({
            itemId: it.itemId || null,
            name: (it.name || it.goodsService || "").toString().trim(),
            description: it.description || "",
            qty: Number(it.qty) || 0,
            rate: Number(it.rate) || 0,
            sellPrice: Number(it.sellPrice || 0),
            gstPercent: it.gstPercent != null ? Number(it.gstPercent) : null,
            gstType: it.gstType || "Excluded",
            hsnNo: it.hsnNo || "",
            unit: it.unit || "",
            actualAmount: Number(it.actualAmount || 0),
            finalAmount: Number(it.finalAmount || 0)
        }));

        payload.additionalCharges = (payload.additionalCharges || []).map(c => ({
            name: c.name,
            amount: Number(c.amount || 0)
        }));

        payload.payments = (payload.payments || []).map(p => ({
            mode: p.mode,
            amount: Number(p.amount || 0),
            refNo: p.refNo || "",
            depositTo: p.depositTo || ""
        }));

        payload.discount = Number(payload.discount || 0);
        payload.withGst = payload.withGst !== undefined ? Boolean(payload.withGst) : true;
        payload.autoRoundOff = payload.autoRoundOff !== undefined ? Boolean(payload.autoRoundOff) : true;

        // Calculate totals
        const totals = computeTotalsFromItems(
            payload.items,
            payload.discount,
            payload.additionalCharges,
            payload.withGst,
            payload.autoRoundOff
        );

        Object.assign(payload, totals);

        const doc = await Sale.create(payload);
        res.status(201).json({ success: true, data: doc });

    } catch (err) {
        if (err?.code === 11000)
            return res.status(409).json({ success: false, error: { message: "Invoice already exists" } });
        next(err);
    }
}

/* --------------------- UPDATE --------------------- */
async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;

        const companyId = toObjectId(req.body.accountCompanyName);
        if (!companyId)
            return res.status(400).json({ success: false, error: { message: "Valid accountCompanyName is required" } });

        const payload = { ...req.body, updatedBy: req.user.id };

        if (payload.invoiceDate)
            payload.invoiceDate = new Date(payload.invoiceDate);

        // Normalize items
        if (payload.items) {
            payload.items = payload.items.map(it => ({
                itemId: it.itemId || null,
                name: (it.name || it.goodsService || "").toString().trim(),
                description: it.description || "",
                qty: Number(it.qty || 0),
                rate: Number(it.rate || 0),
                sellPrice: Number(it.sellPrice || 0),
                gstPercent: it.gstPercent != null ? Number(it.gstPercent) : null,
                gstType: it.gstType || "Excluded",
                hsnNo: it.hsnNo || "",
                unit: it.unit || "",
                actualAmount: Number(it.actualAmount || 0),
                finalAmount: Number(it.finalAmount || 0)
            }));
        }

        // Normalize charges + payments
        if (payload.additionalCharges) {
            payload.additionalCharges = payload.additionalCharges.map(c => ({
                name: c.name,
                amount: Number(c.amount || 0)
            }));
        }

        if (payload.payments) {
            payload.payments = payload.payments.map(p => ({
                mode: p.mode,
                amount: Number(p.amount || 0),
                refNo: p.refNo || "",
                depositTo: p.depositTo || ""
            }));
        }

        payload.discount = payload.discount != null ? Number(payload.discount) : undefined;

        // Fetch existing invoice for totals
        const old = await Sale.findOne({
            _id: id,
            ownerId,
            accountCompanyName: companyId
        });

        if (!old)
            return res.status(404).json({ success: false, error: { message: "Not found" } });

        const totals = computeTotalsFromItems(
            payload.items || old.items,
            payload.discount != null ? payload.discount : old.discount,
            payload.additionalCharges || old.additionalCharges,
            payload.withGst != null ? payload.withGst : old.withGst,
            payload.autoRoundOff != null ? payload.autoRoundOff : old.autoRoundOff
        );

        Object.assign(payload, totals);

        const doc = await Sale.findOneAndUpdate(
            { _id: id, ownerId, accountCompanyName: companyId },
            payload,
            { new: true }
        );

        res.json({ success: true, data: doc });

    } catch (err) {
        if (err?.code === 11000)
            return res.status(409).json({ success: false, error: { message: "Invoice already exists" } });
        next(err);
    }
}

/* --------------------- REMOVE (Soft Delete) --------------------- */
async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId)
            return res.status(400).json({ success: false, error: { message: "Valid accountCompanyName is required" } });

        const updated = await Sale.findOneAndUpdate(
            { _id: req.params.id, ownerId, accountCompanyName: companyId },
            { isDeleted: true, updatedBy: req.user.id },
            { new: true }
        );

        if (!updated)
            return res.status(404).json({ success: false, error: { message: "Not found" } });

        res.json({ success: true, data: updated });

    } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, remove, computeTotalsFromItems };
