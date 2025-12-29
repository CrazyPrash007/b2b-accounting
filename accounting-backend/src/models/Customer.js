// src/models/Customer.js
const mongoose = require('mongoose');

function normalizeString(v) {
    if (v === undefined || v === null) return "";
    // trim, collapse multiple whitespace, lowercase
    return String(v).trim().replace(/\s+/g, ' ').toLowerCase();
}

const CustomerSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    accountCompanyName: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },

    // Basic Details
    customerName: { type: String, required: true, trim: true },
    name: { type: String, trim: true },
    mobileNumber: { type: String, trim: true, default: "" },
    emailAddress: { type: String, trim: true, default: "" },
    websiteLink: { type: String, trim: true, default: "" },

    // Company Details
    companyName: { type: String, trim: true, default: "" },

    // Normalized fields used for case-insensitive uniqueness
    customerNameNorm: { type: String, trim: true, default: "" },
    companyNameNorm: { type: String, trim: true, default: "" },

    gstType: { type: String, trim: true, default: "Unregistered" },

    // Billing Details
    billingAddress: { type: String, trim: true, default: "" },
    billingPinCode: { type: String, trim: true, default: "" },
    billingVillage: { type: String, trim: true, default: "" },
    billingTehsil: { type: String, trim: true, default: "" },
    billingDistrict: { type: String, trim: true, default: "" },
    billingState: { type: String, trim: true, default: "" },
    billingCountry: { type: String, trim: true, default: "India" },

    // Shipping Details
    sameAsBilling: { type: Boolean, default: true },
    shippingAddress: { type: String, trim: true, default: "" },
    shippingPinCode: { type: String, trim: true, default: "" },
    shippingVillage: { type: String, trim: true, default: "" },
    shippingTehsil: { type: String, trim: true, default: "" },
    shippingDistrict: { type: String, trim: true, default: "" },
    shippingState: { type: String, trim: true, default: "" },
    shippingCountry: { type: String, trim: true, default: "India" },

    // Opening Balance
    openingBalanceType: { type: String, enum: ["Credit", "Debit"], default: "Credit" },
    openingBalanceAmount: { type: Number, default: 0 },

    // Chat integration
    chatUserId: { type: String, default: null }, // User ID from chat system (b2b-fullstack)
    chatConversationId: { type: String, default: null }, // Cached conversation ID

    // meta / audit / flags
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId },
    updatedBy: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

// Create unique index on normalized fields (scoped to ownerId) and ignore soft-deleted docs
CustomerSchema.index(
    { ownerId: 1, accountCompanyName: 1, customerNameNorm: 1, companyNameNorm: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);


// Mongoose middleware to populate normalized fields on save
CustomerSchema.pre('save', function (next) {
    if (this.isModified('customerName') || this.isNew) {
        this.customerNameNorm = normalizeString(this.customerName);
    }
    if (this.isModified('companyName') || this.isNew) {
        this.companyNameNorm = normalizeString(this.companyName);
    }
    next();
});

// For findOneAndUpdate / findByIdAndUpdate etc.
// Note: in query middleware, `this` is the query. We must update the update object.
CustomerSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate() || {};
    // if using $set
    const set = update.$set || update;
    if (set.customerName !== undefined) {
        (update.$set = update.$set || {})['customerNameNorm'] = normalizeString(set.customerName);
    }
    if (set.companyName !== undefined) {
        (update.$set = update.$set || {})['companyNameNorm'] = normalizeString(set.companyName);
    }
    this.setUpdate(update);
    next();
});

module.exports = mongoose.model('Customer', CustomerSchema);
