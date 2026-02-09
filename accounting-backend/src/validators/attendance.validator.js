const Joi = require('joi');

const markAttendanceSchema = Joi.object({
  accountCompanyName: Joi.string().required(),
  staffId: Joi.string().required(),
  date: Joi.date().required(),
  status: Joi.string().valid('present', 'absent', 'leave', 'half-day').required(),
  leaveType: Joi.string().valid('paid', 'unpaid').when('status', {
    is: 'leave',
    then: Joi.required(),
    otherwise: Joi.optional().allow(null, ''),
  }),
  halfDayType: Joi.string().valid('paid', 'unpaid').when('status', {
    is: 'half-day',
    then: Joi.optional(),
    otherwise: Joi.optional().allow(null, ''),
  }),
  checkInTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional()
    .allow(null, '')
    .empty('')
    .default(null),
  checkOutTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional()
    .allow(null, '')
    .empty('')
    .default(null),
  remarks: Joi.string().optional().allow(''),
});

const bulkMarkAttendanceSchema = Joi.object({
  accountCompanyName: Joi.string().required(),
  date: Joi.date().required(),
  attendanceRecords: Joi.array().items(
    Joi.object({
      staffId: Joi.string().required(),
      status: Joi.string().valid('present', 'absent', 'leave', 'half-day').required(),
      leaveType: Joi.string().valid('paid', 'unpaid').optional().allow(null, ''),
      halfDayType: Joi.string().valid('paid', 'unpaid').optional().allow(null, ''),
      checkInTime: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .optional()
        .allow(null, '')
        .empty('')
        .default(null),
      checkOutTime: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .optional()
        .allow(null, '')
        .empty('')
        .default(null),
      remarks: Joi.string().optional().allow(''),
    })
  ).min(1).required(),
});

const updateAttendanceSchema = Joi.object({
  accountCompanyName: Joi.string().optional(),
  status: Joi.string().valid('present', 'absent', 'leave', 'half-day').optional(),
  leaveType: Joi.string().valid('paid', 'unpaid').optional().allow(null, ''),
  halfDayType: Joi.string().valid('paid', 'unpaid').optional().allow(null, ''),
  checkInTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().allow(null, '').empty('').default(null),
  checkOutTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().allow(null, '').empty('').default(null),
  remarks: Joi.string().optional().allow(''),
});

const attendanceConfigSchema = Joi.object({
  accountCompanyName: Joi.string().optional(),
  workingDaysPerMonth: Joi.number().min(1).max(31).optional(),
  standardWorkStartTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  standardWorkEndTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  lateEntryThresholdMinutes: Joi.number().min(0).optional(),
  earlyExitThresholdMinutes: Joi.number().min(0).optional(),
  lateMarksToHalfDay: Joi.number().min(1).optional(),
  halfDaysToFullDay: Joi.number().min(1).optional(),
  autoAbsentCutoffTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  enableAutoAbsent: Joi.boolean().optional(),
  weeklyOffDays: Joi.array().items(Joi.number().min(0).max(6)).optional(),
});

module.exports = {
  markAttendanceSchema,
  bulkMarkAttendanceSchema,
  updateAttendanceSchema,
  attendanceConfigSchema,
};
