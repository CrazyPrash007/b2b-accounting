// src/models/Item.js
const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    accountCompanyName: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
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

    // MasterItem linkage (for global search / admin catalog)
    masterItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MasterItem', default: null },
    isFromMaster: { type: Boolean, default: false }, // true = selected from global search catalog

    // Website visibility & image for personal shop website
    showOnWebsite: { type: Boolean, default: true, index: true }, // Toggle to show/hide on shop website
    itemImage: { type: String, default: '' }, // Base64 encoded image data (data:image/...;base64,...)
    itemImageMimeType: { type: String, default: '' }, // MIME type of the image (image/jpeg, image/png, etc.)

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
