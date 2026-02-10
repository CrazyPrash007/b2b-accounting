const Attendance = require('../models/Attendance');
const AttendanceConfig = require('../models/AttendanceConfig');
const Staff = require('../models/Staff');
const mongoose = require('mongoose');
const { calculatePayableDays, calculateTimeMetrics } = require('../utils/attendanceCalculations');

// Mark attendance for a single staff member
exports.markAttendance = async (req, res) => {
  try {
    const { staffId, date, status, leaveType, halfDayType, checkInTime, checkOutTime, remarks, accountCompanyName } = req.body;
    const userId = req.user?.ownerId || req.user?.id;

    if (!accountCompanyName) {
      return res.status(400).json({
        success: false,
        message: 'accountCompanyName is required',
      });
    }

    // Check if staff exists
    const staff = await Staff.findOne({
      _id: new mongoose.Types.ObjectId(staffId),
      accountCompanyName,
      isDeleted: false,
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    // Get attendance config
    const config = await AttendanceConfig.findOne({
      accountCompanyName,
      isDeleted: false,
    });

    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({
      accountCompanyName,
      staffId: new mongoose.Types.ObjectId(staffId),
      date: new Date(date),
      isDeleted: false,
    });

    if (existingAttendance) {
      // NEW: Prevent re-check-in after checkout
      if (existingAttendance.checkOutTime) {
        return res.status(400).json({
          success: false,
          message: 'Cannot check in again after checkout. This staff has already completed their shift for today.',
        });
      }

      // Return error for duplicate check-in attempts
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this staff member on this date. Please use the edit option to make changes.',
      });
    }

    // Create new attendance record
    // Skip time metrics calculation for leave/absent
    const timeMetrics = (status === 'present' || status === 'half-day')
      ? calculateTimeMetrics(checkInTime, checkOutTime, config)
      : { workHours: 0, isLateEntry: false, isEarlyExit: false, lateMinutes: 0, earlyMinutes: 0 };

    const payableDays = calculatePayableDays(status, leaveType, halfDayType);

    const attendance = new Attendance({
      accountCompanyName,
      staffId: new mongoose.Types.ObjectId(staffId),
      date: new Date(date),
      status,
      leaveType: status === 'leave' ? leaveType : null,
      halfDayType: status === 'half-day' ? halfDayType : null,
      // Ensure times are null for leave/absent
      checkInTime: (status === 'present' || status === 'half-day') ? (checkInTime || null) : null,
      checkOutTime: (status === 'present' || status === 'half-day') ? (checkOutTime || null) : null,
      workHours: timeMetrics.workHours,
      isLateEntry: timeMetrics.isLateEntry,
      isEarlyExit: timeMetrics.isEarlyExit,
      lateMinutes: timeMetrics.lateMinutes,
      earlyMinutes: timeMetrics.earlyMinutes,
      payableDays,
      remarks: remarks || '',
      isAutoMarked: false,
      createdBy: userId,
      updatedBy: userId,
    });

    await attendance.save();

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance,
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message,
    });
  }
};

