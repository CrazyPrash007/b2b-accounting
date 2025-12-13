// src/controllers/purchase.controller.js
const Purchase = require('../models/Purchase');

/**
 * Purchase Controller with Multi-Company Support
 * - Requires accountCompanyName for all list/get/update/delete
 * - Create stores accountCompanyName inside document
 */

async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const accountCompanyName = req.query.accountCompanyName;

        if (!accountCompanyName) {
            return res.status(400).json({ message: "accountCompanyName is required" });
        }

        const { page = 1, limit = 50, search, sort, fromDate, toDate, withGst, isPaid } = req.query;

        const q = { ownerId, accountCompanyName, isDeleted: false };

        // Search filters
        if (search) {
            q.$or = [
                { supplier: { $regex: search, $options: 'i' } },
                { invoiceNumber: { $regex: search, $options: 'i' } },
                { supplierInvoiceNumber: { $regex: search, $options: 'i' } }
            ];
        }

        // GST filter
        if (withGst === "true") q.withGst = true;
        if (withGst === "false") q.withGst = false;

        // Payment filter
        if (isPaid === "true") q.isPaymentMade = true;
        if (isPaid === "false") q.isPaymentMade = false;

        // Date range
        if (fromDate || toDate) {
            q.invoiceDate = {};
            if (fromDate) q.invoiceDate.$gte = new Date(fromDate);
            if (toDate) q.invoiceDate.$lte = new Date(toDate);
            if (Object.keys(q.invoiceDate).length === 0) delete q.invoiceDate;
        }

        // Sort
        const sortObj = {};
        if (sort) {
            const [k, dir] = sort.split(":");
            sortObj[k || "createdAt"] = dir === "desc" ? -1 : 1;
        } else {
            sortObj.createdAt = -1;
        }

        // Pagination
        const skip = (Number(page) - 1) * Number(limit);

        const [docs, total] = await Promise.all([
            Purchase.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Purchase.countDocuments(q)
        ]);

        res.json({
            success: true,
            data: docs,
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

        const doc = await Purchase.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName,
            isDeleted: false
        });

        if (!doc) {
            return res.status(404).json({ success: false, error: { message: "Not found" } });
        }

        res.json({ success: true, data: doc });

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
            accountCompanyName: req.body.accountCompanyName,
            createdBy: req.user.id
        };

        // Dates
        if (payload.invoiceDate) payload.invoiceDate = new Date(payload.invoiceDate);
        if (payload.supplierInvoiceDate) payload.supplierInvoiceDate = new Date(payload.supplierInvoiceDate);

        // Numbers
        const numFields = ["totalAmount", "taxableAmount", "gstAmount", "discount", "paymentAmount"];
        numFields.forEach(f => {
            if (payload[f] != null) payload[f] = Number(payload[f]);
        });

        // Normalize items array
        if (Array.isArray(payload.items)) {
            payload.items = payload.items.map(it => {
                const x = { ...it };
                x.name = x.name?.trim() || x.goodsService?.trim() || "";
                x.goodsService = x.name;
                x.qty = Number(x.qty || 0);
                x.rate = Number(x.rate || 0);
                x.gstPercent = Number(x.gstPercent || 0);
                x.actualAmount = Number(x.actualAmount || 0);
                x.finalAmount = Number(x.finalAmount || 0);
                return x;
            });
        } else {
            payload.items = [];
        }

        // Additional charges
        if (Array.isArray(payload.additionalCharges)) {
            payload.additionalCharges = payload.additionalCharges.map(c => ({
                name: c.name || "",
                amount: Number(c.amount || 0)
            }));
        }

        // Payments
        if (Array.isArray(payload.payments)) {
            payload.payments = payload.payments.map(p => ({
                mode: p.mode || "",
                amount: Number(p.amount || 0)
            }));
        }

        const doc = await Purchase.create(payload);
        res.status(201).json({ success: true, data: doc });

    } catch (err) {
        if (err?.code === 11000) {
            return res.status(409).json({ success: false, error: { message: "Purchase with same invoice number already exists" } });
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
        const payload = {
            ...req.body,
            updatedBy: req.user.id
        };

        // Dates
        if (payload.invoiceDate) payload.invoiceDate = new Date(payload.invoiceDate);
        if (payload.supplierInvoiceDate) payload.supplierInvoiceDate = new Date(payload.supplierInvoiceDate);

        // Numbers
        const numFields = ["totalAmount", "taxableAmount", "gstAmount", "discount", "paymentAmount"];
        numFields.forEach(f => {
            if (payload[f] != null) payload[f] = Number(payload[f]);
        });

        // Normalize items
        if (Array.isArray(payload.items)) {
            payload.items = payload.items.map(it => {
                const x = { ...it };
                x.name = x.name?.trim() || x.goodsService?.trim() || "";
                x.goodsService = x.name;
                x.qty = Number(x.qty || 0);
                x.rate = Number(x.rate || 0);
                x.gstPercent = Number(x.gstPercent || 0);
                x.actualAmount = Number(x.actualAmount || 0);
                x.finalAmount = Number(x.finalAmount || 0);
                return x;
            });
        }

        // Additional charges
        if (Array.isArray(payload.additionalCharges)) {
            payload.additionalCharges = payload.additionalCharges.map(c => ({
                name: c.name || "",
                amount: Number(c.amount || 0)
            }));
        }

        // Payments
        if (Array.isArray(payload.payments)) {
            payload.payments = payload.payments.map(p => ({
                mode: p.mode || "",
                amount: Number(p.amount || 0)
            }));
        }

        const doc = await Purchase.findOneAndUpdate(
            { _id: id, ownerId, accountCompanyName: req.body.accountCompanyName },
            payload,
            { new: true }
        );

        if (!doc) {
            return res.status(404).json({ success: false, error: { message: "Not found" } });
        }

        res.json({ success: true, data: doc });

    } catch (err) {
        if (err?.code === 11000) {
            return res.status(409).json({ success: false, error: { message: "Purchase with same invoice number already exists" } });
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

        const doc = await Purchase.findOneAndUpdate(
            { _id: req.params.id, ownerId, accountCompanyName },
            { isDeleted: true, updatedBy: req.user.id },
            { new: true }
        );

        if (!doc) {
            return res.status(404).json({ success: false, error: { message: "Not found" } });
        }

        res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove };
