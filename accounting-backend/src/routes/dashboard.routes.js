// src/routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const auth = require('../middlewares/auth');

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics
 * Query params: companyId (required), period (current-month, last-month, etc), startDate, endDate
 */
router.get('/stats', auth, dashboardController.getDashboardStats);

module.exports = router;
