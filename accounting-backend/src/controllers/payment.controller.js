// src/controllers/payment.controller.js
const Payment = require("../models/Payment");
const Purchase = require("../models/Purchase");
const Vendor = require("../models/Vendor");
const { getCompanyModel } = require("../models/Company");
const { generatePaymentPDF } = require("../utils/pdfGenerator");
const mongoose = require("mongoose");

/* ---------------------------- Helper ---------------------------- */
function toObjectId(v) {
    if (!v) return null;
    try {
        return new mongoose.Types.ObjectId(v);
    } catch {
        return null;
    }
}

/* ---------------------------- Generate Payment Number ---------------------------- */
async function generatePaymentNumber(ownerId, companyId) {
    try {
        // Find the latest payment for this company
        const latestPayment = await Payment.findOne({
            ownerId,
            accountCompanyName: companyId,
            paymentNumber: { $exists: true, $ne: '' }
        })
        .sort({ createdAt: -1 })
        .select('paymentNumber')
        .lean();

        let nextNumber = 1;
        
        if (latestPayment && latestPayment.paymentNumber) {
            // Extract number from paymentNumber (assuming format like "000001")
            const match = latestPayment.paymentNumber.match(/(\d+)$/);
            if (match) {
                nextNumber = parseInt(match[1], 10) + 1;
            }
        }

        // Return 6-digit zero-padded number
        return String(nextNumber).padStart(6, '0');
    } catch (err) {
        console.error('Error generating payment number:', err);
        return String(Date.now()).slice(-6); // Fallback to timestamp-based
    }
}

/* ============================ LIST ============================ */
async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId)
            return res.status(400).json({
                success: false,
                error: { message: "Valid accountCompanyName is required" }
            });

        const { page = 1, limit = 50, search, sort, fromDate, toDate } = req.query;

        const q = {
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        };

        // Search
        if (search) {
            const s = search.trim();
            q.$or = [
                { party: { $regex: s, $options: "i" } },
                { referenceNumber: { $regex: s, $options: "i" } },
                { invoiceLabel: { $regex: s, $options: "i" } }
            ];
        }

        // Date filter
        if (fromDate || toDate) {
            q.date = {};
            if (fromDate) q.date.$gte = new Date(fromDate);
            if (toDate) q.date.$lte = new Date(toDate);
        }

        // Sort
        const sortObj = {};
        if (sort) {
            const [k, dir] = sort.split(":");
            sortObj[k || "date"] = dir === "desc" ? -1 : 1;
        } else {
            sortObj.date = -1;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [docs, total] = await Promise.all([
            Payment.find(q)
                .sort(sortObj)
                .skip(skip)
                .limit(Number(limit))
                .populate('invoiceId', 'paymentStatus totalAmount paidAmount dueAmount')
                .lean(),
            Payment.countDocuments(q)
        ]);

        // Add invoice status to each payment
        const paymentsWithStatus = docs.map(doc => ({
            ...doc,
            invoiceStatus: doc.invoiceId?.paymentStatus || null
        }));

        return res.json({
            success: true,
            data: paymentsWithStatus,
            meta: { page: Number(page), limit: Number(limit), total }
        });

    } catch (err) {
        next(err);
    }
}

/* ============================ GET ONE ============================ */
async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId)
            return res.status(400).json({
                success: false,
                error: { message: "Valid accountCompanyName is required" }
            });

        const doc = await Payment.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        });

        if (!doc)
            return res.status(404).json({
                success: false,
                error: { message: "Not found" }
            });

        res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

