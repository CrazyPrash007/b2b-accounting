// src/validators/gst.validator.js
const Joi = require('joi');

const create = Joi.object({
    accountCompanyName: Joi.string().trim().required(),
    rate: Joi.number().min(0).required(),
    isActive: Joi.boolean().optional(),
});

const update = Joi.object({
    accountCompanyName: Joi.string().trim().optional(),
    rate: Joi.number().min(0).optional(),
    isActive: Joi.boolean().optional(),
});


module.exports = { create, update };
