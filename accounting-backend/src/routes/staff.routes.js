// src/routes/staff.routes.js
const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const authenticate = require('../middlewares/auth');
const authorizeCompany = require('../middlewares/authorizeCompany');

// All routes require authentication and company authorization
router.use(authenticate);
router.use(authorizeCompany);

// Get all staff
router.get('/', staffController.getAllStaff);

// Get active staff list (for dropdowns)
router.get('/active', staffController.getActiveStaffList);

// Get single staff by ID
router.get('/:id', staffController.getStaffById);

// Get staff salary history
router.get('/:id/salary-history', staffController.getSalaryHistory);

// Get current active salary
router.get('/:id/current-salary', staffController.getCurrentSalary);

// Get complete staff history (attendance + payroll)
router.get('/:id/complete-history', staffController.getCompleteHistory);

// Create new staff
router.post('/', staffController.createStaff);

// Add salary increase
router.post('/:id/salary-increase', staffController.addSalaryIncrease);

// Update staff
router.put('/:id', staffController.updateStaff);

// Toggle staff status
router.patch('/:id/status', staffController.toggleStatus);

// Delete staff
router.delete('/:id', staffController.deleteStaff);

// Restore deleted staff
router.patch('/:id/restore', staffController.restoreStaff);

module.exports = router;
