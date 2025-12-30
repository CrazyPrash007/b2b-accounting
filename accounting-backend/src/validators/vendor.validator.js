// src/validators/vendor.validator.js
const Joi = require('joi');

const baseString = () => Joi.string().trim().allow('').optional();
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const create = Joi.object({
    accountCompanyName: objectId.required().messages({
        'any.required': 'Company selection is required',
        'string.pattern.base': 'Invalid company ID format'
    }),
    vendorName: Joi.string().trim().required().messages({
        'any.required': 'Vendor name is required',
        'string.empty': 'Vendor name cannot be empty'
    }),
    name: Joi.string().trim().allow('').optional(),

    // Basic Details
    mobileNumber: Joi.string().trim().allow('').optional().messages({
        'string.base': 'Mobile number must be a valid string'
    }),
    emailAddress: Joi.string().trim().email().allow('').optional().messages({
        'string.email': 'Please enter a valid email address (e.g., example@domain.com)'
    }),
    websiteLink: Joi.string().trim().uri().allow('').optional().messages({
        'string.uri': 'Please enter a valid website URL (e.g., https://example.com)'
    }),

    // Company Details
    companyName: Joi.string().trim().allow('').optional(),
    gstType: Joi.string().valid('Regular', 'Composition', 'Unregistered').optional().messages({
        'any.only': 'GST type must be Regular, Composition, or Unregistered'
    }),

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

    // Chat integration
    chatUserId: Joi.string().trim().allow('', null).optional(),
    chatConversationId: Joi.string().trim().allow('', null).optional(),

    isActive: Joi.boolean().optional(),
});

const update = create.fork(['accountCompanyName'], (s) => s.optional());

module.exports = { create, update };
