// src/models/Staff.js
const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
    // Account company context (ObjectId for consistency with other models)
    accountCompanyName: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },

    // Personal Details
    name: { type: String, required: true, trim: true },
    fatherName: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date },
    dateOfJoining: { type: Date, required: true },

    // Contact Info
    mobile: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },

    // Aadhar Details
    aadharNumber: { type: String, trim: true, default: '' },
    aadharImage: { type: String, trim: true, default: '' }, // URL to image

    // Salary Details
    salaryType: {
        type: String,
        enum: ['monthly', 'daily'],
        default: 'monthly'
    },
    salaryAmount: { type: Number, default: 0 },
    sundayIncluded: { type: Boolean, default: true }, // For monthly salary

    // Bank Details
    bankAccountNumber: { type: String, trim: true, default: '' },
    bankIfscCode: { type: String, trim: true, default: '' },
    bankName: { type: String, trim: true, default: '' },
    upiId: { type: String, trim: true, default: '' },

    // Department/Role
    department: { type: String, trim: true, default: '' },
    designation: { type: String, trim: true, default: '' },

    // Status
    status: {
        type: String,
        enum: ['active', 'inactive', 'terminated'],
        default: 'active',
        index: true
    },

    // Exit details (if terminated)
    exitDate: { type: Date },
    exitReason: { type: String, trim: true, default: '' },

    // Meta fields
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId },
    updatedBy: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

// Compound indexes
StaffSchema.index({ accountCompanyName: 1, isDeleted: 1 });
StaffSchema.index({ accountCompanyName: 1, status: 1, isDeleted: 1 });
StaffSchema.index({ name: 'text', department: 'text', designation: 'text' });

module.exports = mongoose.model('Staff', StaffSchema);
