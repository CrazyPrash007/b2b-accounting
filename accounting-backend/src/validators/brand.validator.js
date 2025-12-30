// src/validators/brand.validator.js
const Joi = require('joi');
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const create = Joi.object({
    accountCompanyName: objectId.required().messages({
        'any.required': 'Company selection is required',
        'string.pattern.base': 'Invalid company ID format'
    }),
    brandName: Joi.string().trim().required().messages({
        'any.required': 'Brand name is required',
        'string.empty': 'Brand name cannot be empty'
    }),
    isActive: Joi.boolean().optional(),
});

const update = create.fork(['accountCompanyName'], (s) => s.optional());

module.exports = { create, update };
