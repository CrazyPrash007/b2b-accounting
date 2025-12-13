// src/models/Income.js
const mongoose = require('mongoose');

const IncomeSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    accountCompanyName: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    date: { type: Date, default: Date.now },
    billName: { type: String, required: true, trim: true },
    incomeAmount: { type: Number, required: true, default: 0 },
    paymentMethod: { type: String, default: '' },
    category: { type: String, default: '' },

    // Inline small file (Buffer). Suitable for PNG/JPG/PDF up to mongo document limit (~16MB).
    receipt: {
        data: Buffer,
        contentType: String,
        fileName: String,
        size: Number
    },

    notes: { type: String, default: '' },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    createdBy: { type: mongoose.Schema.Types.ObjectId },
    updatedBy: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

IncomeSchema.index({ ownerId: 1, accountCompanyName: 1, createdAt: -1 });

module.exports = mongoose.model('Income', IncomeSchema);
