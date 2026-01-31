// src/controllers/staff.controller.js
const Staff = require('../models/Staff');
const { validateCreate, validateUpdate } = require('../validators/staff.validator');

// Get all staff for a company
exports.getAllStaff = async (req, res) => {
    try {
        const { accountCompanyName } = req.query;

        if (!accountCompanyName) {
            return res.status(400).json({
                success: false,
                message: 'accountCompanyName is required'
            });
        }

        const { status, search, sortBy = 'name', sortOrder = 'asc' } = req.query;
        const filter = { accountCompanyName };

        if (status) {
            filter.status = status;
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { fatherName: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } },
                { designation: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ];
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const staff = await Staff.find(filter).sort(sort);

        res.status(200).json({
            success: true,
            data: staff
        });
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching staff',
            error: error.message
        });
    }
};

// Get single staff by ID
exports.getStaffById = async (req, res) => {
    try {
        const { id } = req.params;
        const staff = await Staff.findById(id);

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }

        res.status(200).json({
            success: true,
            data: staff
        });
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching staff',
            error: error.message
        });
    }
};

// Create new staff
exports.createStaff = async (req, res) => {
    try {
        const { error, value } = validateCreate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(d => d.message)
            });
        }

        const staff = new Staff(value);
        await staff.save();

        res.status(201).json({
            success: true,
            message: 'Staff created successfully',
            data: staff
        });
    } catch (error) {
        console.error('Error creating staff:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating staff',
            error: error.message
        });
    }
};

// Update staff
exports.updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = validateUpdate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(d => d.message)
            });
        }

        const staff = await Staff.findByIdAndUpdate(
            id,
            { ...value, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Staff updated successfully',
            data: staff
        });
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating staff',
            error: error.message
        });
    }
};

// Delete staff
exports.deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const staff = await Staff.findByIdAndDelete(id);

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Staff deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting staff',
            error: error.message
        });
    }
};

// Toggle staff status
exports.toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'inactive', 'terminated'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const updateData = { status };

        // If terminating, set exit date
        if (status === 'terminated' && !req.body.exitDate) {
            updateData.exitDate = new Date();
        }

        if (req.body.exitReason) {
            updateData.exitReason = req.body.exitReason;
        }

        const staff = await Staff.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `Staff status updated to ${status}`,
            data: staff
        });
    } catch (error) {
        console.error('Error updating staff status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating staff status',
            error: error.message
        });
    }
};

// Get active staff list (for dropdowns)
exports.getActiveStaffList = async (req, res) => {
    try {
        const { accountCompanyName } = req.query;

        if (!accountCompanyName) {
            return res.status(400).json({
                success: false,
                message: 'accountCompanyName is required'
            });
        }

        const staff = await Staff.find({
            accountCompanyName,
            status: 'active'
        }).select('_id name designation department').sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: staff
        });
    } catch (error) {
        console.error('Error fetching active staff:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching active staff',
            error: error.message
        });
    }
};
