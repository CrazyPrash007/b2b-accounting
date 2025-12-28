// src/controllers/purchase.controller.js
const Purchase = require("../models/Purchase");
const Payment = require("../models/Payment");
const Vendor = require("../models/Vendor");
const Item = require("../models/Item");
const { getCompanyModel } = require("../models/Company");
const { generatePurchaseInvoicePDF } = require("../utils/pdfGenerator");
const mongoose = require("mongoose");

/* ---------------- HELPERS ---------------- */
function toObjectId(id) {
    if (!id) return null;
    try { return new mongoose.Types.ObjectId(id); }
    catch { return null; }
}

/* --------------------- Stock Management --------------------- */
/**
 * Update item stock when a purchase is created
 * Increases stock by the quantity purchased
 */
async function increaseItemStock(items, ownerId, companyId) {
    const bulkOps = [];
    
    for (const item of items) {
        if (item.itemId && item.qty > 0) {
            bulkOps.push({
                updateOne: {
                    filter: {
                        _id: item.itemId,
                        ownerId,
                        accountCompanyName: companyId,
                        isDeleted: false
                    },
                    update: {
                        $inc: { openingStock: item.qty }
                    }
                }
            });
        }
    }
    
    if (bulkOps.length > 0) {
        await Item.bulkWrite(bulkOps);
    }
}

/**
 * Restore item stock when a purchase is deleted
 * Decreases stock by the quantity previously purchased
 */
async function decreaseItemStock(items, ownerId, companyId) {
    const bulkOps = [];
    
    for (const item of items) {
        if (item.itemId && item.qty > 0) {
            bulkOps.push({
                updateOne: {
                    filter: {
                        _id: item.itemId,
                        ownerId,
                        accountCompanyName: companyId,
                        isDeleted: false
                    },
                    update: {
                        $inc: { openingStock: -item.qty }
                    }
                }
            });
        }
    }
    
    if (bulkOps.length > 0) {
        await Item.bulkWrite(bulkOps);
    }
}

/**
 * Handle stock adjustment when purchase items are updated
 * Restores old quantities and increases new quantities
 */
async function adjustItemStock(oldItems, newItems, ownerId, companyId) {
    // First, restore stock from old items (decrease)
    await decreaseItemStock(oldItems, ownerId, companyId);
    
    // Then, increase stock for new items
    await increaseItemStock(newItems, ownerId, companyId);
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
        } else {
            sortObj.createdAt = -1; // Sort by recently created first
        }

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

        // Increase stock for purchased items
        await increaseItemStock(payload.items, ownerId, companyId);

        // Auto-create payment if payment was made
        const directPayment = payload.isPaymentMade && payload.paymentAmount > 0;
        if (directPayment) {
            const Payment = require("../models/Payment");
            const invLabel = `${doc.billNumber || doc.invoiceNumber || ''}`.trim();
            
            await Payment.create({
                ownerId,
                accountCompanyName: companyId,
                partyId: doc.vendorId,
                party: doc.supplier,
                invoiceId: doc._id,
                invoiceLabel: invLabel,
                date: doc.invoiceDate || new Date(),
                amount: payload.paymentAmount,
                paymentMethod: payload.paymentMode || 'Cash',
                referenceNumber: payload.refNo || '',
                description: `Payment made for invoice ${invLabel}`,
                createdBy: req.user.id,
                updatedBy: req.user.id
            });
        }

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

        // Fetch old purchase for stock adjustment
        const old = await Purchase.findOne({
            _id: id,
            ownerId,
            accountCompanyName: companyId
        });

        if (!old)
            return res.status(404).json({ success: false, error: { message: "Not found" } });

        // Adjust stock if items were changed
        if (payload.items) {
            await adjustItemStock(old.items, payload.items, ownerId, companyId);
        }

        const doc = await Purchase.findOneAndUpdate(
            { _id: id, ownerId, accountCompanyName: companyId },
            payload,
            { new: true }
        );

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

        // Get the purchase to restore stock
        const purchase = await Purchase.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        });

        if (!purchase)
            return res.status(404).json({ success: false, error: { message: "Not found" } });

        // Restore stock for deleted purchase items (decrease because we're undoing a purchase)
        await decreaseItemStock(purchase.items, ownerId, companyId);

        const doc = await Purchase.findOneAndUpdate(
            { _id: req.params.id, ownerId, accountCompanyName: companyId },
            { isDeleted: true, updatedBy: req.user.id },
            { new: true }
        );

        if (!doc)
            return res.status(404).json({ success: false, error: { message: "Not found" } });

        // Remove auto-generated payment for this purchase
        const invLabel = doc.purchaseInvoiceNumber;
        if (invLabel) {
            const descPattern = new RegExp(`Payment made for invoice ${invLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
            const autoPayment = await Payment.findOne({
                invoiceId: doc._id,
                ownerId,
                accountCompanyName: companyId,
                description: descPattern,
                amount: doc.paymentAmount,
                usedAmount: doc.paymentAmount,
                remainingAmount: 0
            });

            if (autoPayment) {
                await Payment.findByIdAndUpdate(autoPayment._id, { isDeleted: true });
            }
        }

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
