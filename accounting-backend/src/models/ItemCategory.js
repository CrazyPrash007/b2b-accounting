// src/models/ItemCategory.js
const mongoose = require('mongoose');

const ItemCategorySchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    accountCompanyName: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    subcategories: { type: [String], default: [] },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId },
    updatedBy: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

// Unique per owner (ignore deleted)
ItemCategorySchema.index(
    { ownerId: 1, accountCompanyName: 1, name: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);

module.exports = mongoose.model('ItemCategory', ItemCategorySchema);
