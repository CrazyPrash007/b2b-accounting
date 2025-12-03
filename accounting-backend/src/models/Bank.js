// src/models/Bank.js
const mongoose = require('mongoose');

const BankSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // main-app user id
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
    isActive: { type: Boolean, default: true }, // convenience flag (derived from status when created/updated)
    isDeleted: { type: Boolean, default: false },

    createdBy: { type: mongoose.Schema.Types.ObjectId },
    updatedBy: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

// Unique per owner: accountNumber and display name should be unique (ignoring deleted docs)
BankSchema.index(
    { ownerId: 1, accountNumber: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);

BankSchema.index(
    { ownerId: 1, accountDisplayName: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);

module.exports = mongoose.model('Bank', BankSchema);
