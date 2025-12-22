// src/controllers/purchase.controller.js
const Purchase = require("../models/Purchase");
const Payment = require("../models/Payment");
const Vendor = require("../models/Vendor");
const { getCompanyModel } = require("../models/Company");
const { generatePurchaseInvoicePDF } = require("../utils/pdfGenerator");
const mongoose = require("mongoose");

/* ---------------- HELPERS ---------------- */
function toObjectId(id) {
    if (!id) return null;
    try { return new mongoose.Types.ObjectId(id); }
    catch { return null; }
}

/* ---------------- LIST ---------------- */
async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId)
            return res.status(400).json({ success: false, message: "Valid accountCompanyName is required" });

        const {
            page = 1,
            limit = 50,
            search,
            sort,
            fromDate,
            toDate,
            withGst,
            isPaid
        } = req.query;

        const q = { ownerId, accountCompanyName: companyId, isDeleted: false };

        if (search) {
            q.$or = [
                { supplier: { $regex: search, $options: "i" } },
                { invoiceNumber: { $regex: search, $options: "i" } },
                { supplierInvoiceNumber: { $regex: search, $options: "i" } }
            ];
        }

        if (withGst === "true") q.withGst = true;
        if (withGst === "false") q.withGst = false;

        if (isPaid === "true") q.isPaymentMade = true;
        if (isPaid === "false") q.isPaymentMade = false;

        if (fromDate || toDate) {
            q.invoiceDate = {};
            if (fromDate) q.invoiceDate.$gte = new Date(fromDate);
            if (toDate) q.invoiceDate.$lte = new Date(toDate);
        }

        const sortObj = {};
        if (sort) {
            const [k, dir] = sort.split(":");
            sortObj[k || "createdAt"] = dir === "desc" ? -1 : 1;
        } else sortObj.createdAt = -1;

        const skip = (Number(page) - 1) * Number(limit);

        const [docs, total] = await Promise.all([
            Purchase.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Purchase.countDocuments(q)
        ]);

        res.json({ success: true, data: docs, meta: { page: Number(page), limit: Number(limit), total } });

    } catch (err) { next(err); }
}

/* ---------------- GET ONE ---------------- */
async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const companyId = toObjectId(req.query.accountCompanyName);

        if (!companyId)
            return res.status(400).json({ success: false, message: "Valid accountCompanyName is required" });

        const doc = await Purchase.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        });

        if (!doc) return res.status(404).json({ success: false, error: { message: "Not found" } });

        res.json({ success: true, data: doc });

    } catch (err) { next(err); }
}

/* ---------------- COMMON ITEM NORMALIZER ---------------- */
function normalizePurchaseItems(items = []) {
    return items.map(it => {
        const x = { ...it };
        x.name = (x.name || x.goodsService || "").toString().trim();
        x.goodsService = x.name;
        x.qty = Number(x.qty || 0);
        x.rate = Number(x.rate || 0);
        x.gstPercent = Number(x.gstPercent || 0);
        x.actualAmount = Number(x.actualAmount || 0);
        x.finalAmount = Number(x.finalAmount || 0);
        return x;
    });
}

/* ---------------- CREATE ---------------- */
async function create(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.body.accountCompanyName);
        if (!companyId)
            return res.status(400).json({ message: "Valid accountCompanyName is required" });

        const payload = {
            ...req.body,
            ownerId,
            accountCompanyName: companyId,
            createdBy: req.user.id
        };

        if (payload.invoiceDate) payload.invoiceDate = new Date(payload.invoiceDate);
        if (payload.supplierInvoiceDate) payload.supplierInvoiceDate = new Date(payload.supplierInvoiceDate);

        const numFields = ["totalAmount", "taxableAmount", "gstAmount", "discount", "paymentAmount"];
        numFields.forEach(f => {
            if (payload[f] != null) payload[f] = Number(payload[f]);
        });

        payload.items = normalizePurchaseItems(payload.items || []);

        payload.additionalCharges = (payload.additionalCharges || []).map(c => ({
            name: c.name || "",
            amount: Number(c.amount || 0)
        }));

        payload.payments = (payload.payments || []).map(p => ({
            mode: p.mode || "",
            amount: Number(p.amount || 0)
        }));

        // Initialize payment tracking
        const paymentMade = Number(payload.paymentAmount || 0);
        payload.paidAmount = payload.isPaymentMade ? paymentMade : 0;
        payload.dueAmount = Math.max(0, (Number(payload.totalAmount) || 0) - payload.paidAmount);
        
        // Calculate payment status
        if (payload.dueAmount === 0 && payload.paidAmount > 0) {
            payload.paymentStatus = 'paid';
        } else if (payload.paidAmount > 0 && payload.dueAmount > 0) {
            payload.paymentStatus = 'partial';
        } else {
            payload.paymentStatus = 'unpaid';
        }

        const doc = await Purchase.create(payload);

        res.status(201).json({ success: true, data: doc });

    } catch (err) {
        if (err?.code === 11000)
            return res.status(409).json({ success: false, error: { message: "Duplicate purchase invoice" } });

        next(err);
    }
}

