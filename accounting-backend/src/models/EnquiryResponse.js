// src/models/EnquiryResponse.js
const mongoose = require('mongoose');

/**
 * EnquiryResponse - Tracks user's responses to enquiries
 * This is a separate collection to easily query "what enquiries have I responded to"
 * It mirrors the response subdocument in Enquiry but links back to the enquiry
 */
const EnquiryResponseSchema = new mongoose.Schema({
    // Who responded
    responderId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    responderCompanyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
    
    // Which enquiry was responded to
    enquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry', required: true, index: true },
    
    // Denormalized enquiry details for display (avoid populating)
    enquiryDetails: {
        enquiryType: { type: String, enum: ['buy', 'sell'] },
        productName: { type: String, trim: true },
        category: { type: String, trim: true },
        quantity: { type: Number },
        unit: { type: String, trim: true },
        expectedPrice: { type: Number },
        description: { type: String, trim: true },
        // Enquiry creator info
        creatorName: { type: String, trim: true },
        creatorCompany: { type: String, trim: true },
        creatorState: { type: String, trim: true },
        creatorMobile: { type: String, trim: true },
        creatorEmail: { type: String, trim: true },
        enquiryCreatedAt: { type: Date },
        enquiryStatus: { type: String, enum: ['open', 'closed'] }
    },
    
    // Response details (quotation)
    responderName: { type: String, trim: true, default: "" },
    responderCompany: { type: String, trim: true, default: "" },
    responderState: { type: String, trim: true, default: "" },
    responderMobile: { type: String, trim: true, default: "" },
    responderEmail: { type: String, trim: true, default: "" },
    
    // Quotation details
    price: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    unit: { type: String, trim: true, default: "" },
    message: { type: String, trim: true, default: "" },
    deliveryTime: { type: String, trim: true, default: "" },
    paymentTerms: { type: String, trim: true, default: "" },
    validityDays: { type: Number, default: 0 },
    additionalNotes: { type: String, trim: true, default: "" },
    
    // Status tracking
    status: { 
        type: String, 
        enum: ['pending', 'viewed', 'accepted', 'rejected', 'expired'],
        default: 'pending',
        index: true
    },
    
    // Selection status from enquiry owner
    selectionStatus: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
        index: true
    },
    selectionStatusUpdatedAt: { type: Date },
    selectionNote: { type: String, trim: true, default: "" }, // Note from enquiry owner
    
    // When the enquiry owner viewed this response
    viewedByOwner: { type: Boolean, default: false },
    viewedAt: { type: Date },
    
    // Meta fields
    isDeleted: { type: Boolean, default: false },
    respondedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Compound indexes
EnquiryResponseSchema.index({ responderId: 1, isDeleted: 1, respondedAt: -1 });
EnquiryResponseSchema.index({ responderId: 1, responderCompanyId: 1, isDeleted: 1, respondedAt: -1 });
// Unique index: same user with same company cannot respond twice to same enquiry
// But same user with different companies CAN respond to same enquiry
EnquiryResponseSchema.index({ enquiryId: 1, responderId: 1, responderCompanyId: 1 }, { unique: true });

module.exports = mongoose.model('EnquiryResponse', EnquiryResponseSchema);
