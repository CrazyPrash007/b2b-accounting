// src/validators/enquiry.validator.js
const Joi = require('joi');

const baseString = () => Joi.string().trim().allow('').optional();
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

// Create enquiry schema
const create = Joi.object({
    accountCompanyName: objectId.required(),
    enquiryType: Joi.string().valid('buy', 'sell').required(),
    productName: Joi.string().trim().required(),
    category: baseString(),
    subCategory: baseString(),
    quantity: Joi.number().min(0).optional(),
    unit: baseString(),
    expectedPrice: Joi.number().min(0).optional(),
    description: baseString(),
    targetStates: Joi.array().items(Joi.string().trim()).optional(),
    creatorName: baseString(),
    creatorCompany: baseString(),
    creatorState: baseString(),
    creatorMobile: baseString(),
    creatorEmail: Joi.string().trim().email().allow('').optional(),
    validUntil: Joi.date().optional(),
    isActive: Joi.boolean().optional(),
});

// Update enquiry schema
const update = Joi.object({
    accountCompanyName: objectId.optional(),
    enquiryType: Joi.string().valid('buy', 'sell').optional(),
    productName: Joi.string().trim().optional(),
    category: baseString(),
    subCategory: baseString(),
    quantity: Joi.number().min(0).optional(),
    unit: baseString(),
    expectedPrice: Joi.number().min(0).optional(),
    description: baseString(),
    targetStates: Joi.array().items(Joi.string().trim()).optional(),
    creatorName: baseString(),
    creatorCompany: baseString(),
    creatorState: baseString(),
    creatorMobile: baseString(),
    creatorEmail: Joi.string().trim().email().allow('').optional(),
    validUntil: Joi.date().allow(null).optional(),
    status: Joi.string().valid('open', 'closed').optional(),
    isActive: Joi.boolean().optional(),
});

// Respond to enquiry schema
const respond = Joi.object({
    responderName: baseString(),
    responderCompany: baseString(),
    responderState: baseString(),
    responderMobile: baseString(),
    responderEmail: Joi.string().trim().email().allow('').optional(),
    price: Joi.number().min(0).required(),
    quantity: Joi.number().min(0).required(),
    message: Joi.string().trim().max(1000).optional(),
});

module.exports = { create, update, respond };
