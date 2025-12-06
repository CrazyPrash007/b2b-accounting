// src/validators/purchase.validator.js
const Joi = require('joi');

// Helper schemas
const itemLine = Joi.object({
    id: Joi.any().optional(),
    itemId: Joi.string().optional().allow(null, ''),
    goodsService: Joi.string().allow('').optional(),
    qty: Joi.number().min(0).optional().allow('', null),
    rate: Joi.number().min(0).optional().allow('', null),
    gstPercent: Joi.number().min(0).max(100).optional().allow('', null),
    gstType: Joi.string().valid('Excluded', 'Included').optional(),
    actualAmount: Joi.number().min(0).optional().allow('', null),
    finalAmount: Joi.number().min(0).optional().allow('', null),
});

const additionalCharge = Joi.object({
    name: Joi.string().allow('').optional(),
    amount: Joi.number().min(0).optional().allow('', null),
});

const paymentSplit = Joi.object({
    mode: Joi.string().allow('').optional(),
    amount: Joi.number().min(0).optional().allow('', null),
});

const base = {
    supplier: Joi.string().trim().optional().allow(''),
    invoicePrefix: Joi.string().trim().optional().allow(''),
    invoiceNumber: Joi.string().trim().optional().allow(''),
    invoiceSuffix: Joi.string().trim().optional().allow(''),
    invoiceDate: Joi.date().iso().optional().allow(null, ''),

    supplierInvoiceNumber: Joi.string().trim().optional().allow(''),
    supplierInvoiceDate: Joi.date().iso().optional().allow(null, ''),

    items: Joi.array().items(itemLine).optional(),

    withGst: Joi.boolean().optional(),

    isPaymentMade: Joi.boolean().optional(),
    paymentMode: Joi.string().trim().optional().allow(''),
    refNo: Joi.string().trim().optional().allow(''),
    paidFrom: Joi.string().trim().optional().allow(''),
    paymentAmount: Joi.number().min(0).optional().allow(null, ''),
    payFull: Joi.boolean().optional(),

    discount: Joi.number().min(0).optional().allow(null, ''),
    autoRoundOff: Joi.boolean().optional(),
    totalAmount: Joi.number().min(0).optional().allow(null, ''),
    taxableAmount: Joi.number().min(0).optional().allow(null, ''),
    gstAmount: Joi.number().min(0).optional().allow(null, ''),

    additionalCharges: Joi.array().items(additionalCharge).optional(),
    payments: Joi.array().items(paymentSplit).optional(),

    description: Joi.string().allow('').optional(),
};

const create = Joi.object({
    ...base,
    // invoiceNumber might be required depending on your server rules — keep optional here
});

const update = Joi.object({
    // allow partial updates
    ...Object.keys(base).reduce((acc, k) => {
        acc[k] = base[k];
        return acc;
    }, {}),
});

module.exports = { create, update };
