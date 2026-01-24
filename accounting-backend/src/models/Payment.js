// src/models/Payment.js
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    accountCompanyName: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    
    // Party details (vendor). Frontend passes display name; we also allow optional reference id.
    partyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
    party: { type: String, trim: true, default: '' },

    // Payment/invoice linking (optional)
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase', default: null },
    invoiceLabel: { type: String, trim: true, default: '' }, // e.g., PINV00000123

    // Payment fields
    paymentNumber: { type: String, trim: true, default: '' }, // Auto-generated 6-digit number
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

// index to help lookup payments by owner/date
PaymentSchema.index({ ownerId: 1, accountCompanyName: 1, date: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);
