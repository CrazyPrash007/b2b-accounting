const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payroll.controller');
const authenticate = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  createPayrollPeriodSchema,
  updatePayrollPeriodSchema,
  calculatePayrollSchema,
  recordPaymentSchema,
  bulkPaymentSchema,
  updatePayrollCalculationSchema,
} = require('../validators/payroll.validator');

// All routes require authentication
router.use(authenticate);

// Payroll period routes
router.post('/periods', validate(createPayrollPeriodSchema), payrollController.createPayrollPeriod);
router.get('/periods', payrollController.getPayrollPeriods);
router.get('/periods/:id', payrollController.getPayrollPeriod);
router.delete('/periods/:id', payrollController.deletePayrollPeriod);

// Payroll calculation routes
router.post('/calculate', validate(calculatePayrollSchema), payrollController.calculatePayroll);
router.get('/calculations/:payrollPeriodId', payrollController.getPayrollCalculations);
router.get('/calculation/:id', payrollController.getPayrollCalculation);
router.put('/calculations/:id', validate(updatePayrollCalculationSchema), payrollController.updatePayrollCalculation);

// Payment routes
router.post('/payment', validate(recordPaymentSchema), payrollController.recordPayment);
router.post('/bulk-payment', validate(bulkPaymentSchema), payrollController.bulkPayment);

// Approval and locking routes
router.post('/approve/:id', payrollController.approvePayroll);
router.post('/unlock/:id', payrollController.unlockPayroll);

module.exports = router;
