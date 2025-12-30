// src/validators/bank.validator.js
const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const create = Joi.object({
    accountCompanyName: objectId.required().messages({
        'any.required': 'Company selection is required',
        'string.pattern.base': 'Invalid company ID format'
    }),
    accountDisplayName: Joi.string().trim().required().messages({
        'any.required': 'Account display name is required',
        'string.empty': 'Account display name cannot be empty'
    }),
    shortAliasName: Joi.string().trim().allow(''),
    emailAddress: Joi.string().trim().email().allow('').messages({
        'string.email': 'Please enter a valid email address'
    }),
    phoneNo: Joi.string().trim().allow(''),

    accountHolderName: Joi.string().trim().allow(''),
    accountNumber: Joi.string().trim().required().messages({
        'any.required': 'Account number is required',
        'string.empty': 'Account number cannot be empty'
    }),
    ifscCode: Joi.string().trim().allow(''),
    bankName: Joi.string().trim().required().messages({
        'any.required': 'Bank name is required',
        'string.empty': 'Bank name cannot be empty'
    }),

    openingBalance: Joi.number().optional().messages({
        'number.base': 'Opening balance must be a valid number'
    }),
    openingBalanceType: Joi.string().valid('Credit', 'Debit').messages({
        'any.only': 'Balance type must be Credit or Debit'
    }),

    status: Joi.string().valid('Active', 'Inactive').messages({
        'any.only': 'Status must be Active or Inactive'
    }),
    isActive: Joi.boolean()
});

const update = create.fork(['accountCompanyName'], (s) => s.optional());

module.exports = { create, update };
