// src/models/Enquiry.js
const mongoose = require('mongoose');

// Response subdocument schema
const ResponseSchema = new mongoose.Schema({
    responderId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    responderCompanyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true }, // Company ID of responder
    responderName: { type: String, trim: true, default: "" },
    responderCompany: { type: String, trim: true, default: "" },
    responderState: { type: String, trim: true, default: "" },
    responderMobile: { type: String, trim: true, default: "" },
    responderEmail: { type: String, trim: true, default: "" },
    price: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    unit: { type: String, trim: true, default: "" },
    message: { type: String, trim: true, default: "" },
    // Additional quotation details
    deliveryTime: { type: String, trim: true, default: "" }, // e.g., "3-5 days", "1 week"
    paymentTerms: { type: String, trim: true, default: "" }, // e.g., "50% advance", "COD"
    validityDays: { type: Number, default: 0 }, // How long this quote is valid
    additionalNotes: { type: String, trim: true, default: "" },
    // Response status tracking
    isViewed: { type: Boolean, default: false },
    viewedAt: { type: Date },
    respondedAt: { type: Date, default: Date.now },
    // Acceptance/Rejection status
    selectionStatus: { 
        type: String, 
        enum: ['pending', 'accepted', 'rejected'], 
        default: 'pending',
        index: true 
    },
    selectionStatusUpdatedAt: { type: Date },
    selectionNote: { type: String, trim: true, default: "" } // Note from enquiry owner
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
    
    // Distribution type: how the enquiry is sent
    distributionType: {
        type: String,
        enum: ['public', 'vendors'],
        required: true,
        default: 'public',
        index: true
    },
    
    // Target states for public enquiries (only vendors from these states can see)
    // Empty array means all states can see
    targetStates: [{ type: String, trim: true }],
    
    // Target vendors (only used when distributionType is 'vendors')
    // Stores vendor IDs from user's vendor list who are registered on the platform
    targetVendors: [{
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
        chatUserId: { type: String }, // User ID of vendor in the platform
        vendorName: { type: String, trim: true },
        companyName: { type: String, trim: true },
        mobile: { type: String, trim: true },
        email: { type: String, trim: true },
        notified: { type: Boolean, default: false },
        notifiedAt: { type: Date }
    }],
    
    // Product details
    productName: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: "" },
    subCategory: { type: String, trim: true, default: "" },
    quantity: { type: Number, default: 0 },
    unit: { type: String, trim: true, default: "" },
    expectedPrice: { type: Number, default: 0 },
    description: { type: String, trim: true, default: "" },
    
    // Specifications/requirements (additional product details)
    specifications: { type: String, trim: true, default: "" },
    
    // Delivery requirements
    deliveryLocation: { type: String, trim: true, default: "" },
    requiredByDate: { type: Date },
    
    // Creator information (denormalized for display)
    creatorName: { type: String, trim: true, default: "" },
    creatorCompany: { type: String, trim: true, default: "" },
    creatorState: { type: String, trim: true, default: "" },
    creatorMobile: { type: String, trim: true, default: "" },
    creatorEmail: { type: String, trim: true, default: "" },
    
    // Responses from other users
    responses: [ResponseSchema],
    
    // Selected/Accepted response
    selectedResponseId: { type: mongoose.Schema.Types.ObjectId, default: null },
    selectedResponderId: { type: mongoose.Schema.Types.ObjectId, default: null },
    selectedAt: { type: Date },
    
    // Response statistics (for quick access)
    responseCount: { type: Number, default: 0 },
    lowestPrice: { type: Number, default: null },
    highestPrice: { type: Number, default: null },
    avgPrice: { type: Number, default: null },
    
    // Status: open or closed
    status: { 
        type: String, 
        enum: ['open', 'closed'], 
        default: 'open',
        index: true 
    },
    
    // Reason for closing
    closureReason: { type: String, trim: true, default: "" },
    closedAt: { type: Date },
    
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
EnquirySchema.index({ distributionType: 1, status: 1, isDeleted: 1 });
EnquirySchema.index({ 'targetVendors.chatUserId': 1, status: 1, isDeleted: 1 });
EnquirySchema.index({ 'responses.responderId': 1 });

// Method to update response statistics
EnquirySchema.methods.updateResponseStats = function() {
    if (this.responses.length === 0) {
        this.responseCount = 0;
        this.lowestPrice = null;
        this.highestPrice = null;
        this.avgPrice = null;
        return;
    }
    
    const prices = this.responses.map(r => r.price).filter(p => p > 0);
    this.responseCount = this.responses.length;
    
    if (prices.length > 0) {
        this.lowestPrice = Math.min(...prices);
        this.highestPrice = Math.max(...prices);
        this.avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    }
};

module.exports = mongoose.model('Enquiry', EnquirySchema);