// Bulk mark attendance for multiple staff on a single date
exports.bulkMarkAttendance = async (req, res) => {
  try {
    const { date, attendanceRecords, accountCompanyName } = req.body;
    const userId = req.user?.ownerId || req.user?.id;

    // Get attendance config
    const config = await AttendanceConfig.findOne({
      accountCompanyName,
      isDeleted: false,
    });

    const results = {
      success: [],
      failed: [],
      updated: [],
    };

    for (const record of attendanceRecords) {
      try {
        const { staffId, status, leaveType, halfDayType, checkInTime, checkOutTime, remarks } = record;

        // Check if staff exists
        const staff = await Staff.findOne({
          _id: new mongoose.Types.ObjectId(staffId),
          accountCompanyName,
          isDeleted: false,
        });

        if (!staff) {
          results.failed.push({ staffId, reason: 'Staff not found' });
          continue;
        }

        // Check if attendance already exists
        const existingAttendance = await Attendance.findOne({
          accountCompanyName,
          staffId: new mongoose.Types.ObjectId(staffId),
          date: new Date(date),
          isDeleted: false,
        });

        if (existingAttendance) {
          if (existingAttendance.isLocked) {
            results.failed.push({ staffId, reason: 'Attendance is locked' });
            continue;
          }

          // Update
          const timeMetrics = calculateTimeMetrics(checkInTime, checkOutTime, config);
          const payableDays = calculatePayableDays(status, leaveType, halfDayType);

          existingAttendance.status = status;
          existingAttendance.leaveType = status === 'leave' ? leaveType : null;
          existingAttendance.halfDayType = status === 'half-day' ? halfDayType : null;
          existingAttendance.checkInTime = checkInTime || null;
          existingAttendance.checkOutTime = checkOutTime || null;
          existingAttendance.workHours = timeMetrics.workHours;
          existingAttendance.isLateEntry = timeMetrics.isLateEntry;
          existingAttendance.isEarlyExit = timeMetrics.isEarlyExit;
          existingAttendance.lateMinutes = timeMetrics.lateMinutes;
          existingAttendance.earlyMinutes = timeMetrics.earlyMinutes;
          existingAttendance.payableDays = payableDays;
          existingAttendance.remarks = remarks || '';
          existingAttendance.isAutoMarked = false;
          existingAttendance.updatedBy = userId;

          await existingAttendance.save();
          results.updated.push({ staffId, staffName: staff.name });
        } else {
          // Create new
          const timeMetrics = calculateTimeMetrics(checkInTime, checkOutTime, config);
          const payableDays = calculatePayableDays(status, leaveType, halfDayType);

          const attendance = new Attendance({
            accountCompanyName,
            staffId: new mongoose.Types.ObjectId(staffId),
            date: new Date(date),
            status,
            leaveType: status === 'leave' ? leaveType : null,
            halfDayType: status === 'half-day' ? halfDayType : null,
            checkInTime: checkInTime || null,
            checkOutTime: checkOutTime || null,
            workHours: timeMetrics.workHours,
            isLateEntry: timeMetrics.isLateEntry,
            isEarlyExit: timeMetrics.isEarlyExit,
            lateMinutes: timeMetrics.lateMinutes,
            earlyMinutes: timeMetrics.earlyMinutes,
            payableDays,
            remarks: remarks || '',
            isAutoMarked: false,
            createdBy: userId,
            updatedBy: userId,
          });

          await attendance.save();
          results.success.push({ staffId, staffName: staff.name });
        }
      } catch (error) {
        results.failed.push({ staffId: record.staffId, reason: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Bulk attendance processing completed',
      data: results,
    });
  } catch (error) {
    console.error('Error in bulk mark attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk attendance',
      error: error.message,
    });
  }
};

// Get attendance records with filters
exports.getAttendance = async (req, res) => {
  try {
    const { staffId, fromDate, toDate, status, page = 1, limit = 100, accountCompanyName } = req.query;

    const query = {
      accountCompanyName,
      isDeleted: false,
    };

    if (staffId) {
      query.staffId = new mongoose.Types.ObjectId(staffId);
    }

    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [attendanceRecords, total] = await Promise.all([
      Attendance.find(query)
        .populate({
          path: 'staffId',
          select: 'name department designation',
          options: { lean: true }
        })
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Attendance.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: attendanceRecords,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error getting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance records',
      error: error.message,
    });
  }
};

// Get attendance summary for a staff member
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { fromDate, toDate, accountCompanyName } = req.query;

    const query = {
      accountCompanyName,
      staffId: new mongoose.Types.ObjectId(staffId),
      isDeleted: false,
    };

    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }

    const attendanceRecords = await Attendance.find(query).lean();

    const summary = {
      totalDays: attendanceRecords.length,
      presentDays: 0,
      absentDays: 0,
      leaveDays: 0,
      paidLeaveDays: 0,
      unpaidLeaveDays: 0,
      halfDays: 0,
      paidHalfDays: 0,
      unpaidHalfDays: 0,
      lateMarks: 0,
      earlyExits: 0,
      totalPayableDays: 0,
      totalWorkHours: 0,
    };

    attendanceRecords.forEach((record) => {
      summary.totalPayableDays += record.payableDays;
      summary.totalWorkHours += record.workHours || 0;

      if (record.status === 'present') summary.presentDays++;
      if (record.status === 'absent') summary.absentDays++;
      if (record.status === 'leave') {
        summary.leaveDays++;
        if (record.leaveType === 'paid') summary.paidLeaveDays++;
        if (record.leaveType === 'unpaid') summary.unpaidLeaveDays++;
      }
      if (record.status === 'half-day') {
        summary.halfDays++;
        if (record.halfDayType === 'paid') summary.paidHalfDays++;
        if (record.halfDayType === 'unpaid') summary.unpaidHalfDays++;
      }
      if (record.isLateEntry) summary.lateMarks++;
      if (record.isEarlyExit) summary.earlyExits++;
    });

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error getting attendance summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance summary',
      error: error.message,
    });
  }
};

