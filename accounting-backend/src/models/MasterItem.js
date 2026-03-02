// src/models/MasterItem.js
const mongoose = require('mongoose');

function normalizeString(v) {
    if (v === undefined || v === null) return "";
    return String(v).trim().replace(/\s+/g, ' ').toLowerCase();
}

const MasterItemSchema = new mongoose.Schema({
    // Canonical item identity (admin-curated)
    name: { type: String, required: true, trim: true },
    nameNorm: { type: String, trim: true, default: "" },
    description: { type: String, default: '' },
    brandName: { type: String, default: '' },
    itemType: { type: String, enum: ['Goods', 'Service'], default: 'Goods' },
    category: { type: String, default: '' },

    // Image (shared across all users who add this item)
    itemImage: { type: String, default: '' },
    itemImageMimeType: { type: String, default: '' },

    // Status for admin review workflow
    // active = visible in global search; pending_review = newly created, admin hasn't verified
    status: { type: String, enum: ['active', 'pending_review'], default: 'active' },

    // Pre-computed count of distinct users who've added this item
    userCount: { type: Number, default: 0 },

    // Reference to the first Item doc that spawned this MasterItem
    createdFromItemId: { type: mongoose.Schema.Types.ObjectId, default: null },

    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// Unique canonical name (ignore deleted)
MasterItemSchema.index(
    { nameNorm: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);

// For admin listing sorted by popularity
MasterItemSchema.index({ userCount: -1 });
MasterItemSchema.index({ status: 1, createdAt: -1 });

// Auto-normalize name on save
MasterItemSchema.pre('save', function (next) {
    if (this.isModified('name') || this.isNew) {
        this.nameNorm = normalizeString(this.name);
    }
    next();
});

// Auto-normalize on findOneAndUpdate
MasterItemSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate() || {};
    const set = update.$set || update;
    if (set.name !== undefined) {
        (update.$set = update.$set || {}).nameNorm = normalizeString(set.name);
    }
    this.setUpdate(update);
    next();
});

module.exports = mongoose.model('MasterItem', MasterItemSchema);
