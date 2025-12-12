// src/validators/brand.validator.js
const Joi = require('joi');

const create = Joi.object({
    accountCompanyName: Joi.string().trim().required(),
    brandName: Joi.string().trim().required(),
    isActive: Joi.boolean().optional(),
});

const update = Joi.object({
    accountCompanyName: Joi.string().trim().optional(),
    brandName: Joi.string().trim().optional(),
    isActive: Joi.boolean().optional(),
});

module.exports = { create, update };
