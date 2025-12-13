const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const create = Joi.object({
    accountCompanyName: objectId.required(),
    date: Joi.date().iso().optional(),
    billName: Joi.string().trim().required(),
    expenseAmount: Joi.number().precision(2).min(0).required(),
    paymentMethod: Joi.string().allow('').optional(),
    category: Joi.string().trim().required(),
    notes: Joi.string().allow('').optional(),
    // file is handled by multer (multipart) — validator checks textual fields only
});

const update = create.fork(['accountCompanyName'], (s) => s.optional());

module.exports = { create, update };
