// src/models/Ad.js
const mongoose = require('mongoose');

// Business categories for targeting
const BUSINESS_CATEGORIES = [
    'Agriculture', 'Automotive', 'Banking & Finance', 'Chemicals', 'Construction',
    'Consumer Goods', 'Education', 'Electronics', 'Energy', 'Food & Beverage',
    'Healthcare', 'Hospitality', 'IT & Software', 'Manufacturing', 'Media & Entertainment',
    'Pharmaceuticals', 'Real Estate', 'Retail', 'Telecommunications', 'Textiles',
    'Transportation', 'Other'
];

// Ad positions in chat app
const AD_POSITIONS = ['AD 1', 'AD 2', 'AD 3', 'Center', 'SideBar 1', 'SideBar 2', 'SideBar 3'];

// Ad statuses
const AD_STATUSES = ['pending', 'approved', 'rejected', 'stopped'];

// Recommended dimensions for each position
const AD_DIMENSIONS = {
    'AD 1': { width: 248, height: 180, description: 'Right panel top ad' },
    'AD 2': { width: 248, height: 180, description: 'Right panel middle ad' },
    'AD 3': { width: 248, height: 180, description: 'Right panel bottom ad' },
    'Center': { width: 680, height: 120, description: 'Center wide banner' },
    'SideBar 1': { width: 280, height: 60, description: 'Left panel ad slot 1' },
    'SideBar 2': { width: 280, height: 60, description: 'Left panel ad slot 2' },
    'SideBar 3': { width: 280, height: 60, description: 'Left panel ad slot 3' }
};

// Indian states for targeting
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const AdSchema = new mongoose.Schema({
    // Ad content
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    imageUrl: {
        type: String,
        required: true,
        trim: true
    },
    linkUrl: {
        type: String,
        trim: true
    },
    linkTarget: {
        type: String,
        enum: ['_blank', '_self'],
        default: '_blank'
    },

    // Placement settings
    placement: {
        type: String,
        enum: ['chat', 'global'],
        default: 'chat'
    },
    position: {
        type: String,
        enum: AD_POSITIONS,
        required: true,
        default: 'AD 1'
    },

    // Schedule
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },

    // Status workflow
    status: {
        type: String,
        enum: AD_STATUSES,
        default: 'pending',
        index: true
    },
    rejectionReason: {
        type: String,
        trim: true
    },
    reviewedAt: {
        type: Date
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId
    },

    // Owner information (user who submitted the ad)
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    ownerName: {
        type: String,
        trim: true
    },
    companyName: {
        type: String,
        trim: true
    },
    contactEmail: {
        type: String,
        trim: true
    },
    contactPhone: {
        type: String,
        trim: true
    },

    // Targeting
    targetCategories: [{
        type: String,
        enum: BUSINESS_CATEGORIES
    }],
    targetStates: [{
        type: String,
        enum: INDIAN_STATES
    }],

    // Active status (admin can disable)
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },

    // Analytics
    impressions: {
        type: Number,
        default: 0
    },
    clicks: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for efficient querying
AdSchema.index({ ownerId: 1, status: 1 });
AdSchema.index({ companyId: 1, status: 1 });
AdSchema.index({ status: 1, isActive: 1, isDeleted: 1 });

// Virtual for CTR
AdSchema.virtual('ctr').get(function () {
    if (this.impressions === 0) return 0;
    return ((this.clicks / this.impressions) * 100).toFixed(2);
});

AdSchema.set('toJSON', { virtuals: true });
AdSchema.set('toObject', { virtuals: true });

const Ad = mongoose.model('Ad', AdSchema);

module.exports = {
    Ad,
    BUSINESS_CATEGORIES,
    AD_POSITIONS,
    AD_STATUSES,
    AD_DIMENSIONS,
    INDIAN_STATES
};
