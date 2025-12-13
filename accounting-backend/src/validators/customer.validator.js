// src/validators/customer.validator.js
const Joi = require('joi');

const baseString = () => Joi.string().trim().allow('').optional();
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const create = Joi.object({
    accountCompanyName: objectId.required(),
    customerName: Joi.string().trim().required(),
    name: Joi.string().trim().allow('').optional(),

    // Basic Details
    mobileNumber: Joi.string().trim().allow('').optional(),
    emailAddress: Joi.string().trim().email().allow('').optional(),
    websiteLink: Joi.string().trim().uri().allow('').optional(),

    // Company Details
    companyName: Joi.string().trim().allow('').optional(),
    gstType: Joi.string().valid('Regular', 'Composition', 'Unregistered').optional(),

    // Billing Details
    billingAddress: baseString(),
    billingPinCode: baseString(),
    billingVillage: baseString(),
    billingTehsil: baseString(),
    billingDistrict: baseString(),
    billingState: baseString(),
    billingCountry: baseString(),

    // Shipping Details
    sameAsBilling: Joi.boolean().optional(),
    shippingAddress: baseString(),
    shippingPinCode: baseString(),
    shippingVillage: baseString(),
    shippingTehsil: baseString(),
    shippingDistrict: baseString(),
    shippingState: baseString(),
    shippingCountry: baseString(),

    // Opening Balance
    openingBalanceType: Joi.string().valid('Credit', 'Debit').optional(),
    // allow number or empty string (frontend may send ""), allow null
    openingBalanceAmount: Joi.alternatives().try(Joi.number(), Joi.string().trim().allow(''), Joi.allow(null)).optional(),

    // flags
    isActive: Joi.boolean().optional(),
});

const update = create.fork(['accountCompanyName'], (s) => s.optional());

module.exports = { create, update };
