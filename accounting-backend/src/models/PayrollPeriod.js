const mongoose = require('mongoose');

const payrollPeriodSchema = new mongoose.Schema(
  {
    accountCompanyName: {
      type: String,
      required: true,
      trim: true,
    },
    periodName: {
      type: String,
      required: true,
      trim: true,
      // e.g., "January 2026", "Dec 26-25 Jan", etc.
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'calculated', 'approved', 'paid', 'closed'],
      default: 'draft',
    },
    totalStaff: {
      type: Number,
      default: 0,
    },
    totalPayableSalary: {
      type: Number,
      default: 0,
    },
    totalPaidSalary: {
      type: Number,
      default: 0,
    },
    calculatedAt: {
      type: Date,
      default: null,
    },
    calculatedBy: {
      type: String,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: String,
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
payrollPeriodSchema.index({ accountCompanyName: 1, fromDate: 1, toDate: 1 });
payrollPeriodSchema.index({ accountCompanyName: 1, status: 1, isDeleted: 1 });

const PayrollPeriod = mongoose.model('PayrollPeriod', payrollPeriodSchema);

module.exports = PayrollPeriod;
