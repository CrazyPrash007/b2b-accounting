// src/validators/sale.validator.js
const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

// Item line schema (used in create/update)
const saleItem = Joi.object({
    itemId: objectId.optional().allow(null),
    // frontend uses goodsService -> map to name in backend; accept either
    goodsService: Joi.string().trim().optional().allow(''),
    name: Joi.string().trim().optional().allow(''),
    description: Joi.string().allow('').optional(),

    qty: Joi.number().min(0).required(),
    rate: Joi.number().min(0).required(),
    sellPrice: Joi.number().min(0).optional().allow(null),

    gstPercent: Joi.number().min(0).max(100).optional().allow(null),
    gstType: Joi.string().valid('Excluded', 'Included').optional(),

    actualAmount: Joi.number().min(0).optional().allow(null),
    finalAmount: Joi.number().min(0).optional().allow(null),

    hsnNo: Joi.string().allow('').optional(),
    unit: Joi.string().allow('').optional(),
}).unknown(false);

// Additional charge schema
const additionalCharge = Joi.object({
    name: Joi.string().trim().required(),
    amount: Joi.number().min(0).required(),
}).unknown(false);

// Payment split schema
const paymentSplit = Joi.object({
    mode: Joi.string().trim().required(),
    amount: Joi.number().min(0).required(),
    refNo: Joi.string().allow('').optional(),
    depositTo: Joi.string().allow('').optional(),
}).unknown(false);

// Create validator (all required fields that frontend uses)
const create = Joi.object({
    ownerId: objectId.optional(), // usually set server-side; allow if provided
    customerId: objectId.optional().allow(null),
    customer: Joi.string().trim().required(),

    invoicePrefix: Joi.string().trim().optional().default('INV'),
    invoiceNumber: Joi.string().trim().required(),
    invoiceSuffix: Joi.string().trim().optional().allow(''),

    invoiceDate: Joi.date().iso().required(),

    items: Joi.array().items(saleItem).min(1).required(),

    withGst: Joi.boolean().optional().default(true),

    isPaymentReceived: Joi.boolean().optional().default(true),
    paymentMode: Joi.string().trim().optional().default('Cash'),
    refNo: Joi.string().allow('').optional(),
    depositTo: Joi.string().allow('').optional(),
    paymentAmount: Joi.number().min(0).optional().default(0),
    payFull: Joi.boolean().optional().default(false),

    payments: Joi.array().items(paymentSplit).optional().default([]),

    additionalCharges: Joi.array().items(additionalCharge).optional().default([]),
    discount: Joi.number().min(0).optional().default(0),

    taxableAmount: Joi.number().min(0).optional().allow(null),
    gstAmount: Joi.number().min(0).optional().allow(null),
    subTotal: Joi.number().min(0).optional().allow(null),
    totalAmount: Joi.number().min(0).optional().allow(null),

    autoRoundOff: Joi.boolean().optional().default(true),

    description: Joi.string().allow('').optional(),

    isActive: Joi.boolean().optional().default(true),
});

// Update validator (partial updates allowed)
const update = Joi.object({
    customerId: objectId.optional().allow(null),
    customer: Joi.string().trim().optional(),

    invoicePrefix: Joi.string().trim().optional(),
    invoiceNumber: Joi.string().trim().optional(),
    invoiceSuffix: Joi.string().trim().optional().allow(''),

    invoiceDate: Joi.date().iso().optional(),

    items: Joi.array().items(saleItem).min(1).optional(),

    withGst: Joi.boolean().optional(),

    isPaymentReceived: Joi.boolean().optional(),
    paymentMode: Joi.string().trim().optional(),
    refNo: Joi.string().allow('').optional(),
    depositTo: Joi.string().allow('').optional(),
    paymentAmount: Joi.number().min(0).optional(),
    payFull: Joi.boolean().optional(),

    payments: Joi.array().items(paymentSplit).optional(),

    additionalCharges: Joi.array().items(additionalCharge).optional(),
    discount: Joi.number().min(0).optional(),

    taxableAmount: Joi.number().min(0).optional().allow(null),
    gstAmount: Joi.number().min(0).optional().allow(null),
    subTotal: Joi.number().min(0).optional().allow(null),
    totalAmount: Joi.number().min(0).optional().allow(null),

    autoRoundOff: Joi.boolean().optional(),

    description: Joi.string().allow('').optional(),

    isActive: Joi.boolean().optional(),
    isDeleted: Joi.boolean().optional(),
});

module.exports = { create, update };
