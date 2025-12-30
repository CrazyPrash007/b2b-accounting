// src/validators/enquiry.validator.js
const Joi = require('joi');

const baseString = () => Joi.string().trim().allow('').optional();
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

// Create enquiry schema
const create = Joi.object({
    accountCompanyName: objectId.required().messages({
        'any.required': 'Company selection is required',
        'string.pattern.base': 'Invalid company ID'
    }),
    enquiryType: Joi.string().valid('buy', 'sell').required().messages({
        'any.required': 'Please select enquiry type (Buy or Sell)',
        'any.only': 'Enquiry type must be either Buy or Sell'
    }),
    distributionType: Joi.string().valid('public', 'vendors').required().messages({
        'any.required': 'Please select how to send this enquiry',
        'any.only': 'Distribution type must be either Public or Vendors'
    }),
    targetVendorIds: Joi.array().items(objectId).when('distributionType', {
        is: 'vendors',
        then: Joi.array().min(1).required(),
        otherwise: Joi.array().optional()
    }),
    // Target states for public enquiries (empty means all states)
    targetStates: Joi.array().items(Joi.string().trim()).optional(),
    productName: Joi.string().trim().required().messages({
        'any.required': 'Product name is required',
        'string.empty': 'Product name cannot be empty'
    }),
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
    price: Joi.number().min(0).required().messages({
        'any.required': 'Price is required for your quotation',
        'number.base': 'Price must be a valid number',
        'number.min': 'Price must be greater than or equal to 0'
    }),
    quantity: Joi.number().min(0).required().messages({
        'any.required': 'Quantity is required for your quotation',
        'number.base': 'Quantity must be a valid number',
        'number.min': 'Quantity must be greater than or equal to 0'
    }),
    unit: baseString(),
    message: Joi.string().trim().allow('').max(1000).optional(),
    deliveryTime: baseString(),
    paymentTerms: baseString(),
    validityDays: Joi.number().min(0).optional(),
    additionalNotes: Joi.string().trim().max(500).optional(),
});

module.exports = { create, respond };
