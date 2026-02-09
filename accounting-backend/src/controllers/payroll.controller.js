const PayrollPeriod = require('../models/PayrollPeriod');
const PayrollCalculation = require('../models/PayrollCalculation');
const Attendance = require('../models/Attendance');
const AttendanceConfig = require('../models/AttendanceConfig');
const Staff = require('../models/Staff');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const Bank = require('../models/Bank');
const mongoose = require('mongoose');

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Extract accountCompanyName from request (body for POST/PUT, query for GET) */
const getCompanyName = (req) =>
  req.body?.accountCompanyName || req.query?.accountCompanyName;

/** Extract userId from auth context */
const getUserId = (req) => req.user?.ownerId || req.user?.id;

// Helper function to get salary for a specific date
const getSalaryForDate = (staff, date) => {
  if (!staff.salaryHistory || staff.salaryHistory.length === 0) {
    return staff.salaryAmount || 0;
  }

  // Sort salary history by effective date (descending)
  const sortedHistory = [...staff.salaryHistory].sort((a, b) => 
    new Date(b.effectiveDate) - new Date(a.effectiveDate)
  );

  // Find the applicable salary for the given date
  for (const history of sortedHistory) {
    if (new Date(history.effectiveDate) <= new Date(date)) {
      return history.newSalary;
    }
  }

  // If no history entry applies, return the initial salary amount
  return staff.salaryAmount || 0;
};

// Helper function to split salary periods if salary increased mid-period
const splitSalaryPeriods = (staff, fromDate, toDate) => {
  const periods = [];
  
  if (!staff.salaryHistory || staff.salaryHistory.length === 0) {
    // No salary increase, single period
    return [{
      fromDate,
      toDate,
      salaryAmount: staff.salaryAmount || 0,
    }];
  }

  // Get salary increases within the period
  const relevantIncreases = staff.salaryHistory
    .filter(h => {
      const effectiveDate = new Date(h.effectiveDate);
      return effectiveDate > new Date(fromDate) && effectiveDate <= new Date(toDate);
    })
    .sort((a, b) => new Date(a.effectiveDate) - new Date(b.effectiveDate));

  if (relevantIncreases.length === 0) {
    // No increase in this period
    return [{
      fromDate,
      toDate,
      salaryAmount: getSalaryForDate(staff, fromDate),
    }];
  }

  // Split into multiple periods
  let currentFromDate = new Date(fromDate);

  for (let i = 0; i < relevantIncreases.length; i++) {
    const increase = relevantIncreases[i];
    const increaseDate = new Date(increase.effectiveDate);
    
    // Period before increase
    const periodEndDate = new Date(increaseDate);
    periodEndDate.setDate(periodEndDate.getDate() - 1);
    
    periods.push({
      fromDate: new Date(currentFromDate),
      toDate: periodEndDate,
      salaryAmount: getSalaryForDate(staff, currentFromDate),
    });

    // Update current from date
    currentFromDate = increaseDate;
  }

  // Add final period (from last increase to period end)
  periods.push({
    fromDate: new Date(currentFromDate),
    toDate: new Date(toDate),
    salaryAmount: getSalaryForDate(staff, currentFromDate),
  });

  return periods;
};

// Helper function to calculate attendance summary
const calculateAttendanceSummary = async (staffId, fromDate, toDate, accountCompanyName, config) => {
  const attendanceRecords = await Attendance.find({
    accountCompanyName,
    staffId: new mongoose.Types.ObjectId(staffId),
    date: { $gte: new Date(fromDate), $lte: new Date(toDate) },
    isDeleted: false,
  }).lean();

  const summary = {
    totalWorkingDays: 0,
    presentDays: 0,
    absentDays: 0,
    paidLeaveDays: 0,
    unpaidLeaveDays: 0,
    paidHalfDays: 0,
    unpaidHalfDays: 0,
    lateMarks: 0,
    earlyExits: 0,
    latePenaltyDays: 0,
    earlyPenaltyDays: 0,
    totalPayableDays: 0,
  };

  // Calculate working days (excluding weekly offs)
  const start = new Date(fromDate);
  const end = new Date(toDate);
  let workingDays = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (!config.weeklyOffDays.includes(dayOfWeek)) {
      workingDays++;
    }
  }

  summary.totalWorkingDays = workingDays;

  // Process attendance records
  attendanceRecords.forEach(record => {
    summary.totalPayableDays += record.payableDays;

    if (record.status === 'present') summary.presentDays++;
    if (record.status === 'absent') summary.absentDays++;
    if (record.status === 'leave') {
      if (record.leaveType === 'paid') summary.paidLeaveDays++;
      if (record.leaveType === 'unpaid') summary.unpaidLeaveDays++;
    }
    if (record.status === 'half-day') {
      if (record.halfDayType === 'paid') summary.paidHalfDays++;
      if (record.halfDayType === 'unpaid') summary.unpaidHalfDays++;
    }
    if (record.isLateEntry) summary.lateMarks++;
    if (record.isEarlyExit) summary.earlyExits++;
  });

  // Calculate late/early penalties
  if (config.lateMarksToHalfDay && summary.lateMarks >= config.lateMarksToHalfDay) {
    const halfDaysFromLate = Math.floor(summary.lateMarks / config.lateMarksToHalfDay);
    summary.latePenaltyDays = halfDaysFromLate * 0.5;
  }

  if (config.halfDaysToFullDay) {
    const totalPenaltyHalfDays = Math.floor(summary.latePenaltyDays / 0.5);
    if (totalPenaltyHalfDays >= config.halfDaysToFullDay) {
      const fullDaysFromHalfDays = Math.floor(totalPenaltyHalfDays / config.halfDaysToFullDay);
      summary.latePenaltyDays = fullDaysFromHalfDays;
    }
  }

  // Adjust total payable days for penalties
  summary.totalPayableDays = Math.max(0, summary.totalPayableDays - summary.latePenaltyDays - summary.earlyPenaltyDays);

  return summary;
};

// Create payroll period
exports.createPayrollPeriod = async (req, res) => {
  try {
    const { periodName, fromDate, toDate, remarks } = req.body;
    const accountCompanyName = getCompanyName(req);
    const userId = getUserId(req);

    // Check if period already exists with overlapping dates
    const existingPeriod = await PayrollPeriod.findOne({
      accountCompanyName,
      isDeleted: false,
      $or: [
        {
          fromDate: { $lte: new Date(toDate) },
          toDate: { $gte: new Date(fromDate) },
        },
      ],
    });

    if (existingPeriod) {
      return res.status(400).json({
        success: false,
        message: 'A payroll period with overlapping dates already exists',
      });
    }

    const payrollPeriod = new PayrollPeriod({
      accountCompanyName,
      periodName,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      remarks: remarks || '',
      createdBy: userId,
      updatedBy: userId,
    });

    await payrollPeriod.save();

    res.status(201).json({
      success: true,
      message: 'Payroll period created successfully',
      data: payrollPeriod,
    });
  } catch (error) {
    console.error('Error creating payroll period:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payroll period',
      error: error.message,
    });
  }
};

// Get all payroll periods
exports.getPayrollPeriods = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const accountCompanyName = getCompanyName(req);

    const query = {
      accountCompanyName,
      isDeleted: false,
    };

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [periods, total] = await Promise.all([
      PayrollPeriod.find(query)
        .sort({ fromDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      PayrollPeriod.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: periods,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error getting payroll periods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payroll periods',
      error: error.message,
    });
  }
};

// Get single payroll period
exports.getPayrollPeriod = async (req, res) => {
  try {
    const { id } = req.params;
    const accountCompanyName = getCompanyName(req);

    const period = await PayrollPeriod.findOne({
      _id: new mongoose.Types.ObjectId(id),
      accountCompanyName,
      isDeleted: false,
    }).lean();

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Payroll period not found',
      });
    }

    res.status(200).json({
      success: true,
      data: period,
    });
  } catch (error) {
    console.error('Error getting payroll period:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payroll period',
      error: error.message,
    });
  }
};

// Calculate payroll for a period
exports.calculatePayroll = async (req, res) => {
  try {
    const { payrollPeriodId, staffIds } = req.body;
    const accountCompanyName = getCompanyName(req);
    const userId = getUserId(req);

    // Get payroll period
    const period = await PayrollPeriod.findOne({
      _id: new mongoose.Types.ObjectId(payrollPeriodId),
      accountCompanyName,
      isDeleted: false,
    });

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Payroll period not found',
      });
    }

    // Get attendance config
    const config = await AttendanceConfig.findOne({
      accountCompanyName,
      isDeleted: false,
    });

    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Attendance configuration not found. Please configure attendance settings first.',
      });
    }

    // Get staff to calculate for
    const staffQuery = {
      accountCompanyName,
      status: 'active',
      isDeleted: false,
    };

    if (staffIds && staffIds.length > 0) {
      staffQuery._id = { $in: staffIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const staffList = await Staff.find(staffQuery).lean();

    const calculations = [];
    const errors = [];

    for (const staff of staffList) {
      try {
        // Check if calculation already exists
        let calculation = await PayrollCalculation.findOne({
          accountCompanyName,
          payrollPeriodId: period._id,
          staffId: staff._id,
          isDeleted: false,
        });

        // Get attendance summary
        const attendanceSummary = await calculateAttendanceSummary(
          staff._id,
          period.fromDate,
          period.toDate,
          accountCompanyName,
          config
        );

        // Split salary periods if there were increases
        const salaryPeriods = splitSalaryPeriods(staff, period.fromDate, period.toDate);
        const hasSalaryIncrease = salaryPeriods.length > 1;

        // Calculate salary for each period
        const salaryBreakdown = [];
        let totalCalculatedAmount = 0;

        for (const salaryPeriod of salaryPeriods) {
          // Calculate working days in this sub-period
          let workingDaysInPeriod = 0;
          const start = new Date(salaryPeriod.fromDate);
          const end = new Date(salaryPeriod.toDate);

          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            if (!config.weeklyOffDays.includes(dayOfWeek)) {
              workingDaysInPeriod++;
            }
          }

          // Get attendance for this sub-period
          const periodAttendance = await Attendance.find({
            accountCompanyName,
            staffId: staff._id,
            date: { $gte: salaryPeriod.fromDate, $lte: salaryPeriod.toDate },
            isDeleted: false,
          }).lean();

          const periodPayableDays = periodAttendance.reduce((sum, a) => sum + a.payableDays, 0);

          // Calculate daily rate
          let dailyRate = 0;
          if (staff.salaryType === 'monthly') {
            dailyRate = salaryPeriod.salaryAmount / config.workingDaysPerMonth;
          } else {
            dailyRate = salaryPeriod.salaryAmount;
          }

          // Calculate amount for this period
          const calculatedAmount = dailyRate * periodPayableDays;

          salaryBreakdown.push({
            fromDate: salaryPeriod.fromDate,
            toDate: salaryPeriod.toDate,
            salaryAmount: salaryPeriod.salaryAmount,
            workingDays: workingDaysInPeriod,
            dailyRate,
            payableDays: periodPayableDays,
            calculatedAmount,
          });

          totalCalculatedAmount += calculatedAmount;
        }

        // Calculate final salary
        const finalSalary = totalCalculatedAmount;
        const totalAdditions = 0; // Can be added later
        const totalDeductions = 0; // Can be added later
        const netSalary = finalSalary + totalAdditions - totalDeductions;

        if (calculation) {
          // Update existing calculation
          calculation.salaryType = staff.salaryType;
          calculation.hasSalaryIncrease = hasSalaryIncrease;
          calculation.salaryBreakdown = salaryBreakdown;
          calculation.attendanceSummary = attendanceSummary;
          calculation.baseSalary = staff.salaryAmount;
          calculation.finalSalary = finalSalary;
          calculation.totalAdditions = totalAdditions;
          calculation.totalDeductions = totalDeductions;
          calculation.netSalary = netSalary;
          calculation.updatedBy = userId;
        } else {
          // Create new calculation
          calculation = new PayrollCalculation({
            accountCompanyName,
            payrollPeriodId: period._id,
            staffId: staff._id,
            fromDate: period.fromDate,
            toDate: period.toDate,
            salaryType: staff.salaryType,
            hasSalaryIncrease,
            salaryBreakdown,
            attendanceSummary,
            baseSalary: staff.salaryAmount,
            finalSalary,
            totalAdditions,
            totalDeductions,
            netSalary,
            createdBy: userId,
            updatedBy: userId,
          });
        }

        await calculation.save();
        calculations.push({
          staffId: staff._id,
          staffName: staff.name,
          netSalary,
        });

      } catch (error) {
        errors.push({
          staffId: staff._id,
          staffName: staff.name,
          error: error.message,
        });
      }
    }

    // Update payroll period
    period.totalStaff = calculations.length;
    period.totalPayableSalary = calculations.reduce((sum, c) => sum + c.netSalary, 0);
    period.status = 'calculated';
    period.calculatedAt = new Date();
    period.calculatedBy = userId;
    period.updatedBy = userId;
    await period.save();

    res.status(200).json({
      success: true,
      message: `Payroll calculated for ${calculations.length} staff members`,
      data: {
        period,
        calculations,
        errors,
      },
    });
  } catch (error) {
    console.error('Error calculating payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate payroll',
      error: error.message,
    });
  }
};

// Get payroll calculations for a period
exports.getPayrollCalculations = async (req, res) => {
  try {
    const { payrollPeriodId } = req.params;
    const accountCompanyName = getCompanyName(req);

    const calculations = await PayrollCalculation.find({
      accountCompanyName,
      payrollPeriodId: new mongoose.Types.ObjectId(payrollPeriodId),
      isDeleted: false,
    })
      .populate('staffId', 'name department designation mobile email')
      .sort({ 'staffId.name': 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: calculations,
    });
  } catch (error) {
    console.error('Error getting payroll calculations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payroll calculations',
      error: error.message,
    });
  }
};

// Get single payroll calculation
exports.getPayrollCalculation = async (req, res) => {
  try {
    const { id } = req.params;
    const accountCompanyName = getCompanyName(req);

    const calculation = await PayrollCalculation.findOne({
      _id: new mongoose.Types.ObjectId(id),
      accountCompanyName,
      isDeleted: false,
    })
      .populate('staffId')
      .populate('payrollPeriodId')
      .lean();

    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Payroll calculation not found',
      });
    }

    res.status(200).json({
      success: true,
      data: calculation,
    });
  } catch (error) {
    console.error('Error getting payroll calculation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payroll calculation',
      error: error.message,
    });
  }
};

// Update payroll calculation (add bonuses, deductions, etc.)
exports.updatePayrollCalculation = async (req, res) => {
  try {
    const { id } = req.params;
    const accountCompanyName = getCompanyName(req);
    const userId = getUserId(req);

    const calculation = await PayrollCalculation.findOne({
      _id: new mongoose.Types.ObjectId(id),
      accountCompanyName,
      isDeleted: false,
    });

    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Payroll calculation not found',
      });
    }

    if (calculation.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Payroll calculation is locked and cannot be modified',
      });
    }

    const { overtimePay, bonuses, allowances, advanceDeduction, otherDeductions, remarks } = req.body;

    if (overtimePay !== undefined) calculation.overtimePay = overtimePay;
    if (bonuses !== undefined) calculation.bonuses = bonuses;
    if (allowances !== undefined) calculation.allowances = allowances;
    if (advanceDeduction !== undefined) calculation.advanceDeduction = advanceDeduction;
    if (otherDeductions !== undefined) calculation.otherDeductions = otherDeductions;
    if (remarks !== undefined) calculation.remarks = remarks;

    // Recalculate totals
    calculation.totalAdditions = (calculation.overtimePay || 0) + (calculation.bonuses || 0) + (calculation.allowances || 0);
    calculation.totalDeductions = (calculation.latePenaltyAmount || 0) + (calculation.advanceDeduction || 0) + (calculation.otherDeductions || 0);
    calculation.netSalary = calculation.finalSalary + calculation.totalAdditions - calculation.totalDeductions;

    calculation.updatedBy = userId;
    await calculation.save();

    res.status(200).json({
      success: true,
      message: 'Payroll calculation updated successfully',
      data: calculation,
    });
  } catch (error) {
    console.error('Error updating payroll calculation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payroll calculation',
      error: error.message,
    });
  }
};

// Record payment for payroll (with Bank + Expense integration)
exports.recordPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { payrollCalculationId, paidAmount, paymentDate, paymentMode, paymentReference, remarks, bankId } = req.body;
    const accountCompanyName = getCompanyName(req);
    const userId = getUserId(req);
    const ownerId = req.user?.ownerId || req.user?.id;

    // Convert accountCompanyName to ObjectId for Bank/Expense/Payment queries
    let companyObjectId;
    try {
      companyObjectId = new mongoose.Types.ObjectId(accountCompanyName);
    } catch (_) {
      companyObjectId = accountCompanyName; // fallback if already an ObjectId
    }

    const calculation = await PayrollCalculation.findOne({
      _id: new mongoose.Types.ObjectId(payrollCalculationId),
      accountCompanyName,
      isDeleted: false,
    }).populate('staffId', 'name department designation').session(session);

    if (!calculation) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Payroll calculation not found' });
    }

    const remainingAmount = calculation.netSalary - (calculation.paidAmount || 0);
    if (paidAmount > remainingAmount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Payment amount (${paidAmount}) exceeds remaining balance (${remainingAmount})`,
      });
    }

    // If paying via bank, validate the bank account
    let bankDoc = null;
    if (paymentMode !== 'cash' && bankId) {
      bankDoc = await Bank.findOne({
        _id: new mongoose.Types.ObjectId(bankId),
        ownerId: new mongoose.Types.ObjectId(ownerId),
        accountCompanyName: companyObjectId,
        isDeleted: false,
        isActive: true,
      }).session(session);

      if (!bankDoc) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: 'Bank account not found or inactive' });
      }
    }

    // Determine paymentMethod string for Payment model (maps to dashboard balance calc)
    const paymentMethodStr = paymentMode === 'cash' ? 'Cash' : 'Bank Transfer';

    const staffName = calculation.staffId?.name || 'Staff';

    // 1. Create Payment entry (this affects bank/cash balance in dashboard)
    const paymentDoc = await Payment.create([{
      ownerId: new mongoose.Types.ObjectId(ownerId),
      accountCompanyName: companyObjectId,
      party: staffName,
      date: new Date(paymentDate),
      amount: paidAmount,
      paymentMethod: paymentMethodStr,
      referenceNumber: paymentReference || '',
      description: `Salary payment - ${staffName}`,
      createdBy: new mongoose.Types.ObjectId(ownerId),
    }], { session });

    // 2. Create Expense entry (for expense tracking/reports)
    const periodInfo = calculation.fromDate && calculation.toDate
      ? ` (${new Date(calculation.fromDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })})`
      : '';

    await Expense.create([{
      ownerId: new mongoose.Types.ObjectId(ownerId),
      accountCompanyName: companyObjectId,
      date: new Date(paymentDate),
      billName: `Salary - ${staffName}${periodInfo}`,
      expenseAmount: paidAmount,
      paymentMethod: paymentMethodStr,
      category: 'Salary',
      notes: remarks || `Payroll salary payment${paymentReference ? ` | Ref: ${paymentReference}` : ''}`,
      createdBy: new mongoose.Types.ObjectId(ownerId),
    }], { session });

    // 3. Update PayrollCalculation
    calculation.paidAmount = (calculation.paidAmount || 0) + paidAmount;
    calculation.paymentDate = new Date(paymentDate);
    calculation.paymentMode = paymentMode;
    calculation.paymentReference = paymentReference || '';

    if (calculation.paidAmount >= calculation.netSalary) {
      calculation.paymentStatus = 'paid';
    } else if (calculation.paidAmount > 0) {
      calculation.paymentStatus = 'partial';
    }

    if (remarks) {
      calculation.remarks = calculation.remarks ? `${calculation.remarks}\n${remarks}` : remarks;
    }

    calculation.updatedBy = userId;
    await calculation.save({ session });

    // 4. Update payroll period totals
    const period = await PayrollPeriod.findById(calculation.payrollPeriodId).session(session);
    if (period) {
      const allCalculations = await PayrollCalculation.find({
        payrollPeriodId: period._id,
        accountCompanyName,
        isDeleted: false,
      }).lean().session(session);

      period.totalPaidSalary = allCalculations.reduce((sum, c) => sum + (c.paidAmount || 0), 0);

      const allPaid = allCalculations.every(c => c.paymentStatus === 'paid');
      if (allPaid && period.status === 'approved') {
        period.status = 'paid';
      }

      period.updatedBy = userId;
      await period.save({ session });
    }

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        calculation,
        paymentId: paymentDoc[0]._id,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// Bulk payment for multiple staff in a payroll period
exports.bulkPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { payrollPeriodId, calculationIds, paymentDate, paymentMode, paymentReference, remarks, bankId } = req.body;
    const accountCompanyName = getCompanyName(req);
    const userId = getUserId(req);
    const ownerId = req.user?.ownerId || req.user?.id;

    if (!calculationIds || !calculationIds.length) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'No staff selected for payment' });
    }

    let companyObjectId;
    try {
      companyObjectId = new mongoose.Types.ObjectId(accountCompanyName);
    } catch (_) {
      companyObjectId = accountCompanyName;
    }

    // Get all selected calculations
    const calculations = await PayrollCalculation.find({
      _id: { $in: calculationIds.map(id => new mongoose.Types.ObjectId(id)) },
      accountCompanyName,
      isDeleted: false,
      paymentStatus: { $ne: 'paid' },
    }).populate('staffId', 'name department designation').session(session);

    if (calculations.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'No unpaid calculations found for selected staff' });
    }

    // Validate bank if provided
    if (paymentMode !== 'cash' && bankId) {
      const bankDoc = await Bank.findOne({
        _id: new mongoose.Types.ObjectId(bankId),
        ownerId: new mongoose.Types.ObjectId(ownerId),
        accountCompanyName: companyObjectId,
        isDeleted: false,
        isActive: true,
      }).session(session);

      if (!bankDoc) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: 'Bank account not found or inactive' });
      }
    }

    const paymentMethodStr = paymentMode === 'cash' ? 'Cash' : 'Bank Transfer';
    let totalPaidAmount = 0;
    let successCount = 0;
    const paymentDocs = [];
    const expenseDocs = [];

    for (const calc of calculations) {
      const remainingAmount = calc.netSalary - (calc.paidAmount || 0);
      if (remainingAmount <= 0) continue;

      const staffName = calc.staffId?.name || 'Staff';
      const periodInfo = calc.fromDate && calc.toDate
        ? ` (${new Date(calc.fromDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })})`
        : '';

      // Prepare Payment entry
      paymentDocs.push({
        ownerId: new mongoose.Types.ObjectId(ownerId),
        accountCompanyName: companyObjectId,
        party: staffName,
        date: new Date(paymentDate),
        amount: remainingAmount,
        paymentMethod: paymentMethodStr,
        referenceNumber: paymentReference || '',
        description: `Salary payment - ${staffName}`,
        createdBy: new mongoose.Types.ObjectId(ownerId),
      });

      // Prepare Expense entry
      expenseDocs.push({
        ownerId: new mongoose.Types.ObjectId(ownerId),
        accountCompanyName: companyObjectId,
        date: new Date(paymentDate),
        billName: `Salary - ${staffName}${periodInfo}`,
        expenseAmount: remainingAmount,
        paymentMethod: paymentMethodStr,
        category: 'Salary',
        notes: remarks || `Bulk payroll payment${paymentReference ? ` | Ref: ${paymentReference}` : ''}`,
        createdBy: new mongoose.Types.ObjectId(ownerId),
      });

      // Update calculation
      calc.paidAmount = calc.netSalary;
      calc.paymentStatus = 'paid';
      calc.paymentDate = new Date(paymentDate);
      calc.paymentMode = paymentMode;
      calc.paymentReference = paymentReference || '';
      if (remarks) {
        calc.remarks = calc.remarks ? `${calc.remarks}\n${remarks}` : remarks;
      }
      calc.updatedBy = userId;
      await calc.save({ session });

      totalPaidAmount += remainingAmount;
      successCount++;
    }

    // Bulk insert Payment and Expense entries
    if (paymentDocs.length > 0) {
      await Payment.insertMany(paymentDocs, { session });
    }
    if (expenseDocs.length > 0) {
      await Expense.insertMany(expenseDocs, { session });
    }

    // Update payroll period totals
    if (payrollPeriodId) {
      const period = await PayrollPeriod.findById(payrollPeriodId).session(session);
      if (period) {
        const allCalculations = await PayrollCalculation.find({
          payrollPeriodId: period._id,
          accountCompanyName,
          isDeleted: false,
        }).lean().session(session);

        period.totalPaidSalary = allCalculations.reduce((sum, c) => sum + (c.paidAmount || 0), 0);

        const allPaid = allCalculations.every(c => c.paymentStatus === 'paid');
        if (allPaid && period.status === 'approved') {
          period.status = 'paid';
        }

        period.updatedBy = userId;
        await period.save({ session });
      }
    }

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: `Payment recorded for ${successCount} staff members`,
      data: {
        successCount,
        totalPaidAmount,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error recording bulk payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record bulk payment',
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// Approve payroll period (locks attendance)
exports.approvePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const accountCompanyName = getCompanyName(req);
    const userId = getUserId(req);

    const period = await PayrollPeriod.findOne({
      _id: new mongoose.Types.ObjectId(id),
      accountCompanyName,
      isDeleted: false,
    });

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Payroll period not found',
      });
    }

    if (period.status !== 'calculated') {
      return res.status(400).json({
        success: false,
        message: 'Payroll must be calculated before approval',
      });
    }

    // Lock all attendance records for this period
    await Attendance.updateMany(
      {
        accountCompanyName,
        date: { $gte: period.fromDate, $lte: period.toDate },
        isDeleted: false,
      },
      {
        $set: {
          isLocked: true,
          lockedAt: new Date(),
          lockedBy: userId,
        },
      }
    );

    // Lock all payroll calculations
    await PayrollCalculation.updateMany(
      {
        accountCompanyName,
        payrollPeriodId: period._id,
        isDeleted: false,
      },
      {
        $set: {
          isLocked: true,
          lockedAt: new Date(),
          lockedBy: userId,
        },
      }
    );

    // Update period status
    period.status = 'approved';
    period.approvedAt = new Date();
    period.approvedBy = userId;
    period.updatedBy = userId;
    await period.save();

    res.status(200).json({
      success: true,
      message: 'Payroll approved and locked successfully',
      data: period,
    });
  } catch (error) {
    console.error('Error approving payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve payroll',
      error: error.message,
    });
  }
};

// Unlock payroll (admin override)
exports.unlockPayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const accountCompanyName = getCompanyName(req);
    const userId = getUserId(req);

    const period = await PayrollPeriod.findOne({
      _id: new mongoose.Types.ObjectId(id),
      accountCompanyName,
      isDeleted: false,
    });

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Payroll period not found',
      });
    }

    // Unlock attendance records
    await Attendance.updateMany(
      {
        accountCompanyName,
        date: { $gte: period.fromDate, $lte: period.toDate },
        isDeleted: false,
      },
      {
        $set: {
          isLocked: false,
          lockedAt: null,
          lockedBy: null,
        },
      }
    );

    // Unlock payroll calculations
    await PayrollCalculation.updateMany(
      {
        accountCompanyName,
        payrollPeriodId: period._id,
        isDeleted: false,
      },
      {
        $set: {
          isLocked: false,
          lockedAt: null,
          lockedBy: null,
        },
      }
    );

    // Update period status back to calculated
    period.status = 'calculated';
    period.approvedAt = null;
    period.approvedBy = null;
    period.updatedBy = userId;
    await period.save();

    res.status(200).json({
      success: true,
      message: 'Payroll unlocked successfully',
      data: period,
    });
  } catch (error) {
    console.error('Error unlocking payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlock payroll',
      error: error.message,
    });
  }
};

// Delete payroll period
exports.deletePayrollPeriod = async (req, res) => {
  try {
    const { id } = req.params;
    const accountCompanyName = getCompanyName(req);
    const userId = getUserId(req);

    const period = await PayrollPeriod.findOne({
      _id: new mongoose.Types.ObjectId(id),
      accountCompanyName,
      isDeleted: false,
    });

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Payroll period not found',
      });
    }

    if (period.status === 'approved' || period.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete approved or paid payroll period',
      });
    }

    // Delete associated calculations
    await PayrollCalculation.updateMany(
      {
        accountCompanyName,
        payrollPeriodId: period._id,
      },
      {
        $set: {
          isDeleted: true,
          updatedBy: userId,
        },
      }
    );

    // Delete period
    period.isDeleted = true;
    period.updatedBy = userId;
    await period.save();

    res.status(200).json({
      success: true,
      message: 'Payroll period deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting payroll period:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payroll period',
      error: error.message,
    });
  }
};
