// src/models/Sale.js
const mongoose = require('mongoose');

const SaleItemSchema = new mongoose.Schema({
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },

    qty: { type: Number, default: 0 },
    rate: { type: Number, default: 0 }, // unit rate as entered/auto-filled
    // keep old keys that frontend might send (sellPrice alias)
    sellPrice: { type: Number, default: 0 },

    gstPercent: { type: Number, default: null }, // e.g., 18
    gstType: { type: String, enum: ['Excluded', 'Included'], default: 'Excluded' },

    actualAmount: { type: Number, default: 0 }, // pre-tax amount
    finalAmount: { type: Number, default: 0 },  // post-tax amount

    // any HSN / unit info could be stored per-line if needed
    hsnNo: { type: String, default: '' },
    unit: { type: String, default: '' },

}, { _id: false });

const AdditionalChargeSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, default: 0 },
}, { _id: false });

const PaymentSplitSchema = new mongoose.Schema({
    mode: { type: String, required: true }, // e.g., Cash, UPI, Bank Name...
    amount: { type: Number, required: true, default: 0 },
    refNo: { type: String, default: '' },
    depositTo: { type: String, default: '' }, // target account name
}, { _id: false });

const SaleSchema = new mongoose.Schema({
    // multi-tenant / owner scoping
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    // Customer can be stored as free-text (frontend uses display string) and optionally a reference
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    customer: { type: String, required: true, trim: true }, // display name/email/company

    // Invoice identifiers
    invoicePrefix: { type: String, default: 'INV', trim: true },
    invoiceNumber: { type: String, required: true, trim: true },
    invoiceSuffix: { type: String, default: '', trim: true },
    invoiceDate: { type: Date, default: Date.now },

    // items table
    items: { type: [SaleItemSchema], default: [] },

    // GST flag mirrored from modal
    withGst: { type: Boolean, default: true },

    // Payment / receipt
    isPaymentReceived: { type: Boolean, default: true },
    paymentMode: { type: String, default: 'Cash' }, // primary mode
    refNo: { type: String, default: '' },           // primary ref no.
    depositTo: { type: String, default: 'Cash-in-Hand' }, // primary deposit target
    paymentAmount: { type: Number, default: 0 },    // primary payment amount
    payFull: { type: Boolean, default: false },

    // splits and ledger-like entries
    payments: { type: [PaymentSplitSchema], default: [] },

    // Additional charges and discount
    additionalCharges: { type: [AdditionalChargeSchema], default: [] },
    discount: { type: Number, default: 0 },

    // summary totals (stored for quick access / reporting)
    taxableAmount: { type: Number, default: 0 }, // sum of pre-tax amounts
    gstAmount: { type: Number, default: 0 },     // total tax
    subTotal: { type: Number, default: 0 },     // sum of finalAmt before discounts & charges
    totalAmount: { type: Number, default: 0 },  // final payable amount after discount/additional charges/rounding

    autoRoundOff: { type: Boolean, default: true },

    description: { type: String, default: '' },

    // soft-delete / activity
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    // audit
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },

}, { timestamps: true });

// Unique invoice per owner (ignore deleted documents)
SaleSchema.index(
    { ownerId: 1, invoicePrefix: 1, invoiceNumber: 1, invoiceSuffix: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);

// Convenience index for date-range queries per owner
SaleSchema.index({ ownerId: 1, invoiceDate: -1 });

module.exports = mongoose.model('Sale', SaleSchema);
