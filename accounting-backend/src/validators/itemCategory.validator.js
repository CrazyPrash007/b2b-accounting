// src/validators/itemCategory.validator.js
const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const create = Joi.object({
    accountCompanyName: objectId.required(),
    name: Joi.string().trim().required(),
    subcategories: Joi.array().items(Joi.string().trim()).optional(),
    isActive: Joi.boolean().optional(),
});

const update = create.fork(['accountCompanyName'], (s) => s.optional());

module.exports = { create, update };
