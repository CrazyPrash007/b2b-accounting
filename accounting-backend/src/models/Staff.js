// src/models/Staff.js
const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
    // ── Company context ────────────────────────────────────────────────
    // * Required
    accountCompanyName: { type: String, required: true, trim: true, index: true },

    // ── Personal Details ───────────────────────────────────────────────
    // * Required
    name: { type: String, required: true, trim: true },
    fatherName: { type: String, trim: true, default: null },
    dateOfBirth: { type: Date, default: null },
    // * Required
    dateOfJoining: { type: Date, required: true },

    // ── Contact Info ───────────────────────────────────────────────────
    // Optional — null when not provided (never store empty strings)
    mobile: { type: String, trim: true, default: null },
    fatherMobileNumber: { type: String, trim: true, default: null },
    email: { type: String, trim: true, lowercase: true, default: null },
    address: { type: String, trim: true, default: null },

    // ── Aadhar Details ─────────────────────────────────────────────────
    aadharNumber: { type: String, trim: true, default: null },
    aadharImage: { type: String, trim: true, default: null },

    // ── Salary Details ─────────────────────────────────────────────────
    salaryType: {
        type: String,
        enum: ['monthly', 'daily'],
        default: 'monthly'
    },
    // * Required
    salaryAmount: { type: Number, required: true, default: 0, min: 0 },
    sundayIncluded: { type: Boolean, default: true },

    // ── Salary History ─────────────────────────────────────────────────
    salaryHistory: [{
        effectiveDate: { type: Date, required: true },
        previousSalary: { type: Number, required: true },
        increaseAmount: { type: Number, required: true },
        newSalary: { type: Number, required: true },
        remarks: { type: String, trim: true, default: null },
        createdAt: { type: Date, default: Date.now },
        createdBy: { type: mongoose.Schema.Types.ObjectId }
    }],

    // ── Bank Details ───────────────────────────────────────────────────
    bankAccountNumber: { type: String, trim: true, default: null },
    bankIfscCode: { type: String, trim: true, default: null },
    bankName: { type: String, trim: true, default: null },
    upiId: { type: String, trim: true, default: null },

    // ── Department / Role ──────────────────────────────────────────────
    department: { type: String, trim: true, default: null },
    designation: { type: String, trim: true, default: null },

    // ── Status ─────────────────────────────────────────────────────────
    status: {
        type: String,
        enum: ['active', 'inactive', 'terminated'],
        default: 'active',
        index: true
    },

    // ── Exit details (when terminated) ─────────────────────────────────
    exitDate: { type: Date, default: null },
    exitReason: { type: String, trim: true, default: null },

    // ── Pending Deductions (carry-forward to next payroll) ────────────
    pendingDeductions: {
        amount: { type: Number, default: 0, min: 0 },
        reason: { type: String, trim: true, default: null },
        addedAt: { type: Date, default: null },
        addedBy: { type: mongoose.Schema.Types.ObjectId, default: null }
    },

    // ── Meta fields ────────────────────────────────────────────────────
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId },
    updatedBy: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

// ── Pre-save: normalise empty strings → null ───────────────────────────
// Prevents empty-string values from violating unique / partial indexes.
const NULLABLE_STRING_PATHS = [
    'mobile', 'fatherMobileNumber', 'email', 'address',
    'aadharNumber', 'aadharImage',
    'bankAccountNumber', 'bankIfscCode', 'bankName', 'upiId',
    'department', 'designation',
    'fatherName', 'exitReason',
];

StaffSchema.pre('save', function (next) {
    for (const path of NULLABLE_STRING_PATHS) {
        const val = this[path];
        if (val !== undefined && val !== null && String(val).trim() === '') {
            this[path] = null;
        }
    }
    next();
});

StaffSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (update) {
        const target = update.$set || update;
        for (const path of NULLABLE_STRING_PATHS) {
            if (path in target && target[path] !== undefined && target[path] !== null && String(target[path]).trim() === '') {
                target[path] = null;
            }
        }
    }
    next();
});

// ── Indexes ────────────────────────────────────────────────────────────
// Compound indexes for common query patterns
StaffSchema.index({ accountCompanyName: 1, isDeleted: 1 });
StaffSchema.index({ accountCompanyName: 1, status: 1, isDeleted: 1 });
StaffSchema.index({ accountCompanyName: 1, department: 1, isDeleted: 1 });
StaffSchema.index({ accountCompanyName: 1, designation: 1, isDeleted: 1 });

// Text index for search functionality
StaffSchema.index({ name: 'text', department: 'text', designation: 'text' });

// Unique mobile *per company* — only enforced when mobile is not null.
// partialFilterExpression ensures documents with null mobile are ignored.
StaffSchema.index(
    { accountCompanyName: 1, mobile: 1 },
    {
        unique: true,
        partialFilterExpression: { mobile: { $type: 'string' } }
    }
);

// Non-unique email index scoped to company (for search performance)
StaffSchema.index(
    { accountCompanyName: 1, email: 1 },
    {
        partialFilterExpression: { email: { $type: 'string' } }
    }
);

// Index for date-based queries
StaffSchema.index({ dateOfJoining: -1 });

module.exports = mongoose.model('Staff', StaffSchema);
