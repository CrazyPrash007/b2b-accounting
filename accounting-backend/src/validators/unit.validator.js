// src/validators/unit.validator.js
const Joi = require('joi');

const create = Joi.object({
    fullName: Joi.string().trim().required(),
    aliasName: Joi.string().trim().allow('').optional(),
    isActive: Joi.boolean().optional(),
});

const update = Joi.object({
    fullName: Joi.string().trim().optional(),
    aliasName: Joi.string().trim().allow('').optional(),
    isActive: Joi.boolean().optional(),
});

module.exports = { create, update };
