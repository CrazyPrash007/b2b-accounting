const Joi = require('joi');

const objectId = Joi.string().hex().length(24);
const objectnewId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const saleItem = Joi.object({
    itemId: objectId.optional().allow(null),
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

const additionalCharge = Joi.object({
    name: Joi.string().trim().required(),
    amount: Joi.number().min(0).required(),
});

const paymentSplit = Joi.object({
    mode: Joi.string().trim().required(),
    amount: Joi.number().min(0).required(),
    refNo: Joi.string().allow('').optional(),
    depositTo: Joi.string().allow('').optional(),
});

// Advance payment schema
const advancePaymentSchema = Joi.object({
    receiptId: objectId.required(),
    amount: Joi.number().min(0).required(),
});

// CREATE
const create = Joi.object({
    accountCompanyName: objectnewId.required(),
    customerId: objectId.optional().allow(null),
    customer: Joi.string().trim().required(),

    invoicePrefix: Joi.string().trim().optional(),
    invoiceNumber: Joi.string().trim().required(),
    invoiceSuffix: Joi.string().trim().optional().allow(''),

    invoiceDate: Joi.date().iso().required(),

    items: Joi.array().items(saleItem).min(1).required(),

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

    // Advance payment support
    advancePayment: advancePaymentSchema.optional().allow(null),

    taxableAmount: Joi.number().optional().allow(null),
    gstAmount: Joi.number().optional().allow(null),
    subTotal: Joi.number().optional().allow(null),
    totalAmount: Joi.number().optional().allow(null),

    autoRoundOff: Joi.boolean().optional(),
    description: Joi.string().allow('').optional(),
});

// UPDATE
const update = create.fork(['accountCompanyName'], (s) => s.optional());

module.exports = { create, update };
