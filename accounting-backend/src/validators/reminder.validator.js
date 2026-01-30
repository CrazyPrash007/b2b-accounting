// src/validators/reminder.validator.js
const Joi = require('joi');

const base = {
    title: Joi.string().trim().min(1).max(200).required().messages({
        'string.empty': 'Reminder title is required',
        'string.min': 'Reminder title must be at least 1 character',
        'string.max': 'Reminder title must be at most 200 characters',
        'any.required': 'Reminder title is required'
    }),
    description: Joi.string().trim().max(1000).allow('').optional().messages({
        'string.max': 'Description must be at most 1000 characters'
    }),
    category: Joi.string().valid('Payment', 'Logistics', 'Service', 'Expenses', 'General').required().messages({
        'any.only': 'Category must be one of: Payment, Logistics, Service, Expenses, General',
        'any.required': 'Category is required'
    }),
    subCategory: Joi.string().trim().max(100).allow('').optional(),
    dueDate: Joi.date().iso().required().messages({
        'date.base': 'Please enter a valid due date',
        'any.required': 'Due date is required'
    }),
    assignedTo: Joi.string().trim().max(100).allow('').optional(),
    amountType: Joi.string().valid('no_amount', 'receivable', 'payable').default('no_amount').messages({
        'any.only': 'Amount type must be one of: no_amount, receivable, payable'
    }),
    amount: Joi.number().min(0).default(0).messages({
        'number.min': 'Amount cannot be negative'
    }),
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled').optional(),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    completionNote: Joi.string().trim().max(500).allow('').optional(),
    isActive: Joi.boolean().optional(),
    accountCompanyName: Joi.string().required()
};

const createSchema = Joi.object({ ...base });

const updateSchema = Joi.object({
    ...base,
    title: Joi.string().trim().min(1).max(200).optional(),
    category: Joi.string().valid('Payment', 'Logistics', 'Service', 'Expenses', 'General').optional(),
    dueDate: Joi.date().iso().optional(),
    accountCompanyName: Joi.string().required()
});

function validateCreate(data) {
    return createSchema.validate(data, { abortEarly: false, stripUnknown: true });
}

function validateUpdate(data) {
    return updateSchema.validate(data, { abortEarly: false, stripUnknown: true });
}

module.exports = {
    validateCreate,
    validateUpdate
};
