// src/validators/item.validator.js
const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const base = {
    accountCompanyName: objectId.required().messages({
        'any.required': 'Company selection is required',
        'string.pattern.base': 'Invalid company ID format'
    }),
    name: Joi.string().trim().required().messages({
        'any.required': 'Item name is required',
        'string.empty': 'Item name cannot be empty'
    }),
    itemName: Joi.string().trim().optional(),
    description: Joi.string().allow('').optional(),
    category: Joi.string().allow('').optional(),
    subCategory: Joi.string().allow('').optional(),
    brandName: Joi.string().allow('').optional(),
    gstRate: Joi.number().integer().min(0).max(100).optional().allow(null).messages({
        'number.base': 'GST rate must be a number',
        'number.min': 'GST rate cannot be negative',
        'number.max': 'GST rate cannot exceed 100%'
    }),
    hsnNo: Joi.string().allow('').optional(),

    itemType: Joi.string().valid('Goods', 'Service').optional().messages({
        'any.only': 'Item type must be either Goods or Service'
    }),
    type: Joi.string().optional(),

    unit: Joi.string().allow('').optional(),

    buyPrice: Joi.number().min(0).optional().allow(null).messages({
        'number.base': 'Buy price must be a valid number',
        'number.min': 'Buy price cannot be negative'
    }),
    sellPrice: Joi.number().min(0).optional().allow(null).messages({
        'number.base': 'Sell price must be a valid number',
        'number.min': 'Sell price cannot be negative'
    }),

    openingStock: Joi.number().min(0).optional().allow(null).messages({
        'number.base': 'Opening stock must be a valid number',
        'number.min': 'Opening stock cannot be negative'
    }),
    minStock: Joi.number().min(0).optional().allow(null).messages({
        'number.base': 'Minimum stock must be a valid number',
        'number.min': 'Minimum stock cannot be negative'
    }),
    openingDate: Joi.date().iso().optional().allow(null).messages({
        'date.base': 'Please enter a valid date',
        'date.format': 'Date must be in ISO format'
    }),

    // Website visibility and image
    showOnWebsite: Joi.boolean().optional().default(true),
    itemImage: Joi.string().uri().allow('').optional().messages({
        'string.uri': 'Item image must be a valid URL'
    }),

    isActive: Joi.boolean().optional(),
};

const create = Joi.object({
    ...base,
    // name already required above
});

const update = create.fork(['accountCompanyName'], (s) => s.optional());

module.exports = { create, update };
