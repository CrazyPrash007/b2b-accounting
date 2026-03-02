// src/models/UnregisteredContact.js
const mongoose = require('mongoose');

function normalizePhone(phone) {
    if (!phone) return '';
    let cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.length > 10 && cleaned.startsWith('91')) {
        cleaned = cleaned.substring(2);
    }
    return cleaned.slice(-10);
}

const UnregisteredContactSchema = new mongoose.Schema({
    // Contact details
    name: { type: String, trim: true, default: '' },
    mobileNorm: { type: String, trim: true, required: true },  // normalized 10-digit
    mobileRaw: { type: String, trim: true, default: '' },      // original format
    email: { type: String, trim: true, default: '' },
    companyName: { type: String, trim: true, default: '' },

    // Where this contact was first reported from
    source: { type: String, enum: ['customer', 'vendor'], default: 'customer' },

    // Tracking
    firstReportedBy: { type: mongoose.Schema.Types.ObjectId, default: null },  // User who first created this
    firstReportedAt: { type: Date, default: Date.now },
    reportCount: { type: Number, default: 1 },  // incremented on subsequent adds by different users

    // Admin outreach tracking
    isContacted: { type: Boolean, default: false },
    contactedAt: { type: Date, default: null },
    contactedBy: { type: String, default: '' },  // admin name or ID
    notes: { type: String, default: '' },

    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// Unique by normalized mobile number (ignore deleted)
UnregisteredContactSchema.index(
    { mobileNorm: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);

// For admin listing - most-reported first
UnregisteredContactSchema.index({ reportCount: -1 });
UnregisteredContactSchema.index({ isContacted: 1, reportCount: -1 });

module.exports = mongoose.model('UnregisteredContact', UnregisteredContactSchema);
