// src/validators/gst.validator.js
const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const create = Joi.object({
    accountCompanyName: objectId.required().messages({
        'any.required': 'Company selection is required',
        'string.pattern.base': 'Invalid company ID format'
    }),
    rate: Joi.number().min(0).required().messages({
        'any.required': 'GST rate is required',
        'number.base': 'GST rate must be a valid number',
        'number.min': 'GST rate cannot be negative'
    }),
    isActive: Joi.boolean().optional(),
});

const update = create.fork(['accountCompanyName'], (s) => s.optional());


module.exports = { create, update };
