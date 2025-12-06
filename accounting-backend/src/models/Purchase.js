// src/models/Purchase.js
const mongoose = require('mongoose');

const ItemLineSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.Mixed }, // client-side id (optional)
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
    goodsService: { type: String, trim: true, default: '' },
    qty: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    gstPercent: { type: Number, default: 0 },
    gstType: { type: String, enum: ['Excluded', 'Included'], default: 'Excluded' },
    actualAmount: { type: Number, default: 0 }, // pre-tax
    finalAmount: { type: Number, default: 0 },  // after tax / line total
}, { _id: false });

const AdditionalChargeSchema = new mongoose.Schema({
    name: { type: String, trim: true, default: '' },
    amount: { type: Number, default: 0 },
}, { _id: false });

const PaymentSplitSchema = new mongoose.Schema({
    mode: { type: String, trim: true, default: '' },
    amount: { type: Number, default: 0 },
}, { _id: false });

const PurchaseSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    supplier: { type: String, trim: true, default: '' },

    invoicePrefix: { type: String, trim: true, default: '' },
    invoiceNumber: { type: String, trim: true, default: '' },
    invoiceSuffix: { type: String, trim: true, default: '' },
    invoiceDate: { type: Date, default: Date.now },

    supplierInvoiceNumber: { type: String, trim: true, default: '' },
    supplierInvoiceDate: { type: Date },

    items: { type: [ItemLineSchema], default: [] },

    withGst: { type: Boolean, default: true },

    // Payment fields
    isPaymentMade: { type: Boolean, default: false },
    paymentMode: { type: String, trim: true, default: '' },
    refNo: { type: String, trim: true, default: '' },
    paidFrom: { type: String, trim: true, default: '' },
    paymentAmount: { type: Number, default: 0 },
    payFull: { type: Boolean, default: false },

    // Money totals
    discount: { type: Number, default: 0 },
    autoRoundOff: { type: Boolean, default: true },
    totalAmount: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },

    additionalCharges: { type: [AdditionalChargeSchema], default: [] },
    payments: { type: [PaymentSplitSchema], default: [] },

    description: { type: String, trim: true, default: '' },

    // metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// Optional: unique index per owner to prevent duplicate invoice numbers (prefix+number+suffix)
PurchaseSchema.index({ ownerId: 1, invoicePrefix: 1, invoiceNumber: 1, invoiceSuffix: 1 }, { unique: true, partialFilterExpression: { invoiceNumber: { $exists: true, $ne: "" } } });

module.exports = mongoose.model('Purchase', PurchaseSchema);