/* ---------------- UPDATE ---------------- */
async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.body.accountCompanyName);
        if (!companyId)
            return res.status(400).json({ success: false, message: "Valid accountCompanyName is required" });

        const id = req.params.id;
        const payload = { ...req.body, updatedBy: req.user.id };

        if (payload.invoiceDate) payload.invoiceDate = new Date(payload.invoiceDate);
        if (payload.supplierInvoiceDate) payload.supplierInvoiceDate = new Date(payload.supplierInvoiceDate);

        const numFields = ["totalAmount", "taxableAmount", "gstAmount", "discount", "paymentAmount"];
        numFields.forEach(f => {
            if (payload[f] != null) payload[f] = Number(payload[f]);
        });

        if (payload.items) payload.items = normalizePurchaseItems(payload.items);

        if (payload.additionalCharges) {
            payload.additionalCharges = payload.additionalCharges.map(c => ({
                name: c.name || "",
                amount: Number(c.amount || 0)
            }));
        }

        if (payload.payments) {
            payload.payments = payload.payments.map(p => ({
                mode: p.mode || "",
                amount: Number(p.amount || 0)
            }));
        }

        const doc = await Purchase.findOneAndUpdate(
            { _id: id, ownerId, accountCompanyName: companyId },
            payload,
            { new: true }
        );

        if (!doc)
            return res.status(404).json({ success: false, error: { message: "Not found" } });

        res.json({ success: true, data: doc });

    } catch (err) {
        if (err?.code === 11000)
            return res.status(409).json({ success: false, error: { message: "Duplicate purchase invoice" } });

        next(err);
    }
}

/* ---------------- REMOVE ---------------- */
async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId)
            return res.status(400).json({ success: false, message: "Valid accountCompanyName is required" });

        const doc = await Purchase.findOneAndUpdate(
            { _id: req.params.id, ownerId, accountCompanyName: companyId },
            { isDeleted: true, updatedBy: req.user.id },
            { new: true }
        );

        if (!doc)
            return res.status(404).json({ success: false, error: { message: "Not found" } });

        res.json({ success: true, data: doc });

    } catch (err) { next(err); }
}

/* ---------------- EXPORT PDF ---------------- */
async function exportPDF(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId)
            return res.status(400).json({ success: false, message: "Valid accountCompanyName is required" });

        // Fetch the purchase
        const purchase = await Purchase.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        }).lean();

        if (!purchase)
            return res.status(404).json({ success: false, error: { message: "Purchase not found" } });

        // Fetch company details
        const Company = getCompanyModel();
        const company = await Company.findById(companyId).lean();
        if (!company)
            return res.status(404).json({ success: false, error: { message: "Company not found" } });

        // Fetch vendor details if available
        let vendor = null;
        if (purchase.supplier) {
            vendor = await Vendor.findOne({
                vendorName: purchase.supplier,
                ownerId,
                accountCompanyName: companyId,
                isDeleted: false
            }).lean();
        }

        // Fetch all payments linked to this purchase
        const payments = await Payment.find({
            invoiceId: purchase._id,
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        }).sort({ date: 1 }).lean();

        // Generate PDF
        const pdfBuffer = await generatePurchaseInvoicePDF(purchase, company, vendor, payments);

        // Set response headers
        const invoiceNumber = `${purchase.invoicePrefix}${purchase.invoiceNumber}${purchase.invoiceSuffix}`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="PurchaseInvoice_${invoiceNumber}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);

    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove, exportPDF };
