// src/validators/bank.validator.js
const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const create = Joi.object({
    accountCompanyName: objectId.required(),
    accountDisplayName: Joi.string().trim().required(),
    shortAliasName: Joi.string().trim().allow(''),
    emailAddress: Joi.string().trim().email().allow(''),
    phoneNo: Joi.string().trim().allow(''),

    accountHolderName: Joi.string().trim().allow(''),
    accountNumber: Joi.string().trim().required(),
    ifscCode: Joi.string().trim().allow(''),
    bankName: Joi.string().trim().required(),

    openingBalance: Joi.number().optional(),
    openingBalanceType: Joi.string().valid('Credit', 'Debit'),

    status: Joi.string().valid('Active', 'Inactive'),
    isActive: Joi.boolean()
});

const update = create.fork(['accountCompanyName'], (s) => s.optional());

module.exports = { create, update };
