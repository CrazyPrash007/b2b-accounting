// src/models/Gst.js
const mongoose = require('mongoose');

const GstSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // main-app user id
    rate: { type: Number, required: true },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId },
    updatedBy: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

// Optional: ensure same rate isn't inserted twice for same owner (ignore deleted)
GstSchema.index(
    { ownerId: 1, rate: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);

module.exports = mongoose.model('Gst', GstSchema);
