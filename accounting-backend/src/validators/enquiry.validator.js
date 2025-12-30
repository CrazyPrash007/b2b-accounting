// src/validators/enquiry.validator.js
const Joi = require('joi');

const baseString = () => Joi.string().trim().allow('').optional();
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

// Create enquiry schema
const create = Joi.object({
    accountCompanyName: objectId.required(),
    enquiryType: Joi.string().valid('buy', 'sell').required(),
    distributionType: Joi.string().valid('public', 'vendors').required(),
    targetVendorIds: Joi.array().items(objectId).when('distributionType', {
        is: 'vendors',
        then: Joi.array().min(1).required(),
        otherwise: Joi.array().optional()
    }),
    // Target states for public enquiries (empty means all states)
    targetStates: Joi.array().items(Joi.string().trim()).optional(),
    productName: Joi.string().trim().required(),
    category: baseString(),
    subCategory: baseString(),
    quantity: Joi.number().min(0).optional(),
    unit: baseString(),
    expectedPrice: Joi.number().min(0).optional(),
    description: baseString(),
    specifications: baseString(),
    deliveryLocation: baseString(),
    requiredByDate: Joi.date().allow(null).optional(),
    creatorName: baseString(),
    creatorCompany: baseString(),
    creatorState: baseString(),
    creatorMobile: baseString(),
    creatorEmail: Joi.string().trim().email().allow('').optional(),
    validUntil: Joi.date().allow(null).optional(),
    isActive: Joi.boolean().optional(),
});

// Respond to enquiry schema
const respond = Joi.object({
    accountCompanyName: objectId.optional(),
    responderName: baseString(),
    responderCompany: baseString(),
    responderState: baseString(),
    responderMobile: baseString(),
    responderEmail: Joi.string().trim().email().allow('').optional(),
    price: Joi.number().min(0).required(),
    quantity: Joi.number().min(0).required(),
    unit: baseString(),
    message: Joi.string().trim().max(1000).optional(),
    deliveryTime: baseString(),
    paymentTerms: baseString(),
    validityDays: Joi.number().min(0).optional(),
    additionalNotes: Joi.string().trim().max(500).optional(),
});

module.exports = { create, respond };
