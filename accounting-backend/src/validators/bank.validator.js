// src/validators/bank.validator.js
const Joi = require('joi');

const create = Joi.object({
    accountDisplayName: Joi.string().trim().required(),
    shortAliasName: Joi.string().trim().optional().allow(''),
    emailAddress: Joi.string().trim().email().optional().allow(''),
    phoneNo: Joi.string().trim().optional().allow(''),
    accountHolderName: Joi.string().trim().optional().allow(''),
    accountNumber: Joi.string().trim().required(),
    ifscCode: Joi.string().trim().optional().allow(''),
    bankName: Joi.string().trim().required(),

    openingBalance: Joi.number().optional().default(0),
    openingBalanceType: Joi.string().valid('Credit', 'Debit').optional().default('Credit'),

    status: Joi.string().valid('Active', 'Inactive').optional().default('Active'),
    isActive: Joi.boolean().optional(),

    // additional metadata fields will be added server-side (ownerId, createdBy)
});

const update = Joi.object({
    accountDisplayName: Joi.string().trim().optional(),
    shortAliasName: Joi.string().trim().optional().allow(''),
    emailAddress: Joi.string().trim().email().optional().allow(''),
    phoneNo: Joi.string().trim().optional().allow(''),
    accountHolderName: Joi.string().trim().optional().allow(''),
    accountNumber: Joi.string().trim().optional(),
    ifscCode: Joi.string().trim().optional().allow(''),
    bankName: Joi.string().trim().optional(),

    openingBalance: Joi.number().optional(),
    openingBalanceType: Joi.string().valid('Credit', 'Debit').optional(),

    status: Joi.string().valid('Active', 'Inactive').optional(),
    isActive: Joi.boolean().optional(),
});

module.exports = { create, update };
