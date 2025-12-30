// src/validators/itemCategory.validator.js
const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const create = Joi.object({
    accountCompanyName: objectId.required().messages({
        'any.required': 'Company selection is required',
        'string.pattern.base': 'Invalid company ID format'
    }),
    name: Joi.string().trim().required().messages({
        'any.required': 'Category name is required',
        'string.empty': 'Category name cannot be empty'
    }),
    subcategories: Joi.array().items(Joi.string().trim()).optional().messages({
        'array.base': 'Subcategories must be a list of names'
    }),
    isActive: Joi.boolean().optional(),
});

const update = create.fork(['accountCompanyName'], (s) => s.optional());

module.exports = { create, update };
