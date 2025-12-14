// src/controllers/receipt.controller.js
const Receipt = require("../models/Receipt");
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
            Receipt.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Receipt.countDocuments(q)
        ]);

        return res.json({
            success: true,
            data: docs,
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

        const doc = await Receipt.findOne({
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

        const doc = await Receipt.create(payload);

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

        const doc = await Receipt.findOneAndUpdate(
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

        const doc = await Receipt.findOneAndUpdate(
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

module.exports = { list, getOne, create, update, remove };
