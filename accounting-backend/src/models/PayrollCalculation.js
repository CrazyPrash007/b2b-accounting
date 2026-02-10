const mongoose = require('mongoose');

const salaryBreakdownSchema = new mongoose.Schema(
  {
    fromDate: Date,
    toDate: Date,
    salaryAmount: Number,
    workingDays: Number,
    dailyRate: Number,
    payableDays: Number,
    calculatedAmount: Number,
  },
  { _id: false }
);

const attendanceSummarySchema = new mongoose.Schema(
  {
    totalWorkingDays: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    paidLeaveDays: { type: Number, default: 0 },
    unpaidLeaveDays: { type: Number, default: 0 },
    paidHalfDays: { type: Number, default: 0 },
    unpaidHalfDays: { type: Number, default: 0 },
    lateMarks: { type: Number, default: 0 },
    earlyExits: { type: Number, default: 0 },
    latePenaltyDays: { type: Number, default: 0 },
    earlyPenaltyDays: { type: Number, default: 0 },
    totalPayableDays: { type: Number, default: 0 },
  },
  { _id: false }
);

const payrollCalculationSchema = new mongoose.Schema(
  {
    accountCompanyName: {
      type: String,
      required: true,
      trim: true,
    },
    payrollPeriodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayrollPeriod',
      required: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    salaryType: {
      type: String,
      enum: ['monthly', 'daily'],
      required: true,
    },
    // If salary changed during period, store breakdown
    hasSalaryIncrease: {
      type: Boolean,
      default: false,
    },
    salaryBreakdown: [salaryBreakdownSchema],
    // Attendance summary
    attendanceSummary: {
      type: attendanceSummarySchema,
      default: () => ({}),
    },
    // Salary calculation
    baseSalary: {
      type: Number,
      required: true,
    },
    finalSalary: {
      type: Number,
      required: true,
    },
    // Additions
    overtimePay: {
      type: Number,
      default: 0,
    },
    bonuses: {
      type: Number,
      default: 0,
    },
    allowances: {
      type: Number,
      default: 0,
    },
    totalAdditions: {
      type: Number,
      default: 0,
    },
    // Deductions
    latePenaltyAmount: {
      type: Number,
      default: 0,
    },
    advanceDeduction: {
      type: Number,
      default: 0,
    },
    otherDeductions: {
      type: Number,
      default: 0,
    },
    totalDeductions: {
      type: Number,
      default: 0,
    },
    // Net salary
    netSalary: {
      type: Number,
      required: true,
    },
    // Payment details
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid'],
      default: 'pending',
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    paymentMode: {
      type: String,
      enum: ['cash', 'bank-transfer', 'upi', 'cheque', null],
      default: null,
    },
    paymentReference: {
      type: String,
      trim: true,
      default: '',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
    lockedBy: {
      type: String,
      default: null,
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
payrollCalculationSchema.index({ accountCompanyName: 1, payrollPeriodId: 1, staffId: 1 }, { unique: true });
payrollCalculationSchema.index({ accountCompanyName: 1, staffId: 1, isDeleted: 1 });
payrollCalculationSchema.index({ accountCompanyName: 1, payrollPeriodId: 1, paymentStatus: 1 });

const PayrollCalculation = mongoose.model('PayrollCalculation', payrollCalculationSchema);

module.exports = PayrollCalculation;
