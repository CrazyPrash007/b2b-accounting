const Joi = require('joi');

const create = Joi.object({
    accountCompanyName: Joi.string().trim().required(),
    date: Joi.date().iso().optional(),
    billName: Joi.string().trim().required(),
    expenseAmount: Joi.number().precision(2).min(0).required(),
    paymentMethod: Joi.string().allow('').optional(),
    category: Joi.string().trim().required(),
    notes: Joi.string().allow('').optional(),
    // file is handled by multer (multipart) — validator checks textual fields only
});

const update = Joi.object({
    accountCompanyName: Joi.string().trim().optional(),
    date: Joi.date().iso().optional(),
    billName: Joi.string().trim().optional(),
    expenseAmount: Joi.number().precision(2).min(0).optional(),
    paymentMethod: Joi.string().allow('').optional(),
    category: Joi.string().trim().optional(),
    notes: Joi.string().allow('').optional(),
    isActive: Joi.boolean().optional()
});

module.exports = { create, update };
