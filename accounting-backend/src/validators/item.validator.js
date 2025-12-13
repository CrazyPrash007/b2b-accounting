// src/validators/item.validator.js
const Joi = require('joi');

// Common validators
const base = {
    accountCompanyName: Joi.string().trim().required(),
    name: Joi.string().trim().required(),
    itemName: Joi.string().trim().optional(),
    description: Joi.string().allow('').optional(),
    category: Joi.string().allow('').optional(),
    subCategory: Joi.string().allow('').optional(),
    brandName: Joi.string().allow('').optional(),
    gstRate: Joi.number().integer().min(0).max(100).optional().allow(null),
    hsnNo: Joi.string().allow('').optional(),

    itemType: Joi.string().valid('Goods', 'Service').optional(),
    type: Joi.string().optional(),

    unit: Joi.string().allow('').optional(),

    buyPrice: Joi.number().min(0).optional().allow(null),
    sellPrice: Joi.number().min(0).optional().allow(null),

    openingStock: Joi.number().min(0).optional().allow(null),
    minStock: Joi.number().min(0).optional().allow(null),
    openingDate: Joi.date().iso().optional().allow(null),

    isActive: Joi.boolean().optional(),
};

const create = Joi.object({
    ...base,
    // name already required above
});

const update = Joi.object({
    accountCompanyName: Joi.string().trim().optional(),
    name: Joi.string().trim().optional(),
    itemName: Joi.string().trim().optional(),
    description: Joi.string().allow('').optional(),
    category: Joi.string().allow('').optional(),
    subCategory: Joi.string().allow('').optional(),
    brandName: Joi.string().allow('').optional(),
    gstRate: Joi.number().integer().min(0).max(100).optional().allow(null),
    hsnNo: Joi.string().allow('').optional(),

    itemType: Joi.string().valid('Goods', 'Service').optional(),
    type: Joi.string().optional(),

    unit: Joi.string().allow('').optional(),

    buyPrice: Joi.number().min(0).optional().allow(null),
    sellPrice: Joi.number().min(0).optional().allow(null),

    openingStock: Joi.number().min(0).optional().allow(null),
    minStock: Joi.number().min(0).optional().allow(null),
    openingDate: Joi.date().iso().optional().allow(null),

    isActive: Joi.boolean().optional(),
});

module.exports = { create, update };
