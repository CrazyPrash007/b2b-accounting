// src/controllers/income.controller.js
const Income = require("../models/Income");
const mongoose = require("mongoose");
const multer = require("multer");

// -------------------------------------------------------------
// Helper: ObjectId converter
// -------------------------------------------------------------
function toObjectId(id) {
    if (!id || !mongoose.isValidObjectId(id)) return null;
    return new mongoose.Types.ObjectId(id);
}

// -------------------------------------------------------------
// Multer Middleware (same as before)
// -------------------------------------------------------------
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 15 * 1024 * 1024, // 15MB max
    }
}).single("receipt");

exports.uploadMiddleware = (req, res, next) => {
    upload(req, res, function (err) {
        if (err) {
            return res.status(400).json({
                success: false,
                error: { message: err.message || "File upload error" }
            });
        }
        next();
    });
};

// -------------------------------------------------------------
// LIST INCOMES
// -------------------------------------------------------------
exports.list = async (req, res, next) => {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                message: "Valid accountCompanyName (companyId) is required"
            });
        }

        const { page = 1, limit = 50, search, sort } = req.query;

        const q = {
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        };

        if (search?.trim()) {
            const s = search.trim();
            q.$or = [
                { billName: { $regex: s, $options: "i" } },
                { category: { $regex: s, $options: "i" } },
                { paymentMethod: { $regex: s, $options: "i" } }
            ];
        }

        const sortObj = {};
        if (sort) {
            const [k, dir] = sort.split(":");
            sortObj[k || "createdAt"] = dir === "desc" ? -1 : 1;
        } else {
            sortObj.createdAt = -1;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [items, total] = await Promise.all([
            Income.find(q)
                .sort(sortObj)
                .skip(skip)
                .limit(Number(limit))
                .select("-receipt") // don't send heavy file data in list
                .lean(),
            Income.countDocuments(q)
        ]);

        return res.json({
            success: true,
            data: items,
            meta: {
                page: Number(page),
                limit: Number(limit),
                total
            }
        });

    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------------
// GET ONE INCOME
// -------------------------------------------------------------
exports.getOne = async (req, res, next) => {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                message: "Valid accountCompanyName is required"
            });
        }

        const doc = await Income.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        }).lean();

        if (!doc)
            return res.status(404).json({ success: false, error: { message: "Not found" } });

        return res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------------
// CREATE INCOME
// -------------------------------------------------------------
exports.create = async (req, res, next) => {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.body.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                message: "Valid accountCompanyName (companyId) is required"
            });
        }

        const payload = {
            ...req.body,
            ownerId,
            accountCompanyName: companyId,
            createdBy: req.user.id
        };

        // Handle file upload (if any)
        if (req.file) {
            payload.receipt = {
                data: req.file.buffer,
                fileName: req.file.originalname,
                size: req.file.size,
                contentType: req.file.mimetype
            };
        }

        const doc = await Income.create(payload);

        return res.status(201).json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------------
// UPDATE INCOME
// -------------------------------------------------------------
exports.update = async (req, res, next) => {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.body.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                message: "Valid accountCompanyName (companyId) is required"
            });
        }

        const id = req.params.id;

        const payload = {
            ...req.body,
            updatedBy: req.user.id
        };

        // Handle file upload (replace receipt)
        if (req.file) {
            payload.receipt = {
                data: req.file.buffer,
                fileName: req.file.originalname,
                size: req.file.size,
                contentType: req.file.mimetype
            };
        }

        const doc = await Income.findOneAndUpdate(
            {
                _id: id,
                ownerId,
                accountCompanyName: companyId
            },
            payload,
            { new: true, runValidators: true }
        );

        if (!doc)
            return res.status(404).json({ success: false, error: { message: "Not found" } });

        return res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------------
// DELETE INCOME (Soft Delete)
// -------------------------------------------------------------
exports.remove = async (req, res, next) => {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                message: "Valid accountCompanyName (companyId) is required"
            });
        }

        const doc = await Income.findOneAndUpdate(
            {
                _id: req.params.id,
                ownerId,
                accountCompanyName: companyId
            },
            { isDeleted: true, updatedBy: req.user.id },
            { new: true }
        );

        if (!doc)
            return res.status(404).json({ success: false, error: { message: "Not found" } });

        return res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------------
// DOWNLOAD RECEIPT FILE
// -------------------------------------------------------------
exports.downloadReceipt = async (req, res, next) => {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                message: "Valid accountCompanyName (companyId) is required"
            });
        }

        const doc = await Income.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        }).lean();

        if (!doc || !doc.receipt?.data) {
            return res.status(404).json({
                success: false,
                error: { message: "Receipt not found" }
            });
        }

        res.set("Content-Type", doc.receipt.contentType || "application/octet-stream");
        res.set("Content-Disposition", `attachment; filename="${doc.receipt.fileName || "receipt"}"`);
        res.send(doc.receipt.data);

    } catch (err) {
        next(err);
    }
};
