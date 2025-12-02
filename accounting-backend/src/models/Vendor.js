// src/models/Vendor.js
const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // main-app user id
    vendorName: { type: String, required: true, trim: true },
    name: { type: String, trim: true }, // duplicate friendly name for lists / display
    mobileNumber: { type: String, default: '' },
    emailAddress: { type: String, default: '' },
    websiteLink: { type: String, default: '' },

    companyName: { type: String, default: '' },
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

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId },
    updatedBy: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

// Unique per owner (ignore deleted)
VendorSchema.index(
    { ownerId: 1, vendorName: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);

module.exports = mongoose.model('Vendor', VendorSchema);
