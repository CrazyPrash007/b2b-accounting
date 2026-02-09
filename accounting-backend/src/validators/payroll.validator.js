const Joi = require('joi');

// Common field — passed in body for POST/PUT, stripped by validator but preserved for controller
const companyField = { accountCompanyName: Joi.string().optional() };

const createPayrollPeriodSchema = Joi.object({
  ...companyField,
  periodName: Joi.string().required(),
  fromDate: Joi.date().required(),
  toDate: Joi.date().required().greater(Joi.ref('fromDate')),
  remarks: Joi.string().optional().allow(''),
});

const updatePayrollPeriodSchema = Joi.object({
  ...companyField,
  periodName: Joi.string().optional(),
  status: Joi.string().valid('draft', 'calculated', 'approved', 'paid', 'closed').optional(),
  remarks: Joi.string().optional().allow(''),
});

const calculatePayrollSchema = Joi.object({
  ...companyField,
  payrollPeriodId: Joi.string().required(),
  staffIds: Joi.array().items(Joi.string()).optional(), // If empty, calculate for all active staff
});

const recordPaymentSchema = Joi.object({
  ...companyField,
  payrollCalculationId: Joi.string().required(),
  paidAmount: Joi.number().min(0).required(),
  paymentDate: Joi.date().required(),
  paymentMode: Joi.string().valid('cash', 'bank-transfer', 'upi', 'cheque').required(),
  paymentReference: Joi.string().optional().allow(''),
  remarks: Joi.string().optional().allow(''),
  bankId: Joi.string().when('paymentMode', {
    is: Joi.string().valid('bank-transfer', 'upi', 'cheque'),
    then: Joi.required(),
    otherwise: Joi.optional().allow('', null),
  }),
});

const bulkPaymentSchema = Joi.object({
  ...companyField,
  payrollPeriodId: Joi.string().required(),
  calculationIds: Joi.array().items(Joi.string()).min(1).required(),
  paymentDate: Joi.date().required(),
  paymentMode: Joi.string().valid('cash', 'bank-transfer', 'upi', 'cheque').required(),
  paymentReference: Joi.string().optional().allow(''),
  remarks: Joi.string().optional().allow(''),
  bankId: Joi.string().when('paymentMode', {
    is: Joi.string().valid('bank-transfer', 'upi', 'cheque'),
    then: Joi.required(),
    otherwise: Joi.optional().allow('', null),
  }),
});

const updatePayrollCalculationSchema = Joi.object({
  ...companyField,
  overtimePay: Joi.number().min(0).optional(),
  bonuses: Joi.number().min(0).optional(),
  allowances: Joi.number().min(0).optional(),
  advanceDeduction: Joi.number().min(0).optional(),
  otherDeductions: Joi.number().min(0).optional(),
  remarks: Joi.string().optional().allow(''),
});

module.exports = {
  createPayrollPeriodSchema,
  updatePayrollPeriodSchema,
  calculatePayrollSchema,
  recordPaymentSchema,
  bulkPaymentSchema,
  updatePayrollCalculationSchema,
};
