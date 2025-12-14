// src/validators/purchase.validator.js
const Joi = require('joi');

// --- Helper Schemas ---------------------------------------------------------

const objectId = Joi.string().hex().length(24);
const objectnewId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const itemLine = Joi.object({
    id: Joi.any().optional(),

    itemId: objectId.allow(null, ''),

    // canonical name + legacy goodsService
    name: Joi.string().allow('').optional(),
    goodsService: Joi.string().allow('').optional(),

    qty: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow(''), Joi.allow(null)).optional(),
    rate: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow(''), Joi.allow(null)).optional(),
    gstPercent: Joi.alternatives().try(Joi.number().min(0).max(100), Joi.string().allow(''), Joi.allow(null)).optional(),
    gstType: Joi.string().valid('Excluded', 'Included').optional(),

    actualAmount: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow(''), Joi.allow(null)).optional(),
    finalAmount: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow(''), Joi.allow(null)).optional(),
});

const additionalCharge = Joi.object({
    name: Joi.string().allow('').optional(),
    amount: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow(''), Joi.allow(null)).optional(),
});

const paymentSplit = Joi.object({
    mode: Joi.string().allow('').optional(),
    amount: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow(''), Joi.allow(null)).optional(),
});

// --- Base Schema ------------------------------------------------------------

const base = {
    accountCompanyName: objectnewId.required(),

    supplier: Joi.string().trim().allow('').optional(),
    invoicePrefix: Joi.string().trim().allow('').optional(),
    invoiceNumber: Joi.string().trim().allow('').optional(),
    invoiceSuffix: Joi.string().trim().allow('').optional(),
    invoiceDate: Joi.date().iso().allow(null, '').optional(),

    supplierInvoiceNumber: Joi.string().trim().allow('').optional(),
    supplierInvoiceDate: Joi.date().iso().allow(null, '').optional(),

    items: Joi.array().items(itemLine).optional(),

    withGst: Joi.boolean().optional(),

    isPaymentMade: Joi.boolean().optional(),
    paymentMode: Joi.string().trim().allow('').optional(),
    refNo: Joi.string().trim().allow('').optional(),
    paidFrom: Joi.string().trim().allow('').optional(),
    paymentAmount: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow(''), Joi.allow(null)).optional(),
    payFull: Joi.boolean().optional(),

    discount: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow(''), Joi.allow(null)).optional(),
    autoRoundOff: Joi.boolean().optional(),
    totalAmount: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow(''), Joi.allow(null)).optional(),
    taxableAmount: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow(''), Joi.allow(null)).optional(),
    gstAmount: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow(''), Joi.allow(null)).optional(),

    additionalCharges: Joi.array().items(additionalCharge).optional(),
    payments: Joi.array().items(paymentSplit).optional(),

    description: Joi.string().allow('').optional(),
};

// --- Create Schema ----------------------------------------------------------

const create = Joi.object({
    ...base
});

// --- Update Schema ----------------------------------------------------------

const update = create.fork(['accountCompanyName'], (s) => s.optional());

module.exports = { create, update };
