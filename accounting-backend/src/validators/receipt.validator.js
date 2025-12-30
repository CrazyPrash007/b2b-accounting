// src/validators/receipt.validator.js
const Joi = require('joi');

const objectId = Joi.string().hex().length(24);
const objectnewId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const base = {
    accountCompanyName: objectnewId.required().messages({
        'any.required': 'Company selection is required',
        'string.pattern.base': 'Invalid company ID format'
    }),
    partyId: objectId.optional().allow(null, ''),
    party: Joi.string().trim().optional().allow(''),

    invoiceId: objectId.optional().allow(null, ''),
    invoiceLabel: Joi.string().trim().optional().allow(''),

    date: Joi.date().iso().optional().allow(null, '').messages({
        'date.base': 'Please enter a valid date',
        'date.format': 'Date must be in a valid format'
    }),

    amount: Joi.number().min(0).required().messages({
        'any.required': 'Receipt amount is required',
        'number.base': 'Amount must be a valid number',
        'number.min': 'Amount cannot be negative'
    }),
    paymentMethod: Joi.string().trim().required().messages({
        'any.required': 'Payment method is required',
        'string.empty': 'Please select a payment method'
    }),
    referenceNumber: Joi.string().trim().optional().allow(''),
    description: Joi.string().trim().optional().allow(''),
    isDeleted: Joi.boolean().optional(),
};

// Create: require minimal fields
const create = Joi.object({
    ...base,
    // amount & paymentMethod are already required above
});

// Update: allow partial update
const update = create.fork(['accountCompanyName'], (s) => s.optional());

module.exports = { create, update };
