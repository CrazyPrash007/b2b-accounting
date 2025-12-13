const mongoose = require('mongoose');

const SaleItemSchema = new mongoose.Schema({
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },

    qty: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    sellPrice: { type: Number, default: 0 },

    gstPercent: { type: Number, default: null },
    gstType: { type: String, enum: ['Excluded', 'Included'], default: 'Excluded' },

    actualAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },

    hsnNo: { type: String, default: '' },
    unit: { type: String, default: '' },
}, { _id: false });

const AdditionalChargeSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, default: 0 },
}, { _id: false });

const PaymentSplitSchema = new mongoose.Schema({
    mode: { type: String, required: true },
    amount: { type: Number, required: true, default: 0 },
    refNo: { type: String, default: '' },
    depositTo: { type: String, default: '' },
}, { _id: false });

const SaleSchema = new mongoose.Schema({

    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    // REQUIRED business association
    accountCompanyName: { type: String, required: true, index: true },

    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    customer: { type: String, required: true, trim: true },

    invoicePrefix: { type: String, default: 'INV', trim: true },
    invoiceNumber: { type: String, required: true, trim: true },
    invoiceSuffix: { type: String, default: '', trim: true },
    invoiceDate: { type: Date, default: Date.now },

    items: { type: [SaleItemSchema], default: [] },

    withGst: { type: Boolean, default: true },

    isPaymentReceived: { type: Boolean, default: true },
    paymentMode: { type: String, default: 'Cash' },
    refNo: { type: String, default: '' },
    depositTo: { type: String, default: 'Cash-in-Hand' },
    paymentAmount: { type: Number, default: 0 },
    payFull: { type: Boolean, default: false },

    payments: { type: [PaymentSplitSchema], default: [] },

    additionalCharges: { type: [AdditionalChargeSchema], default: [] },
    discount: { type: Number, default: 0 },

    taxableAmount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    subTotal: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },

    autoRoundOff: { type: Boolean, default: true },

    description: { type: String, default: '' },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },

}, { timestamps: true });

SaleSchema.index(
    { ownerId: 1, invoicePrefix: 1, invoiceNumber: 1, invoiceSuffix: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);

SaleSchema.index({ ownerId: 1, accountCompanyName: 1, invoiceDate: -1 });

module.exports = mongoose.model('Sale', SaleSchema);
