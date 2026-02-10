const mongoose = require('mongoose');

const attendanceConfigSchema = new mongoose.Schema(
  {
    accountCompanyName: {
      type: String,
      required: true,
      trim: true,
    },
    workingDaysPerMonth: {
      type: Number,
      default: 30,
      min: 1,
      max: 31,
    },
    standardWorkStartTime: {
      type: String, // Format: "HH:mm" (24-hour format)
      default: "09:00",
    },
    standardWorkEndTime: {
      type: String, // Format: "HH:mm" (24-hour format)
      default: "18:00",
    },
    lateEntryThresholdMinutes: {
      type: Number,
      default: 15, // Minutes after start time
    },
    earlyExitThresholdMinutes: {
      type: Number,
      default: 15, // Minutes before end time
    },
    lateMarksToHalfDay: {
      type: Number,
      default: 3, // X late marks = 1 half-day
    },
    halfDaysToFullDay: {
      type: Number,
      default: 2, // X half-days = 1 full day deduction
    },
    autoAbsentCutoffTime: {
      type: String, // Format: "HH:mm" (24-hour format)
      default: "23:59",
    },
    enableAutoAbsent: {
      type: Boolean,
      default: true,
    },
    weeklyOffDays: {
      type: [Number], // Array of day numbers (0=Sunday, 6=Saturday)
      default: [0], // Sunday by default
    },
    isActive: {
      type: Boolean,
      default: true,
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
attendanceConfigSchema.index({ accountCompanyName: 1, isDeleted: 1 });

const AttendanceConfig = mongoose.model('AttendanceConfig', attendanceConfigSchema);

module.exports = AttendanceConfig;
