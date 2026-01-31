// src/routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const auth = require('../middlewares/auth');

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics (all sections with single period)
 * Query params: companyId (required), period (current-month, last-month, etc), startDate, endDate
 */
router.get('/stats', auth, dashboardController.getDashboardStats);

/**
 * GET /api/dashboard/section/:sectionName
 * Get stats for a specific dashboard section (section-level filtering)
 * Query params: companyId (required), period, startDate, endDate
 * sectionName: businessOperations, revenueProjections, totalIncome, revenueInflow, revenueManagement, saleAnalytics
 */
router.get('/section/:sectionName', auth, dashboardController.getSectionStats);

module.exports = router;
