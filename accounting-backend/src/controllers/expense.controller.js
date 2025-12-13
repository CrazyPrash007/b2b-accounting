// src/controllers/expense.controller.js
const Expense = require('../models/Expense');
const multer = require('multer');

// multer memory storage (small files)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = [
            'image/png',
            'image/jpeg',
            'image/jpg',
            'application/pdf',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only PNG, JPG, PDF and Excel files are allowed.'));
    },
});

const uploadSingle = upload.single('uploadBill');

// ============================ LIST ============================
async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const { page = 1, limit = 50, search, sort } = req.query;

        const accountCompanyName = req.query.accountCompanyName;
        if (!accountCompanyName) {
            return res.status(400).json({ message: "accountCompanyName is required" });
        }

        const q = {
            ownerId,
            accountCompanyName,
            isDeleted: false
        };

        if (search) q.billName = { $regex: search, $options: 'i' };

        const sortObj = {};
        if (sort) {
            const [k, dir] = sort.split(':');
            sortObj[k || "createdAt"] = dir === "desc" ? -1 : 1;
        } else {
            sortObj.createdAt = -1;
        }

        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            Expense.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Expense.countDocuments(q)
        ]);

        res.json({ success: true, data: items, meta: { page: Number(page), limit: Number(limit), total } });

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

        const doc = await Expense.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName,
            isDeleted: false
        }).lean();

        if (!doc) return res.status(404).json({ success: false, error: { message: "Not found" } });

        res.json({ success: true, data: doc });

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
            ownerId,
            accountCompanyName: req.body.accountCompanyName,
            createdBy: req.user.id,

            date: req.body.date ? new Date(req.body.date) : new Date(),
            billName: String(req.body.billName || '').trim(),
            expenseAmount: Number(req.body.expenseAmount || 0),
            paymentMethod: String(req.body.paymentMethod || ''),
            category: String(req.body.category || ''),
            notes: String(req.body.notes || ''),
        };

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

// ============================ UPDATE ============================
async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;

        if (!req.body.accountCompanyName) {
            return res.status(400).json({ message: "accountCompanyName is required" });
        }

        const payload = { ...req.body, updatedBy: req.user.id };

        if (payload.date) payload.date = new Date(payload.date);
        if (payload.expenseAmount != null) payload.expenseAmount = Number(payload.expenseAmount);

        if (req.file) {
            payload.receipt = {
                data: req.file.buffer,
                contentType: req.file.mimetype,
                fileName: req.file.originalname,
                size: req.file.size
            };
        }

        const doc = await Expense.findOneAndUpdate(
            { _id: id, ownerId, accountCompanyName: req.body.accountCompanyName },
            payload,
            { new: true }
        );

        if (!doc) return res.status(404).json({ success: false, error: { message: "Not found" } });

        res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

// ============================ DELETE ============================
async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const accountCompanyName = req.query.accountCompanyName;
        if (!accountCompanyName) {
            return res.status(400).json({ message: "accountCompanyName is required" });
        }

        const id = req.params.id;

        const doc = await Expense.findOneAndUpdate(
            { _id: id, ownerId, accountCompanyName },
            { isDeleted: true, updatedBy: req.user.id },
            { new: true }
        );

        if (!doc) return res.status(404).json({ success: false, error: { message: "Not found" } });

        res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

// ============================ DOWNLOAD RECEIPT ============================
async function downloadReceipt(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const accountCompanyName = req.query.accountCompanyName;
        if (!accountCompanyName) {
            return res.status(400).json({ message: "accountCompanyName is required" });
        }

        const doc = await Expense.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName,
            isDeleted: false
        }).lean();

        if (!doc || !doc.receipt || !doc.receipt.data) {
            return res.status(404).json({ success: false, error: { message: 'Receipt not found' } });
        }

        const buffer = Buffer.isBuffer(doc.receipt.data)
            ? doc.receipt.data
            : Buffer.from(doc.receipt.data);

        const filename = (doc.receipt.fileName || `receipt-${req.params.id}`).replace(/["']/g, "");
        const contentType = doc.receipt.contentType || "application/octet-stream";

        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Length", buffer.length);

        return res.send(buffer);

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
    uploadMiddleware: uploadSingle
};
