// src/models/Vendor.js
const mongoose = require('mongoose');

function normalizeString(v) {
    if (v === undefined || v === null) return "";
    return String(v).trim().replace(/\s+/g, ' ').toLowerCase();
}

const VendorSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    accountCompanyName: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },

    vendorName: { type: String, required: true, trim: true },
    name: { type: String, trim: true },
    mobileNumber: { type: String, default: '' },
    emailAddress: { type: String, default: '' },
    websiteLink: { type: String, default: '' },

    companyName: { type: String, default: '' },

    // Normalized fields
    vendorNameNorm: { type: String, trim: true, default: "" },
    companyNameNorm: { type: String, trim: true, default: "" },

    gstType: { type: String, default: 'Unregistered' },

    billingAddress: { type: String, default: '' },
    billingPinCode: { type: String, default: '' },
    billingVillage: { type: String, default: '' },
    billingTehsil: { type: String, default: '' },
    billingDistrict: { type: String, default: '' },
    billingState: { type: String, default: '' },
    billingCountry: { type: String, default: 'India' },

    sameAsBilling: { type: Boolean, default: true },
    shippingAddress: { type: String, default: '' },
    shippingPinCode: { type: String, default: '' },
    shippingVillage: { type: String, default: '' },
    shippingTehsil: { type: String, default: '' },
    shippingDistrict: { type: String, default: '' },
    shippingState: { type: String, default: '' },
    shippingCountry: { type: String, default: 'India' },

    openingBalanceType: { type: String, enum: ['Credit', 'Debit'], default: 'Credit' },
    openingBalanceAmount: { type: Number, default: 0 },

    // Chat integration
    chatUserId: { type: String, default: null }, // User ID from chat system (b2b-fullstack)
    chatConversationId: { type: String, default: null }, // Cached conversation ID

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId },
    updatedBy: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

/**
 * UNIQUE INDEX (FIXED)
 * Must include:
 * - ownerId
 * - accountCompanyName
 * - vendorNameNorm
 * - companyNameNorm
 */
VendorSchema.index(
    { ownerId: 1, accountCompanyName: 1, vendorNameNorm: 1, companyNameNorm: 1 },
    {
        unique: true,
        partialFilterExpression: { isDeleted: false },
        name: "unique_vendor_per_company"
    }
);

// pre-save: auto-normalize vendor/company names
VendorSchema.pre('save', function (next) {
    if (this.vendorName) this.vendorNameNorm = normalizeString(this.vendorName);
    if (this.companyName) this.companyNameNorm = normalizeString(this.companyName);
    next();
});

// pre findOneAndUpdate: also update normalized fields on change
VendorSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate() || {};
    const set = update.$set || update;

    if (set.vendorName !== undefined) {
        (update.$set = update.$set || {}).vendorNameNorm = normalizeString(set.vendorName);
    }
    if (set.companyName !== undefined) {
        (update.$set = update.$set || {}).companyNameNorm = normalizeString(set.companyName);
    }

    this.setUpdate(update);
    next();
});

module.exports = mongoose.model('Vendor', VendorSchema);
