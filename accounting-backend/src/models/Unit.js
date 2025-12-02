// src/models/Unit.js
const mongoose = require('mongoose');

const UnitSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // main-app user id
    fullName: { type: String, required: true, trim: true },   // e.g., Kilogram
    aliasName: { type: String, trim: true, default: '' },     // e.g., kg

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId },
    updatedBy: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

// Unique per owner (ignore deleted) on fullName
UnitSchema.index(
    { ownerId: 1, fullName: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);

module.exports = mongoose.model('Unit', UnitSchema);
