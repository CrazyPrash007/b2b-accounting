// src/validators/sale.validator.js
const Joi = require('joi');

const objectId = Joi.string().hex().length(24);
const objectnewId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const saleItem = Joi.object({
    itemId: objectId.optional().allow(null),
    goodsService: Joi.string().trim().optional().allow(''),
    name: Joi.string().trim().optional().allow(''),
    description: Joi.string().allow('').optional(),
    qty: Joi.number().min(0).required().messages({
        'any.required': 'Item quantity is required',
        'number.base': 'Quantity must be a valid number',
        'number.min': 'Quantity cannot be negative'
    }),
    rate: Joi.number().min(0).required().messages({
        'any.required': 'Item rate is required',
        'number.base': 'Rate must be a valid number',
        'number.min': 'Rate cannot be negative'
    }),
    sellPrice: Joi.number().min(0).optional().allow(null),
    gstPercent: Joi.number().min(0).max(100).optional().allow(null).messages({
        'number.min': 'GST percent cannot be negative',
        'number.max': 'GST percent cannot exceed 100%'
    }),
    gstType: Joi.string().valid('Excluded', 'Included').optional().messages({
        'any.only': 'GST type must be Excluded or Included'
    }),
    actualAmount: Joi.number().min(0).optional().allow(null),
    finalAmount: Joi.number().min(0).optional().allow(null),
    hsnNo: Joi.string().allow('').optional(),
    unit: Joi.string().allow('').optional(),
}).unknown(false);

const additionalCharge = Joi.object({
    name: Joi.string().trim().required().messages({
        'any.required': 'Charge name is required',
        'string.empty': 'Charge name cannot be empty'
    }),
    amount: Joi.number().min(0).required().messages({
        'any.required': 'Charge amount is required',
        'number.min': 'Charge amount cannot be negative'
    }),
});

const paymentSplit = Joi.object({
    mode: Joi.string().trim().required().messages({
        'any.required': 'Payment mode is required'
    }),
    amount: Joi.number().min(0).required().messages({
        'any.required': 'Payment amount is required',
        'number.min': 'Payment amount cannot be negative'
    }),
    refNo: Joi.string().allow('').optional(),
    depositTo: Joi.string().allow('').optional(),
});

// Advance payment schema
const advancePaymentSchema = Joi.object({
    receiptId: objectId.required().messages({
        'any.required': 'Receipt ID is required for advance payment'
    }),
    amount: Joi.number().min(0).required().messages({
        'any.required': 'Advance amount is required',
        'number.min': 'Advance amount cannot be negative'
    }),
});

// CREATE
const create = Joi.object({
    accountCompanyName: objectnewId.required().messages({
        'any.required': 'Company selection is required',
        'string.pattern.base': 'Invalid company ID format'
    }),
    customerId: objectId.optional().allow(null),
    customer: Joi.string().trim().required().messages({
        'any.required': 'Customer name is required',
        'string.empty': 'Please select or enter a customer'
    }),

    invoicePrefix: Joi.string().trim().optional(),
    invoiceNumber: Joi.string().trim().required().messages({
        'any.required': 'Invoice number is required',
        'string.empty': 'Invoice number cannot be empty'
    }),
    invoiceSuffix: Joi.string().trim().optional().allow(''),

    invoiceDate: Joi.date().iso().required().messages({
        'any.required': 'Invoice date is required',
        'date.base': 'Please enter a valid invoice date'
    }),

    items: Joi.array().items(saleItem).min(1).required().messages({
        'any.required': 'At least one item is required',
        'array.min': 'Please add at least one item to the invoice'
    }),

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
