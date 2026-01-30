// src/routes/staff.routes.js
const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const authenticate = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// Get all staff
router.get('/', staffController.getAllStaff);

// Get active staff list (for dropdowns)
router.get('/active', staffController.getActiveStaffList);

// Get single staff by ID
router.get('/:id', staffController.getStaffById);

// Create new staff
router.post('/', staffController.createStaff);

// Update staff
router.put('/:id', staffController.updateStaff);

// Toggle staff status
router.patch('/:id/status', staffController.toggleStatus);

// Delete staff
router.delete('/:id', staffController.deleteStaff);

module.exports = router;
