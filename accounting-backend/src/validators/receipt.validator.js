// src/validators/receipt.validator.js
const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const base = {
    partyId: objectId.optional().allow(null, ''),
    party: Joi.string().trim().optional().allow(''),

    invoiceId: objectId.optional().allow(null, ''),
    invoiceLabel: Joi.string().trim().optional().allow(''),

    date: Joi.date().iso().optional().allow(null, ''),

    amount: Joi.number().min(0).required(),
    paymentMethod: Joi.string().trim().required(),
    referenceNumber: Joi.string().trim().optional().allow(''),
    description: Joi.string().trim().optional().allow(''),
    isDeleted: Joi.boolean().optional(),
};

// Create: require minimal fields
const create = Joi.object({
    ...base,
    // amount & paymentMethod are already required above
});

// Update: allow partial update
const update = Joi.object({
    partyId: base.partyId,
    party: base.party,
    invoiceId: base.invoiceId,
    invoiceLabel: base.invoiceLabel,
    date: base.date,
    amount: Joi.number().min(0).optional(),
    paymentMethod: Joi.string().trim().optional(),
    referenceNumber: base.referenceNumber,
    description: base.description,
    isDeleted: base.isDeleted,
});

module.exports = { create, update };
