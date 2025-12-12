// src/validators/itemCategory.validator.js
const Joi = require('joi');

const create = Joi.object({
    accountCompanyName: Joi.string().trim().required(),
    name: Joi.string().trim().required(),
    subcategories: Joi.array().items(Joi.string().trim()).optional(),
    isActive: Joi.boolean().optional(),
});

const update = Joi.object({
    accountCompanyName: Joi.string().trim().optional(),
    name: Joi.string().trim().optional(),
    subcategories: Joi.array().items(Joi.string().trim()).optional(),
    isActive: Joi.boolean().optional(),
});

module.exports = { create, update };
