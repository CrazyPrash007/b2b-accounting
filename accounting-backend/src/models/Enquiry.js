// src/models/Enquiry.js
const mongoose = require('mongoose');

// Response subdocument schema
const ResponseSchema = new mongoose.Schema({
    responderId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    responderName: { type: String, trim: true, default: "" },
    responderCompany: { type: String, trim: true, default: "" },
    responderState: { type: String, trim: true, default: "" },
    responderMobile: { type: String, trim: true, default: "" },
    responderEmail: { type: String, trim: true, default: "" },
    price: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    message: { type: String, trim: true, default: "" },
    respondedAt: { type: Date, default: Date.now }
}, { _id: true });

const EnquirySchema = new mongoose.Schema({
    // Owner of this enquiry (user who created it)
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    
    // Account company context
    accountCompanyName: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    
    // Enquiry type: buy or sell
    enquiryType: { 
        type: String, 
        enum: ['buy', 'sell'], 
        required: true, 
        index: true 
    },
    
    // Product details
    productName: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: "" },
    subCategory: { type: String, trim: true, default: "" },
    quantity: { type: Number, default: 0 },
    unit: { type: String, trim: true, default: "" },
    expectedPrice: { type: Number, default: 0 },
    description: { type: String, trim: true, default: "" },
    
    // Target states for visibility
    targetStates: [{ type: String, trim: true }],
    
    // Creator information (denormalized for display)
    creatorName: { type: String, trim: true, default: "" },
    creatorCompany: { type: String, trim: true, default: "" },
    creatorState: { type: String, trim: true, default: "" },
    creatorMobile: { type: String, trim: true, default: "" },
    creatorEmail: { type: String, trim: true, default: "" },
    
    // Responses from other users
    responses: [ResponseSchema],
    
    // Status: open or closed
    status: { 
        type: String, 
        enum: ['open', 'closed'], 
        default: 'open',
        index: true 
    },
    
    // Validity period
    validUntil: { type: Date },
    
    // Meta/audit fields
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId },
    updatedBy: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

// Compound indexes for common queries
EnquirySchema.index({ ownerId: 1, isDeleted: 1 });
EnquirySchema.index({ status: 1, isDeleted: 1 });
EnquirySchema.index({ enquiryType: 1, status: 1, isDeleted: 1 });
EnquirySchema.index({ targetStates: 1, status: 1, isDeleted: 1 });

module.exports = mongoose.model('Enquiry', EnquirySchema);
