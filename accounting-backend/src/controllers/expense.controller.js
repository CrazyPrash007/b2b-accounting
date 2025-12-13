// src/controllers/expense.controller.js
const Expense = require('../models/Expense');
const multer = require('multer');
const mongoose = require('mongoose');

/* ------------------------- Multer Setup (same as Income) ------------------------- */
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 15 * 1024 * 1024, // 15MB max
    }
}).single("receipt");

const uploadMiddleware = (req, res, next) => {
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

/* ----------------------------- Utility ----------------------------- */
function toObjectId(id) {
    if (!id || !mongoose.isValidObjectId(id)) return null;
    return new mongoose.Types.ObjectId(id);
}

/* ----------------------------- LIST ----------------------------- */
async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const { page = 1, limit = 50, search, sort } = req.query;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({ message: "Valid accountCompanyName (companyId) is required" });
        }

        const q = {
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        };

        if (search) {
            const s = search.trim();
            q.$or = [
                { billName: { $regex: s, $options: "i" } },
                { category: { $regex: s, $options: "i" } }
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
            Expense.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Expense.countDocuments(q)
        ]);

        res.json({
            success: true,
            data: items,
            meta: { page: Number(page), limit: Number(limit), total }
        });
    } catch (err) {
        next(err);
    }
}

/* ----------------------------- GET ONE ----------------------------- */
async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({ message: "Valid accountCompanyName is required" });
        }

        const doc = await Expense.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        });

        if (!doc) return res.status(404).json({ success: false, error: { message: "Not found" } });

        res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

/* ----------------------------- CREATE ----------------------------- */
async function create(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.body.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({ message: "Valid accountCompanyName is required" });
        }

        if (!req.body.billName) {
            return res.status(400).json({
                success: false,
                message: "billName is required",
                error: { message: "billName is required" }
            });
        }

        const payload = {
            ...req.body,
            ownerId,
            accountCompanyName: companyId,
            createdBy: req.user.id
        };

        // Convert number fields
        payload.expenseAmount = Number(payload.expenseAmount || 0);

        // Handle uploaded file
        if (req.file) {
            payload.receipt = {
                data: req.file.buffer,
                contentType: req.file.mimetype,
                fileName: req.file.originalname,
                size: req.file.size
            };
        }

        const doc = await Expense.create(payload);
        res.status(201).json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

/* ----------------------------- UPDATE ----------------------------- */
async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;

        const companyId = toObjectId(req.body.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({ message: "Valid accountCompanyName is required" });
        }

        const payload = {
            ...req.body,
            updatedBy: req.user.id
        };

        // Clean number input
        if (payload.expenseAmount != null) {
            payload.expenseAmount = Number(payload.expenseAmount) || 0;
        }

        // Attach new receipt if uploaded
        if (req.file) {
            payload.receipt = {
                data: req.file.buffer,
                contentType: req.file.mimetype,
                fileName: req.file.originalname,
                size: req.file.size
            };
        }

        const doc = await Expense.findOneAndUpdate(
            { _id: id, ownerId, accountCompanyName: companyId },
            payload,
            { new: true, runValidators: true }
        );

        if (!doc) return res.status(404).json({ success: false, error: { message: "Not found" } });

        res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

/* ----------------------------- REMOVE (Soft Delete) ----------------------------- */
async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const companyId = toObjectId(req.query.accountCompanyName);

        if (!companyId) {
            return res.status(400).json({ message: "Valid accountCompanyName is required" });
        }

        const doc = await Expense.findOneAndUpdate(
            { _id: req.params.id, ownerId, accountCompanyName: companyId },
            { isDeleted: true, updatedBy: req.user.id },
            { new: true }
        );

        if (!doc) return res.status(404).json({ success: false, error: { message: "Not found" } });

        res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

/* ----------------------------- DOWNLOAD RECEIPT ----------------------------- */
async function downloadReceipt(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const doc = await Expense.findOne({
            _id: req.params.id,
            ownerId,
            isDeleted: false
        }).lean();

        if (!doc) {
            return res.status(404).json({ success: false, error: { message: "Not found" } });
        }

        if (!doc.receipt || !doc.receipt.data) {
            return res.status(404).json({ success: false, error: { message: "No receipt attached" } });
        }

        res.setHeader('Content-Type', doc.receipt.contentType);
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${encodeURIComponent(doc.receipt.fileName || "receipt")}"`,
        );

        return res.send(doc.receipt.data);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    list,
    getOne,
    create,
    update,
    remove,
    downloadReceipt,
    uploadMiddleware
};
