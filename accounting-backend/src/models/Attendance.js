const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    accountCompanyName: {
      type: String,
      required: true,
      trim: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'leave', 'half-day'],
      required: true,
    },
    leaveType: {
      type: String,
      enum: ['paid', 'unpaid', null],
      default: null,
    },
    halfDayType: {
      type: String,
      enum: ['paid', 'unpaid', null],
      default: null,
    },
    checkInTime: {
      type: String, // Format: "HH:mm"
      default: null,
    },
    checkOutTime: {
      type: String, // Format: "HH:mm"
      default: null,
    },
    isLateEntry: {
      type: Boolean,
      default: false,
    },
    isEarlyExit: {
      type: Boolean,
      default: false,
    },
    lateMinutes: {
      type: Number,
      default: 0,
    },
    earlyMinutes: {
      type: Number,
      default: 0,
    },
    workHours: {
      type: Number, // Total hours worked
      default: 0,
    },
    payableDays: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    isAutoMarked: {
      type: Boolean,
      default: false, // True if marked absent automatically
    },
    isLocked: {
      type: Boolean,
      default: false, // True when payroll is generated
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

// Indexes for common query patterns
attendanceSchema.index({ accountCompanyName: 1, staffId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ accountCompanyName: 1, date: -1 }); // For date-descending queries
attendanceSchema.index({ accountCompanyName: 1, staffId: 1, isDeleted: 1 });
attendanceSchema.index({ accountCompanyName: 1, isLocked: 1 });
attendanceSchema.index({ accountCompanyName: 1, status: 1, date: -1 }); // For status filtering
attendanceSchema.index({ accountCompanyName: 1, isDeleted: 1, date: -1 }); // For general listing

// Virtual for formatted date
attendanceSchema.virtual('dateFormatted').get(function () {
  return this.date.toISOString().split('T')[0];
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
