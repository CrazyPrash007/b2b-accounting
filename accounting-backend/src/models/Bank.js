// src/models/Bank.js
const mongoose = require('mongoose');

const BankSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    accountCompanyName: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    accountDisplayName: { type: String, required: true, trim: true },
    shortAliasName: { type: String, trim: true, default: "" },
    emailAddress: { type: String, trim: true, default: "" },
    phoneNo: { type: String, trim: true, default: "" },

    accountHolderName: { type: String, trim: true, default: "" },
    accountNumber: { type: String, trim: true, required: true },
    ifscCode: { type: String, trim: true, default: "" },
    bankName: { type: String, trim: true, required: true },

    openingBalance: { type: Number, default: 0 },
    openingBalanceType: { type: String, enum: ['Credit', 'Debit'], default: 'Credit' },

    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    createdBy: { type: mongoose.Schema.Types.ObjectId },
    updatedBy: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

// 🔥 Unique per owner + company + account number
BankSchema.index(
    { ownerId: 1, accountCompanyName: 1, accountNumber: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);

module.exports = mongoose.model('Bank', BankSchema);
