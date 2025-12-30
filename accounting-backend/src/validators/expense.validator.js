const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const create = Joi.object({
    accountCompanyName: objectId.required().messages({
        'any.required': 'Company selection is required',
        'string.pattern.base': 'Invalid company ID format'
    }),
    date: Joi.date().iso().optional().messages({
        'date.base': 'Please enter a valid date',
        'date.format': 'Date must be in a valid format'
    }),
    billName: Joi.string().trim().required().messages({
        'any.required': 'Bill name is required',
        'string.empty': 'Bill name cannot be empty'
    }),
    expenseAmount: Joi.number().precision(2).min(0).required().messages({
        'any.required': 'Expense amount is required',
        'number.base': 'Expense amount must be a valid number',
        'number.min': 'Expense amount cannot be negative'
    }),
    paymentMethod: Joi.string().allow('').optional(),
    category: Joi.string().trim().required().messages({
        'any.required': 'Category is required for expense tracking',
        'string.empty': 'Please select or enter a category'
    }),
    notes: Joi.string().allow('').optional(),
    // file is handled by multer (multipart) — validator checks textual fields only
});

const update = create.fork(['accountCompanyName'], (s) => s.optional());

module.exports = { create, update };
