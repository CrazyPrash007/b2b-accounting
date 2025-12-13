// src/models/Item.js
const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    accountCompanyName: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true }, // canonical name (same as itemName)
    itemName: { type: String, trim: true }, // optional duplicate field if front-end uses itemName
    description: { type: String, default: '' },
    category: { type: String, default: '' },
    subCategory: { type: String, default: '' },
    brandName: { type: String, default: '' },
    gstRate: { type: Number, default: null }, // percentage (e.g., 18)
    hsnNo: { type: String, default: '' },

    itemType: { type: String, enum: ['Goods', 'Service'], default: 'Goods' }, // or 'type'
    type: { type: String }, // keep if some clients write `type`

    unit: { type: String, default: '' },

    buyPrice: { type: Number, default: 0 },
    sellPrice: { type: Number, default: 0 },

    openingStock: { type: Number, default: 0 },
    minStock: { type: Number, default: 0 },
    openingDate: { type: Date, default: null },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    createdBy: { type: mongoose.Schema.Types.ObjectId },
    updatedBy: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

// Unique per owner (ignore deleted)
ItemSchema.index(
    { ownerId: 1, accountCompanyName: 1, name: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);

module.exports = mongoose.model('Item', ItemSchema);
