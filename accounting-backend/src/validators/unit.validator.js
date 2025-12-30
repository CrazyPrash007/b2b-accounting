// src/validators/unit.validator.js
const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const create = Joi.object({
    accountCompanyName: objectId.required().messages({
        'any.required': 'Company selection is required',
        'string.pattern.base': 'Invalid company ID format'
    }),
    fullName: Joi.string().trim().required().messages({
        'any.required': 'Unit full name is required (e.g., Kilogram, Piece)',
        'string.empty': 'Unit full name cannot be empty'
    }),
    aliasName: Joi.string().trim().allow('').optional(),
    isActive: Joi.boolean().optional(),
});

const update = create.fork(['accountCompanyName'], (s) => s.optional());

module.exports = { create, update };
