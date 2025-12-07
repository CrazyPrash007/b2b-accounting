// src/models/Receipt.js
const mongoose = require('mongoose');

const ReceiptSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    // Party details (customer/vendor). Frontend passes display name; we also allow optional reference id.
    partyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    party: { type: String, trim: true, default: '' },

    // Receipt/invoice linking (optional)
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', default: null },
    invoiceLabel: { type: String, trim: true, default: '' }, // e.g., INV00000290

    // Receipt fields
    date: { type: Date, default: Date.now },
    amount: { type: Number, default: 0 },
    paymentMethod: { type: String, trim: true, default: 'Cash' },
    referenceNumber: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },

    // metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// index to help lookup receipts by owner/date
ReceiptSchema.index({ ownerId: 1, date: -1 });

module.exports = mongoose.model('Receipt', ReceiptSchema);