// Auto-mark absent for staff without attendance on a date
exports.autoMarkAbsent = async (req, res) => {
  try {
    const { date, accountCompanyName } = req.body;
    const userId = req.user?.ownerId || req.user?.id;

    const targetDate = new Date(date);

    // Get attendance config
    const config = await AttendanceConfig.findOne({
      accountCompanyName,
      isDeleted: false,
    });

    if (!config || !config.enableAutoAbsent) {
      return res.status(400).json({
        success: false,
        message: 'Auto-absent is not enabled for this company',
      });
    }

    // Check if date is a weekly off
    const dayOfWeek = targetDate.getDay();
    if (config.weeklyOffDays.includes(dayOfWeek)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark absent on weekly off day',
      });
    }

    // Get all active staff
    const activeStaff = await Staff.find({
      accountCompanyName,
      status: 'active',
      isDeleted: false,
    }).lean();

    // Get existing attendance for this date
    const existingAttendance = await Attendance.find({
      accountCompanyName,
      date: targetDate,
      isDeleted: false,
    }).lean();

    const attendedStaffIds = new Set(existingAttendance.map((a) => a.staffId.toString()));

    // Find staff without attendance
    const absentStaff = activeStaff.filter((staff) => !attendedStaffIds.has(staff._id.toString()));

    // Create absent records
    const absentRecords = absentStaff.map((staff) => ({
      accountCompanyName,
      staffId: staff._id,
      date: targetDate,
      status: 'absent',
      payableDays: 0,
      isAutoMarked: true,
      remarks: 'Auto-marked absent',
      createdBy: userId,
      updatedBy: userId,
    }));

    if (absentRecords.length > 0) {
      await Attendance.insertMany(absentRecords);
    }

    res.status(200).json({
      success: true,
      message: `Auto-marked ${absentRecords.length} staff as absent`,
      data: {
        date: targetDate,
        markedAbsent: absentRecords.length,
      },
    });
  } catch (error) {
    console.error('Error auto-marking absent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-mark absent',
      error: error.message,
    });
  }
};

// Update attendance record
exports.updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const accountCompanyName = req.body.accountCompanyName;
    const userId = req.user?.ownerId || req.user?.id;

    const attendance = await Attendance.findOne({
      _id: new mongoose.Types.ObjectId(id),
      accountCompanyName,
      isDeleted: false,
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    if (attendance.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Attendance is locked for this period. Cannot modify.',
      });
    }

    const { status, leaveType, halfDayType, checkInTime, checkOutTime, remarks } = req.body;

    // Get attendance config
    const config = await AttendanceConfig.findOne({
      accountCompanyName,
      isDeleted: false,
    });

    if (status) attendance.status = status;
    if (status === 'leave') attendance.leaveType = leaveType;
    if (status === 'half-day') attendance.halfDayType = halfDayType;
    if (checkInTime !== undefined) attendance.checkInTime = checkInTime || null;
    if (checkOutTime !== undefined) attendance.checkOutTime = checkOutTime || null;
    if (remarks !== undefined) attendance.remarks = remarks;

    // Recalculate metrics
    const timeMetrics = calculateTimeMetrics(attendance.checkInTime, attendance.checkOutTime, config);
    attendance.workHours = timeMetrics.workHours;
    attendance.isLateEntry = timeMetrics.isLateEntry;
    attendance.isEarlyExit = timeMetrics.isEarlyExit;
    attendance.lateMinutes = timeMetrics.lateMinutes;
    attendance.earlyMinutes = timeMetrics.earlyMinutes;

    // Recalculate payable days
    attendance.payableDays = calculatePayableDays(attendance.status, attendance.leaveType, attendance.halfDayType);

    attendance.updatedBy = userId;

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance,
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance',
      error: error.message,
    });
  }
};

// Delete attendance record
exports.deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const accountCompanyName = req.query.accountCompanyName;
    const userId = req.user?.ownerId || req.user?.id;

    const attendance = await Attendance.findOne({
      _id: new mongoose.Types.ObjectId(id),
      accountCompanyName,
      isDeleted: false,
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    if (attendance.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Attendance is locked for this period. Cannot delete.',
      });
    }

    attendance.isDeleted = true;
    attendance.updatedBy = userId;
    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Attendance deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance',
      error: error.message,
    });
  }
};

// Get or create attendance config
exports.getAttendanceConfig = async (req, res) => {
  try {
    const accountCompanyName = req.query.accountCompanyName;
    const userId = req.user?.ownerId || req.user?.id;

    let config = await AttendanceConfig.findOne({
      accountCompanyName,
      isDeleted: false,
    });

    if (!config) {
      // Create default config
      config = new AttendanceConfig({
        accountCompanyName,
        createdBy: userId,
        updatedBy: userId,
      });
      await config.save();
    }

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error getting attendance config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance config',
      error: error.message,
    });
  }
};

// Update attendance config
exports.updateAttendanceConfig = async (req, res) => {
  try {
    const accountCompanyName = req.body.accountCompanyName;
    const userId = req.user?.ownerId || req.user?.id;

    let config = await AttendanceConfig.findOne({
      accountCompanyName,
      isDeleted: false,
    });

    if (!config) {
      config = new AttendanceConfig({
        accountCompanyName,
        ...req.body,
        createdBy: userId,
        updatedBy: userId,
      });
    } else {
      Object.assign(config, req.body);
      config.updatedBy = userId;
    }

    await config.save();

    res.status(200).json({
      success: true,
      message: 'Attendance config updated successfully',
      data: config,
    });
  } catch (error) {
    console.error('Error updating attendance config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance config',
      error: error.message,
    });
  }
};
