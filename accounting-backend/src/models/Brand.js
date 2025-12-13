// src/models/Brand.js
const mongoose = require('mongoose');

const BrandSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    accountCompanyName: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    brandName: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId },
    updatedBy: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

// Optional: ensure same rate isn't inserted twice for same owner (ignore deleted)
BrandSchema.index(
    { ownerId: 1, accountCompanyName: 1, brandName: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);


module.exports = mongoose.model('Brand', BrandSchema);
