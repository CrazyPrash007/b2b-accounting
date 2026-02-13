// src/utils/attendanceCalculations.js

/**
 * Shared utility functions for attendance calculations
 * Extracted from controller to promote reusability and testability
 */

/**
 * Calculate payable days based on attendance status
 *
 * @param {string} status - Attendance status ('present', 'absent', 'leave', 'half-day')
 * @param {string} leaveType - Type of leave ('paid', 'unpaid') - only applicable for 'leave' status
 * @param {string} halfDayType - Type of half-day ('paid', 'unpaid') - only applicable for 'half-day' status
 * @returns {number} Payable days (0, 0.5, or 1)
 *
 * @example
 * calculatePayableDays('present', null, null) // returns 1
 * calculatePayableDays('leave', 'paid', null) // returns 1
 * calculatePayableDays('leave', 'unpaid', null) // returns 0
 * calculatePayableDays('half-day', null, 'paid') // returns 0.5
 */
const calculatePayableDays = (status, leaveType, halfDayType) => {
  if (status === 'present') return 1;
  if (status === 'absent') return 0;
  if (status === 'leave') {
    return leaveType === 'paid' ? 1 : 0;
  }
  if (status === 'half-day') {
    return halfDayType === 'paid' ? 0.5 : 0;
  }
  return 0;
};

/**
 * Calculate work hours and late/early penalties
 *
 * @param {string} checkInTime - Check-in time in HH:mm format (e.g., "09:30")
 * @param {string} checkOutTime - Check-out time in HH:mm format (e.g., "18:00")
 * @param {Object} config - Attendance configuration object
 * @param {string} config.standardWorkStartTime - Standard work start time
 * @param {string} config.standardWorkEndTime - Standard work end time
 * @param {number} config.lateEntryThresholdMinutes - Grace period for late entry
 * @param {number} config.earlyExitThresholdMinutes - Grace period for early exit
 * @returns {Object} Time metrics
 *
 * @example
 * const config = {
 *   standardWorkStartTime: '09:00',
 *   standardWorkEndTime: '18:00',
 *   lateEntryThresholdMinutes: 15,
 *   earlyExitThresholdMinutes: 15
 * };
 * calculateTimeMetrics('09:30', '18:00', config)
 * // returns {
 * //   workHours: 8.5,
 * //   isLateEntry: true,
 * //   isEarlyExit: false,
 * //   lateMinutes: 30,
 * //   earlyMinutes: 0
 * // }
 */
const calculateTimeMetrics = (checkInTime, checkOutTime, config) => {
  const metrics = {
    workHours: 0,
    isLateEntry: false,
    isEarlyExit: false,
    lateMinutes: 0,
    earlyMinutes: 0,
  };

  if (!checkInTime || !checkOutTime || !config) return metrics;

  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const checkInMinutes = parseTime(checkInTime);
  const checkOutMinutes = parseTime(checkOutTime);
  const startMinutes = parseTime(config.standardWorkStartTime);
  const endMinutes = parseTime(config.standardWorkEndTime);

  // Calculate work hours
  metrics.workHours = Math.max(0, (checkOutMinutes - checkInMinutes) / 60);

  // Check late entry
  if (checkInMinutes > startMinutes + config.lateEntryThresholdMinutes) {
    metrics.isLateEntry = true;
    metrics.lateMinutes = checkInMinutes - startMinutes;
  }

  // Check early exit
  if (checkOutMinutes < endMinutes - config.earlyExitThresholdMinutes) {
    metrics.isEarlyExit = true;
    metrics.earlyMinutes = endMinutes - checkOutMinutes;
  }

  return metrics;
};

/**
 * Parse time string to minutes since midnight
 * Helper function for time-based calculations
 *
 * @param {string} timeStr - Time in HH:mm format
 * @returns {number} Minutes since midnight
 *
 * @example
 * parseTimeToMinutes('09:30') // returns 570
 * parseTimeToMinutes('18:00') // returns 1080
 */
const parseTimeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Format minutes to HH:mm time string
 *
 * @param {number} minutes - Minutes since midnight
 * @returns {string} Time in HH:mm format
 *
 * @example
 * formatMinutesToTime(570) // returns "09:30"
 * formatMinutesToTime(1080) // returns "18:00"
 */
const formatMinutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

module.exports = {
  calculatePayableDays,
  calculateTimeMetrics,
  parseTimeToMinutes,
  formatMinutesToTime
};
