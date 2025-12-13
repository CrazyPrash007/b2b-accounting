// src/controllers/receipt.controller.js
const Receipt = require('../models/Receipt');

/**
 * Controllers enforce owner scoping: ownerId + accountCompanyName
 */

// ============================ LIST ============================
async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const { page = 1, limit = 50, search, sort, fromDate, toDate } = req.query;

        const accountCompanyName = req.query.accountCompanyName;
        if (!accountCompanyName) {
            return res.status(400).json({ message: "accountCompanyName is required" });
        }

        const q = {
            ownerId,
            accountCompanyName,
            isDeleted: false
        };

        // search conditions
        if (search) {
            q.$or = [
                { party: { $regex: search, $options: 'i' } },
                { referenceNumber: { $regex: search, $options: 'i' } },
                { invoiceLabel: { $regex: search, $options: 'i' } },
            ];
        }

        // date filter
        if (fromDate || toDate) {
            q.date = {};
            if (fromDate) q.date.$gte = new Date(fromDate);
            if (toDate) q.date.$lte = new Date(toDate);
            if (Object.keys(q.date).length === 0) delete q.date;
        }

        // sort
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

// ============================ GET ONE ============================
async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const accountCompanyName = req.query.accountCompanyName;
        if (!accountCompanyName) {
            return res.status(400).json({ message: "accountCompanyName is required" });
        }

        const doc = await Receipt.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName,
            isDeleted: false
        });

        if (!doc) {
            return res.status(404).json({
                success: false,
                error: { message: "Not found" }
            });
        }

        return res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

// ============================ CREATE ============================
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
            createdBy: req.user.id,
        };

        // Normalize types
        if (payload.date) payload.date = new Date(payload.date);
        payload.amount = payload.amount != null ? Number(payload.amount) : 0;

        payload.party = payload.party ? String(payload.party) : "";
        payload.paymentMethod = payload.paymentMethod ? String(payload.paymentMethod) : "Cash";
        payload.referenceNumber = payload.referenceNumber ? String(payload.referenceNumber) : "";
        payload.description = payload.description ? String(payload.description) : "";
        payload.invoiceLabel = payload.invoiceLabel ? String(payload.invoiceLabel) : "";

        if (!payload.partyId) payload.partyId = null;
        if (!payload.invoiceId) payload.invoiceId = null;

        const doc = await Receipt.create(payload);

        return res.status(201).json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

// ============================ UPDATE ============================
async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;

        if (!req.body.accountCompanyName) {
            return res.status(400).json({ message: "accountCompanyName is required" });
        }

        const payload = {
            ...req.body,
            updatedBy: req.user.id
        };

        if (payload.date) payload.date = new Date(payload.date);
        if (payload.amount != null) payload.amount = Number(payload.amount);

        payload.party = payload.party !== undefined ? String(payload.party || "") : undefined;
        payload.paymentMethod = payload.paymentMethod !== undefined ? String(payload.paymentMethod || "Cash") : undefined;
        payload.referenceNumber = payload.referenceNumber !== undefined ? String(payload.referenceNumber || "") : undefined;
        payload.description = payload.description !== undefined ? String(payload.description || "") : undefined;
        payload.invoiceLabel = payload.invoiceLabel !== undefined ? String(payload.invoiceLabel || "") : undefined;

        if (payload.partyId === "" || payload.partyId == null) payload.partyId = null;
        if (payload.invoiceId === "" || payload.invoiceId == null) payload.invoiceId = null;

        const doc = await Receipt.findOneAndUpdate(
            {
                _id: id,
                ownerId,
                accountCompanyName: req.body.accountCompanyName
            },
            payload,
            { new: true, runValidators: true }
        );

        if (!doc) {
            return res.status(404).json({ success: false, error: { message: "Not found" } });
        }

        return res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

// ============================ DELETE ============================
async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;

        const accountCompanyName = req.query.accountCompanyName;
        if (!accountCompanyName) {
            return res.status(400).json({ message: "accountCompanyName is required" });
        }

        const doc = await Receipt.findOneAndUpdate(
            { _id: id, ownerId, accountCompanyName },
            { isDeleted: true, updatedBy: req.user.id },
            { new: true }
        );

        if (!doc) {
            return res.status(404).json({ success: false, error: { message: "Not found" } });
        }

        return res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove };
