// src/controllers/staff.controller.js
const mongoose = require('mongoose');
const Staff = require('../models/Staff');
const Attendance = require('../models/Attendance');
const PayrollCalculation = require('../models/PayrollCalculation');
const PayrollPeriod = require('../models/PayrollPeriod');
const { validateCreate, validateUpdate } = require('../validators/staff.validator');
const sanitize = require('mongo-sanitize');

// ── Helpers ────────────────────────────────────────────────────────────

/** Escape special regex characters in user search input. */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Extract user ObjectId from authentication context. */
const getUserId = (req) => {
    const id = req.user?.ownerId || req.user?.id || req.user?._id;
    return id ? String(id) : undefined;
};

/** Validate that a string is a valid Mongoose ObjectId. */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Map a caught error to a structured HTTP response.
 * – Mongoose duplicate-key → 409
 * – Mongoose validation   → 400
 * – CastError (bad id)    → 400
 * – Everything else       → forwarded to the central error-handler middleware
 */
function handleControllerError(error, res, next) {
    // Duplicate key (E11000)
    if (error.code === 11000) {
        const field = error.keyValue ? Object.keys(error.keyValue)[0] : 'field';
        const friendlyField = field.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
        return res.status(409).json({
            success: false,
            message: `A staff record with this ${friendlyField} already exists`,
        });
    }

    // Mongoose schema validation
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors || {}).map((e) => e.message);
        return res.status(400).json({
            success: false,
            message: messages[0] || 'Validation failed',
            errors: messages,
        });
    }

    // Bad ObjectId cast
    if (error.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: `Invalid ${error.path || 'id'} format`,
        });
    }

    // Anything else → central error handler
    return next(error);
}

// Get all staff for a company
exports.getAllStaff = async (req, res, next) => {
    try {
        const { accountCompanyName } = req.query;

        if (!accountCompanyName) {
            return res.status(400).json({
                success: false,
                message: 'accountCompanyName is required'
            });
        }

        const {
            status,
            search,
            sortBy = 'name',
            sortOrder = 'asc',
            page = 1,
            limit = 50
        } = req.query;

        const filter = { accountCompanyName, isDeleted: false };

        if (status && ['active', 'inactive', 'terminated'].includes(status)) {
            filter.status = status;
        }

        if (search) {
            const sanitizedSearch = escapeRegex(sanitize(search));
            filter.$or = [
                { name: { $regex: sanitizedSearch, $options: 'i' } },
                { fatherName: { $regex: sanitizedSearch, $options: 'i' } },
                { department: { $regex: sanitizedSearch, $options: 'i' } },
                { designation: { $regex: sanitizedSearch, $options: 'i' } },
                { mobile: { $regex: sanitizedSearch, $options: 'i' } }
            ];
        }

        // Whitelist sortable fields to prevent injection
        const SORTABLE_FIELDS = ['name', 'department', 'designation', 'dateOfJoining', 'salaryAmount', 'status', 'createdAt'];
        const safeSortBy = SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'name';
        const sort = { [safeSortBy]: sortOrder === 'desc' ? -1 : 1 };

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));
        const skip = (pageNum - 1) * limitNum;

        const [staff, total] = await Promise.all([
            Staff.find(filter)
                .select('-aadharNumber -bankAccountNumber -aadharImage')
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Staff.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: staff,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                hasNextPage: pageNum < Math.ceil(total / limitNum),
                hasPrevPage: pageNum > 1
            }
        });
    } catch (error) {
        console.error('Error fetching staff:', error);
        handleControllerError(error, res, next);
    }
};

// Get single staff by ID
exports.getStaffById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { accountCompanyName } = req.query;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid staff ID format' });
        }

        if (!accountCompanyName) {
            return res.status(400).json({ success: false, message: 'accountCompanyName is required' });
        }

        const staff = await Staff.findOne({
            _id: id,
            accountCompanyName,
            isDeleted: false
        });

        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff not found' });
        }

        res.status(200).json({ success: true, data: staff });
    } catch (error) {
        console.error('Error fetching staff:', error);
        handleControllerError(error, res, next);
    }
};

// Create new staff
exports.createStaff = async (req, res, next) => {
    try {
        const { error, value } = validateCreate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(d => d.message)
            });
        }

        // Set audit field
        value.createdBy = getUserId(req);

        const staff = new Staff(value);
        await staff.save();

        res.status(201).json({
            success: true,
            message: 'Staff created successfully',
            data: staff
        });
    } catch (error) {
        console.error('Error creating staff:', error);
        handleControllerError(error, res, next);
    }
};

// Update staff
exports.updateStaff = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid staff ID format' });
        }

        const { error, value } = validateUpdate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(d => d.message)
            });
        }

        // Pull accountCompanyName from the validated payload for the filter
        const { accountCompanyName, ...updateFields } = value;
        updateFields.updatedBy = getUserId(req);

        const staff = await Staff.findOneAndUpdate(
            { _id: id, accountCompanyName, isDeleted: false },
            updateFields,
            { new: true, runValidators: true }
        );

        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Staff updated successfully',
            data: staff
        });
    } catch (error) {
        console.error('Error updating staff:', error);
        handleControllerError(error, res, next);
    }
};

// Delete staff (soft delete)
exports.deleteStaff = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { accountCompanyName } = req.query;
        const userId = getUserId(req);

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid staff ID format' });
        }

        if (!accountCompanyName) {
            return res.status(400).json({ success: false, message: 'accountCompanyName is required' });
        }

        const staff = await Staff.findOneAndUpdate(
            { _id: id, accountCompanyName, isDeleted: false },
            { isDeleted: true, deletedAt: new Date(), deletedBy: userId },
            { new: true }
        );

        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff not found or already deleted' });
        }

        res.status(200).json({
            success: true,
            message: 'Staff deleted successfully',
            data: staff
        });
    } catch (error) {
        console.error('Error deleting staff:', error);
        handleControllerError(error, res, next);
    }
};

// Restore deleted staff
exports.restoreStaff = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { accountCompanyName } = req.query;
        const userId = getUserId(req);

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid staff ID format' });
        }

        if (!accountCompanyName) {
            return res.status(400).json({ success: false, message: 'accountCompanyName is required' });
        }

        const staff = await Staff.findOneAndUpdate(
            { _id: id, accountCompanyName, isDeleted: true },
            { isDeleted: false, deletedAt: null, deletedBy: null, updatedBy: userId },
            { new: true }
        );

        if (!staff) {
            return res.status(404).json({ success: false, message: 'Deleted staff not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Staff restored successfully',
            data: staff
        });
    } catch (error) {
        console.error('Error restoring staff:', error);
        handleControllerError(error, res, next);
    }
};

// Toggle staff status
exports.toggleStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, exitDate, exitReason, accountCompanyName } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid staff ID format' });
        }

        if (!accountCompanyName) {
            return res.status(400).json({ success: false, message: 'accountCompanyName is required' });
        }

        if (!['active', 'inactive', 'terminated'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value. Must be active, inactive, or terminated' });
        }

        const updateData = { status, updatedBy: getUserId(req) };

        if (status === 'terminated') {
            updateData.exitDate = exitDate ? new Date(exitDate) : new Date();
            if (exitReason) updateData.exitReason = exitReason;
        }

        // Clear exit fields when re-activating
        if (status === 'active') {
            updateData.exitDate = null;
            updateData.exitReason = null;
        }

        const staff = await Staff.findOneAndUpdate(
            { _id: id, accountCompanyName, isDeleted: false },
            updateData,
            { new: true }
        );

        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff not found' });
        }

        res.status(200).json({
            success: true,
            message: `Staff status updated to ${status}`,
            data: staff
        });
    } catch (error) {
        console.error('Error updating staff status:', error);
        handleControllerError(error, res, next);
    }
};

// Get active staff list (for dropdowns)
exports.getActiveStaffList = async (req, res, next) => {
    try {
        const { accountCompanyName } = req.query;

        if (!accountCompanyName) {
            return res.status(400).json({ success: false, message: 'accountCompanyName is required' });
        }

        const staff = await Staff.find({
            accountCompanyName,
            status: 'active',
            isDeleted: false
        }).select('_id name designation department').sort({ name: 1 }).lean();

        res.status(200).json({ success: true, data: staff });
    } catch (error) {
        console.error('Error fetching active staff:', error);
        handleControllerError(error, res, next);
    }
};

// Add salary increase
exports.addSalaryIncrease = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { effectiveDate, increaseAmount, remarks, accountCompanyName } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid staff ID format' });
        }

        if (!accountCompanyName) {
            return res.status(400).json({ success: false, message: 'accountCompanyName is required' });
        }

        if (!effectiveDate) {
            return res.status(400).json({ success: false, message: 'Effective date is required' });
        }

        const parsedDate = new Date(effectiveDate);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid effective date format' });
        }

        const parsedAmount = parseFloat(increaseAmount);
        if (!increaseAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Increase amount must be a number greater than 0' });
        }

        const staff = await Staff.findOne({
            _id: id,
            accountCompanyName,
            isDeleted: false
        });

        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff not found' });
        }

        const previousSalary = staff.salaryAmount;
        const newSalary = previousSalary + parsedAmount;

        staff.salaryHistory.push({
            effectiveDate: parsedDate,
            previousSalary,
            increaseAmount: parsedAmount,
            newSalary,
            remarks: remarks || null,
            createdBy: getUserId(req)
        });

        staff.salaryAmount = newSalary;
        staff.updatedBy = getUserId(req);
        await staff.save();

        res.status(200).json({
            success: true,
            message: 'Salary increase added successfully',
            data: staff
        });
    } catch (error) {
        console.error('Error adding salary increase:', error);
        handleControllerError(error, res, next);
    }
};

// Get staff salary history
exports.getSalaryHistory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { accountCompanyName } = req.query;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid staff ID format' });
        }

        if (!accountCompanyName) {
            return res.status(400).json({ success: false, message: 'accountCompanyName is required' });
        }

        const staff = await Staff.findOne({
            _id: id,
            accountCompanyName,
            isDeleted: false
        }).select('name salaryAmount salaryHistory');

        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff not found' });
        }

        res.status(200).json({
            success: true,
            data: {
                name: staff.name,
                currentSalary: staff.salaryAmount,
                history: staff.salaryHistory
            }
        });
    } catch (error) {
        console.error('Error fetching salary history:', error);
        handleControllerError(error, res, next);
    }
};

// Get current active salary (considering effective date)
exports.getCurrentSalary = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { asOfDate, accountCompanyName } = req.query;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid staff ID format' });
        }

        if (!accountCompanyName) {
            return res.status(400).json({ success: false, message: 'accountCompanyName is required' });
        }

        const staff = await Staff.findOne({
            _id: id,
            accountCompanyName,
            isDeleted: false
        });

        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff not found' });
        }

        const referenceDate = asOfDate ? new Date(asOfDate) : new Date();

        if (asOfDate && isNaN(referenceDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid asOfDate format' });
        }

        let applicableSalary = staff.salaryAmount;

        const sortedHistory = [...staff.salaryHistory].sort(
            (a, b) => new Date(a.effectiveDate) - new Date(b.effectiveDate)
        );

        for (const record of sortedHistory) {
            if (new Date(record.effectiveDate) <= referenceDate) {
                applicableSalary = record.newSalary;
            }
        }

        res.status(200).json({
            success: true,
            data: {
                staffId: staff._id,
                name: staff.name,
                currentSalary: applicableSalary,
                asOfDate: referenceDate
            }
        });
    } catch (error) {
        console.error('Error getting current salary:', error);
        handleControllerError(error, res, next);
    }
};

// ── Get Complete Staff History ─────────────────────────────────────────

/**
 * Returns a staff member's full profile plus attendance and payroll history.
 * GET /api/staff/:id/complete-history?fromDate=...&toDate=...
 */
exports.getCompleteHistory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const accountCompanyName = req.query.accountCompanyName || req.body.accountCompanyName;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid staff ID' });
        }

        if (!accountCompanyName) {
            return res.status(400).json({ success: false, message: 'accountCompanyName is required' });
        }

        const staff = await Staff.findOne({
            _id: new mongoose.Types.ObjectId(id),
            accountCompanyName,
            isDeleted: false,
        }).lean();

        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff not found' });
        }

        // Optional date range filter
        const { fromDate, toDate } = req.query;
        const dateFilter = {};
        if (fromDate) dateFilter.$gte = new Date(fromDate);
        if (toDate) dateFilter.$lte = new Date(toDate);

        // Attendance records
        const attendanceQuery = {
            staffId: new mongoose.Types.ObjectId(id),
            accountCompanyName,
            isDeleted: false,
        };
        if (Object.keys(dateFilter).length) attendanceQuery.date = dateFilter;

        const attendanceRecords = await Attendance.find(attendanceQuery)
            .sort({ date: -1 })
            .lean();

        console.log('[getCompleteHistory] Attendance records count:', attendanceRecords.length);
        if (attendanceRecords.length > 0) {
            console.log('[getCompleteHistory] First attendance record:', JSON.stringify(attendanceRecords[0], null, 2));
        }

        // Attendance summary
        const attendanceSummary = {
            totalPresent: attendanceRecords.filter(a => a.status === 'present' || a.status === 'half-day').length,
            totalAbsent: attendanceRecords.filter(a => a.status === 'absent').length,
            totalHalfDay: attendanceRecords.filter(a => a.status === 'half-day').length,
            totalLeave: attendanceRecords.filter(a => a.status === 'leave').length,
            totalHoliday: attendanceRecords.filter(a => a.status === 'holiday').length,
            totalRecords: attendanceRecords.length,
        };

        // Payroll calculations (salary payments)
        const payrollQuery = {
            staffId: new mongoose.Types.ObjectId(id),
            accountCompanyName,
            isDeleted: false,
        };

        const payrollCalculations = await PayrollCalculation.find(payrollQuery)
            .populate('payrollPeriodId', 'periodName fromDate toDate status')
            .sort({ createdAt: -1 })
            .lean();

        // Salary payment summary
        const salarySummary = {
            totalPayrolls: payrollCalculations.length,
            totalEarned: payrollCalculations.reduce((sum, c) => sum + (c.netSalary || 0), 0),
            totalPaid: payrollCalculations.reduce((sum, c) => sum + (c.paidAmount || 0), 0),
            totalPending: 0,
        };
        salarySummary.totalPending = salarySummary.totalEarned - salarySummary.totalPaid;

        res.status(200).json({
            success: true,
            data: {
                staff,
                attendanceSummary,
                attendanceRecords,
                payrollCalculations,
                salarySummary,
            },
        });
    } catch (error) {
        console.error('Error getting complete staff history:', error);
        handleControllerError(error, res, next);
    }
};
