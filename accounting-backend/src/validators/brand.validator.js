// src/validators/brand.validator.js
const Joi = require('joi');

const create = Joi.object({
    brandName: Joi.string().trim().required(),
    isActive: Joi.boolean().optional(),
});

const update = Joi.object({
    brandName: Joi.string().trim().optional(),
    isActive: Joi.boolean().optional(),
});

module.exports = { create, update };
