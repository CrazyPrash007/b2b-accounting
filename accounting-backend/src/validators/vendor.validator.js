// src/validators/vendor.validator.js
const Joi = require('joi');

const baseString = () => Joi.string().trim().allow('').optional();

const create = Joi.object({
    accountCompanyName: Joi.string().trim().required(),   // NEW & REQUIRED

    vendorName: Joi.string().trim().required(),
    name: Joi.string().trim().allow('').optional(),

    // Basic Details
    mobileNumber: Joi.string().trim().allow('').optional(),
    emailAddress: Joi.string().trim().email().allow('').optional(),
    websiteLink: Joi.string().trim().uri().allow('').optional(),

    // Company Details
    companyName: Joi.string().trim().allow('').optional(),
    gstType: Joi.string().valid('Regular', 'Composition', 'Unregistered').optional(),

    // Billing
    billingAddress: baseString(),
    billingPinCode: baseString(),
    billingVillage: baseString(),
    billingTehsil: baseString(),
    billingDistrict: baseString(),
    billingState: baseString(),
    billingCountry: baseString(),

    // Shipping
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
    openingBalanceAmount: Joi.alternatives()
        .try(Joi.number(), Joi.string().trim().allow(''), Joi.allow(null))
        .optional(),

    isActive: Joi.boolean().optional(),
});

const update = Joi.object({
    accountCompanyName: Joi.string().trim().optional(),  // INCLUDED

    vendorName: Joi.string().trim().optional(),
    name: Joi.string().trim().allow('').optional(),

    mobileNumber: Joi.string().trim().allow('').optional(),
    emailAddress: Joi.string().trim().email().allow('').optional(),
    websiteLink: Joi.string().trim().uri().allow('').optional(),

    companyName: Joi.string().trim().allow('').optional(),
    gstType: Joi.string().valid('Regular', 'Composition', 'Unregistered').optional(),

    billingAddress: baseString(),
    billingPinCode: baseString(),
    billingVillage: baseString(),
    billingTehsil: baseString(),
    billingDistrict: baseString(),
    billingState: baseString(),
    billingCountry: baseString(),

    sameAsBilling: Joi.boolean().optional(),
    shippingAddress: baseString(),
    shippingPinCode: baseString(),
    shippingVillage: baseString(),
    shippingTehsil: baseString(),
    shippingDistrict: baseString(),
    shippingState: baseString(),
    shippingCountry: baseString(),

    openingBalanceType: Joi.string().valid('Credit', 'Debit').optional(),
    openingBalanceAmount: Joi.alternatives()
        .try(Joi.number(), Joi.string().trim().allow(''), Joi.allow(null))
        .optional(),

    isActive: Joi.boolean().optional(),
});

module.exports = { create, update };
