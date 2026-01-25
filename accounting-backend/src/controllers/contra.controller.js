// src/controllers/contra.controller.js
const Contra = require("../models/Contra");
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
                { fromAccount: { $regex: s, $options: "i" } },
                { toAccount: { $regex: s, $options: "i" } },
                { description: { $regex: s, $options: "i" } }
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
            Contra.find(q)
                .sort(sortObj)
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Contra.countDocuments(q)
        ]);

        return res.json({
            success: true,
            data: docs,
            meta: { total, page: Number(page), limit: Number(limit) }
        });
    } catch (err) {
        console.error("Error in contra.list:", err);
        next(err);
    }
}

/* ============================ CREATE ============================ */
async function create(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const {
            accountCompanyName,
            date,
            fromAccount,
            toAccount,
            amount,
            description,
            type
        } = req.body;

        const companyId = toObjectId(accountCompanyName);
        if (!companyId)
            return res.status(400).json({
                success: false,
                error: { message: "Valid accountCompanyName is required" }
            });

        if (!fromAccount || !toAccount)
            return res.status(400).json({
                success: false,
                error: { message: "From and To accounts are required" }
            });

        if (!amount || amount <= 0)
            return res.status(400).json({
                success: false,
                error: { message: "Valid amount is required" }
            });

        const doc = await Contra.create({
            ownerId,
            accountCompanyName: companyId,
            date: date || new Date(),
            fromAccount,
            toAccount,
            amount,
            description: description || "",
            type: type || "Contra Entry",
            createdBy: req.user._id
        });

        return res.status(201).json({ success: true, data: doc });
    } catch (err) {
        console.error("Error in contra.create:", err);
        next(err);
    }
}

/* ============================ GET BY ID ============================ */
async function getById(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = toObjectId(req.params.id);
        if (!id)
            return res.status(400).json({
                success: false,
                error: { message: "Invalid ID" }
            });

        const doc = await Contra.findOne({ _id: id, ownerId, isDeleted: false }).lean();
        if (!doc)
            return res.status(404).json({
                success: false,
                error: { message: "Contra entry not found" }
            });

        return res.json({ success: true, data: doc });
    } catch (err) {
        console.error("Error in contra.getById:", err);
        next(err);
    }
}

/* ============================ UPDATE ============================ */
async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = toObjectId(req.params.id);
        if (!id)
            return res.status(400).json({
                success: false,
                error: { message: "Invalid ID" }
            });

        const {
            date,
            fromAccount,
            toAccount,
            amount,
            description,
            type
        } = req.body;

        const updateData = { updatedBy: req.user._id };

        if (date !== undefined) updateData.date = date;
        if (fromAccount !== undefined) updateData.fromAccount = fromAccount;
        if (toAccount !== undefined) updateData.toAccount = toAccount;
        if (amount !== undefined) updateData.amount = amount;
        if (description !== undefined) updateData.description = description;
        if (type !== undefined) updateData.type = type;

        const doc = await Contra.findOneAndUpdate(
            { _id: id, ownerId, isDeleted: false },
            updateData,
            { new: true, runValidators: true }
        ).lean();

        if (!doc)
            return res.status(404).json({
                success: false,
                error: { message: "Contra entry not found" }
            });

        return res.json({ success: true, data: doc });
    } catch (err) {
        console.error("Error in contra.update:", err);
        next(err);
    }
}

/* ============================ DELETE ============================ */
async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = toObjectId(req.params.id);
        if (!id)
            return res.status(400).json({
                success: false,
                error: { message: "Invalid ID" }
            });

        const doc = await Contra.findOneAndUpdate(
            { _id: id, ownerId, isDeleted: false },
            { isDeleted: true, updatedBy: req.user._id },
            { new: true }
        ).lean();

        if (!doc)
            return res.status(404).json({
                success: false,
                error: { message: "Contra entry not found" }
            });

        return res.json({ success: true, data: doc });
    } catch (err) {
        console.error("Error in contra.remove:", err);
        next(err);
    }
}

module.exports = {
    list,
    create,
    getById,
    update,
    remove
};
