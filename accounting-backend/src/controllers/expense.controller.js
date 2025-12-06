// src/controllers/income.controller.js
const Expense = require('../models/Expense');
const multer = require('multer');

// multer memory storage (small files)
// adjust limits.fileSize as needed (here 5 MB)
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

// middleware to use in routes: field name 'uploadBill'
const uploadSingle = upload.single('uploadBill');

/**
 * All controllers enforce owner scoping: ownerId from req.user.ownerId
 */

async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const { page = 1, limit = 50, search, sort } = req.query;
        const q = { ownerId, isDeleted: false };

        if (search) q.billName = { $regex: search, $options: 'i' };

        const sortObj = {};
        if (sort) {
            const [k, dir] = sort.split(':');
            sortObj[k || 'createdAt'] = dir === 'desc' ? -1 : 1;
        } else {
            sortObj.createdAt = -1;
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [items, total] = await Promise.all([
            Expense.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Expense.countDocuments(q),
        ]);

        res.json({ success: true, data: items, meta: { page: Number(page), limit: Number(limit), total } });
    } catch (err) {
        next(err);
    }
}

async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const doc = await Expense.findOne({ _id: req.params.id, ownerId, isDeleted: false }).lean();
        if (!doc) return res.status(404).json({ success: false, error: { message: 'Not found' } });
        res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

async function create(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const payload = {
            ownerId,
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

async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;
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

        const doc = await Expense.findOneAndUpdate({ _id: id, ownerId }, payload, { new: true });
        if (!doc) return res.status(404).json({ success: false, error: { message: 'Not found' } });
        res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;
        const doc = await Expense.findOneAndUpdate({ _id: id, ownerId }, { isDeleted: true, updatedBy: req.user.id }, { new: true });
        if (!doc) return res.status(404).json({ success: false, error: { message: 'Not found' } });
        res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

// robust download handler — replace your current downloadReceipt function with this
async function downloadReceipt(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;
        // Use your Expense model name (I used Expense)
        const doc = await Expense.findOne({ _id: id, ownerId, isDeleted: false }).lean();
        if (!doc || !doc.receipt || !doc.receipt.data) {
            return res.status(404).json({ success: false, error: { message: 'Receipt not found' } });
        }

        // Normalize stored value to a Buffer
        const d = doc.receipt.data;
        let buffer;

        if (Buffer.isBuffer(d)) {
            buffer = d;
        } else if (d && d.buffer) {
            // Common driver shape: { buffer: <Uint8Array> }
            buffer = Buffer.from(d.buffer);
        } else if (typeof d === "string") {
            // Stored as base64 string
            buffer = Buffer.from(d, "base64");
        } else if (d && d._bsontype === "Binary" && d.buffer) {
            buffer = Buffer.from(d.buffer);
        } else {
            // fallback attempt
            try {
                buffer = Buffer.from(d);
            } catch (err) {
                return res.status(500).json({ success: false, error: { message: "Unsupported receipt format" } });
            }
        }

        const filename = (doc.receipt.fileName || `receipt-${id}`).replace(/["']/g, "");
        const contentType = doc.receipt.contentType || "application/octet-stream";

        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Length", buffer.length);

        // send raw binary
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
