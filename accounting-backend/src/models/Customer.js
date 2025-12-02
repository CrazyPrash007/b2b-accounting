// src/models/Customer.js
const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // main-app user id

    // Basic Details
    customerName: { type: String, required: true, trim: true }, // main display name
    name: { type: String, trim: true }, // alias for table/display (frontend sets this to same as customerName)
    mobileNumber: { type: String, trim: true, default: "" },
    emailAddress: { type: String, trim: true, default: "" },
    websiteLink: { type: String, trim: true, default: "" },

    // Company Details
    companyName: { type: String, trim: true, default: "" },
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
    openingBalanceAmount: { type: Number, default: 0 }, // store as number; frontend sends string/number – convert will happen automatically if numeric

    // meta / audit / flags
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId },
    updatedBy: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

// Optional: unique per owner for customerName (ignore deleted)
// Remove or modify if you expect duplicate names for same owner.
CustomerSchema.index(
    { ownerId: 1, customerName: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);

module.exports = mongoose.model('Customer', CustomerSchema);
