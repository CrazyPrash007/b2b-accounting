// src/models/Contra.js
const mongoose = require('mongoose');

const ContraSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    accountCompanyName: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    
    // Contra entry details
    date: { type: Date, default: Date.now },
    fromAccount: { type: String, trim: true, required: true }, // Source account (Cash/Bank)
    toAccount: { type: String, trim: true, required: true },   // Destination account (Cash/Bank)
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true, default: '' },
    type: { type: String, default: 'Contra Entry' }, // "Contra Entry", "Bank to Cash", etc.
    
    // metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// index to help lookup contra entries by owner/date
ContraSchema.index({ ownerId: 1, accountCompanyName: 1, date: -1 });

module.exports = mongoose.model('Contra', ContraSchema);
