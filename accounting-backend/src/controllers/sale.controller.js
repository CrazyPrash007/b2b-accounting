// src/controllers/sale.controller.js
const Sale = require("../models/Sale");
const Receipt = require("../models/Receipt");
const Customer = require("../models/Customer");
const { getCompanyModel } = require("../models/Company");
const { generateSalesInvoicePDF } = require("../utils/pdfGenerator");
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

        // Initialize payment tracking
        let paymentReceived = Number(payload.paymentAmount || 0);
        
        // Handle advance payment adjustment if provided
        if (payload.advancePayment && payload.advancePayment.receiptId && payload.advancePayment.amount) {
            const Receipt = require("../models/Receipt");
            
            const advanceAmount = Number(payload.advancePayment.amount);
            const receiptId = toObjectId(payload.advancePayment.receiptId);
            
            if (!receiptId) {
                return res.status(400).json({ 
                    success: false, 
                    error: { message: "Invalid advance receipt ID" } 
                });
            }

            // Validate advance payment exists and has available balance
            const receipt = await Receipt.findOne({
                _id: receiptId,
                ownerId,
                accountCompanyName: companyId,
                isDeleted: false
            });

            if (!receipt) {
                return res.status(400).json({ 
                    success: false, 
                    error: { message: "Advance receipt not found" } 
                });
            }

            // Calculate available balance (for new receipts, remainingAmount may be 0, so use amount - usedAmount)
            const receiptUsed = Number(receipt.usedAmount || 0);
            const receiptTotal = Number(receipt.amount || 0);
            const availableBalance = receiptTotal - receiptUsed;

            if (availableBalance <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: { message: "This advance payment has been fully used" } 
                });
            }

            if (advanceAmount > availableBalance) {
                return res.status(400).json({ 
                    success: false, 
                    error: { message: `Advance amount exceeds available balance (₹${availableBalance.toFixed(2)})` } 
                });
            }

            if (advanceAmount > totals.totalAmount) {
                return res.status(400).json({ 
                    success: false, 
                    error: { message: "Advance amount cannot exceed invoice total" } 
                });
            }

            // Add advance amount to paid amount
            paymentReceived += advanceAmount;

            // Store receipt info for later update
            payload._advanceReceipt = {
                id: receiptId,
                amount: advanceAmount,
                previousUsed: receiptUsed,
                totalAmount: receiptTotal
            };
        }

        payload.paidAmount = payload.isPaymentReceived ? paymentReceived : 0;
        payload.dueAmount = Math.max(0, totals.totalAmount - payload.paidAmount);
        
        // Calculate payment status
        if (payload.dueAmount === 0 && payload.paidAmount > 0) {
            payload.paymentStatus = 'paid';
        } else if (payload.paidAmount > 0 && payload.dueAmount > 0) {
            payload.paymentStatus = 'partial';
        } else {
            payload.paymentStatus = 'unpaid';
        }

        const doc = await Sale.create(payload);

        // Update advance receipt to track usage
        if (payload._advanceReceipt) {
            const Receipt = require("../models/Receipt");
            const { id: receiptId, amount: advanceAmount, previousUsed, totalAmount } = payload._advanceReceipt;
            
            if (receiptId) {
                const newUsedAmount = previousUsed + advanceAmount;
                const newRemainingAmount = totalAmount - newUsedAmount;
                const invLabel = `${doc.invoicePrefix || ''}${doc.invoiceNumber || ''}${doc.invoiceSuffix || ''}`.trim();
                
                const updateFields = {
                    usedAmount: newUsedAmount,
                    remainingAmount: newRemainingAmount,
                    updatedBy: req.user.id
                };

                // Only link to invoice if fully used (backward compatibility)
                if (newRemainingAmount === 0) {
                    updateFields.invoiceId = doc._id;
                    updateFields.invoiceLabel = invLabel;
                }
                
                await Receipt.findByIdAndUpdate(receiptId, updateFields);
            }
        }

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

/* --------------------- EXPORT PDF --------------------- */
async function exportPDF(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId)
            return res.status(400).json({ success: false, error: { message: "Valid accountCompanyName is required" } });

        // Fetch the sale
        const sale = await Sale.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        }).lean();

        if (!sale)
            return res.status(404).json({ success: false, error: { message: "Sale not found" } });

        // Fetch company details
        const Company = getCompanyModel();
        const company = await Company.findById(companyId).lean();
        if (!company)
            return res.status(404).json({ success: false, error: { message: "Company not found" } });

        // Fetch customer details if available
        let customer = null;
        if (sale.customerId) {
            customer = await Customer.findById(sale.customerId).lean();
        }

        // Fetch all receipts linked to this sale
        const receipts = await Receipt.find({
            invoiceId: sale._id,
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        }).sort({ date: 1 }).lean();

        // Generate PDF
        const pdfBuffer = await generateSalesInvoicePDF(sale, company, customer, receipts);

        // Set response headers
        const invoiceNumber = `${sale.invoicePrefix}${sale.invoiceNumber}${sale.invoiceSuffix}`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="SalesInvoice_${invoiceNumber}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);

    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove, exportPDF, computeTotalsFromItems };