/* ============================ CREATE ============================ */
async function create(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.body.accountCompanyName);
        if (!companyId)
            return res.status(400).json({
                success: false,
                error: { message: "Valid accountCompanyName is required" }
            });

        const payload = {
            ...req.body,
            ownerId,
            accountCompanyName: companyId,
            createdBy: req.user.id
        };

        // Normalize incoming fields
        if (payload.date) payload.date = new Date(payload.date);
        payload.amount = Number(payload.amount || 0);

        payload.party = payload.party ? String(payload.party) : "";
        payload.paymentMethod = payload.paymentMethod ? String(payload.paymentMethod) : "Cash";
        payload.referenceNumber = payload.referenceNumber ? String(payload.referenceNumber) : "";
        payload.description = payload.description ? String(payload.description) : "";
        payload.invoiceLabel = payload.invoiceLabel ? String(payload.invoiceLabel) : "";

        payload.partyId = payload.partyId ? toObjectId(payload.partyId) : null;
        payload.invoiceId = payload.invoiceId ? toObjectId(payload.invoiceId) : null;

        // Generate payment number if not provided
        if (!payload.paymentNumber) {
            payload.paymentNumber = await generatePaymentNumber(ownerId, companyId);
        }

        // If linked to an invoice, update the purchase's due amount
        if (payload.invoiceId && payload.amount > 0) {
            const purchase = await Purchase.findOne({
                _id: payload.invoiceId,
                ownerId,
                accountCompanyName: companyId,
                isDeleted: false
            });

            if (!purchase) {
                return res.status(400).json({
                    success: false,
                    error: { message: "Invoice not found" }
                });
            }

            // Calculate new paid and due amounts
            const newPaidAmount = (purchase.paidAmount || 0) + payload.amount;
            const newDueAmount = Math.max(0, purchase.totalAmount - newPaidAmount);

            // Ensure we don't overpay
            if (newPaidAmount > purchase.totalAmount) {
                return res.status(400).json({
                    success: false,
                    error: { message: "Payment amount exceeds invoice due amount" }
                });
            }

            // Calculate payment status
            let paymentStatus = 'unpaid';
            if (newDueAmount === 0 && newPaidAmount > 0) {
                paymentStatus = 'paid';
            } else if (newPaidAmount > 0 && newDueAmount > 0) {
                paymentStatus = 'partial';
            }

            // Update the purchase
            await Purchase.findByIdAndUpdate(payload.invoiceId, {
                paidAmount: newPaidAmount,
                dueAmount: newDueAmount,
                paymentStatus: paymentStatus,
                updatedBy: req.user.id
            });
        }

        const doc = await Payment.create(payload);

        return res.status(201).json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

/* ============================ UPDATE ============================ */
async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;

        const companyId = toObjectId(req.body.accountCompanyName);
        if (!companyId)
            return res.status(400).json({
                success: false,
                error: { message: "Valid accountCompanyName is required" }
            });

        const payload = {
            ...req.body,
            updatedBy: req.user.id
        };

        if (payload.date) payload.date = new Date(payload.date);
        if (payload.amount != null) payload.amount = Number(payload.amount);

        if (payload.party !== undefined) payload.party = String(payload.party || "");
        if (payload.paymentMethod !== undefined) payload.paymentMethod = String(payload.paymentMethod || "Cash");
        if (payload.referenceNumber !== undefined) payload.referenceNumber = String(payload.referenceNumber || "");
        if (payload.description !== undefined) payload.description = String(payload.description || "");
        if (payload.invoiceLabel !== undefined) payload.invoiceLabel = String(payload.invoiceLabel || "");

        payload.partyId = payload.partyId ? toObjectId(payload.partyId) : null;
        payload.invoiceId = payload.invoiceId ? toObjectId(payload.invoiceId) : null;

        const doc = await Payment.findOneAndUpdate(
            {
                _id: id,
                ownerId,
                accountCompanyName: companyId
            },
            payload,
            { new: true, runValidators: true }
        );

        if (!doc)
            return res.status(404).json({
                success: false,
                error: { message: "Not found" }
            });

        return res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

/* ============================ DELETE ============================ */
async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId)
            return res.status(400).json({
                success: false,
                error: { message: "Valid accountCompanyName is required" }
            });

        const doc = await Payment.findOneAndUpdate(
            {
                _id: req.params.id,
                ownerId,
                accountCompanyName: companyId
            },
            { isDeleted: true, updatedBy: req.user.id },
            { new: true }
        );

        if (!doc)
            return res.status(404).json({
                success: false,
                error: { message: "Not found" }
            });

        res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

/* ============================ EXPORT PDF ============================ */
async function exportPDF(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId)
            return res.status(400).json({
                success: false,
                error: { message: "Valid accountCompanyName is required" }
            });

        // Fetch the payment
        const payment = await Payment.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        }).lean();

        if (!payment)
            return res.status(404).json({
                success: false,
                error: { message: "Payment not found" }
            });

        // Fetch company details
        const Company = getCompanyModel();
        const company = await Company.findById(companyId).lean();
        if (!company)
            return res.status(404).json({
                success: false,
                error: { message: "Company not found" }
            });

        // Fetch vendor details if available
        let vendor = null;
        if (payment.partyId) {
            vendor = await Vendor.findById(payment.partyId).lean();
        }

        // Fetch invoice details if linked
        let invoice = null;
        if (payment.invoiceId) {
            invoice = await Purchase.findById(payment.invoiceId).lean();
        }

        // Generate PDF
        const pdfBuffer = await generatePaymentPDF(payment, company, vendor, invoice);

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Payment_${payment._id}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);

    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove, exportPDF };
