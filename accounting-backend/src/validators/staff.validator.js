// src/validators/staff.validator.js
const Joi = require('joi');

const base = {
    name: Joi.string().trim().min(1).max(100).required().messages({
        'string.empty': 'Staff name is required',
        'any.required': 'Staff name is required'
    }),
    fatherName: Joi.string().trim().max(100).allow('').optional(),
    dateOfBirth: Joi.date().iso().optional().allow(null),
    dateOfJoining: Joi.date().iso().required().messages({
        'date.base': 'Please enter a valid date of joining',
        'any.required': 'Date of joining is required'
    }),

    // Contact
    mobile: Joi.string().trim().max(15).allow('').optional(),
    email: Joi.string().email().allow('').optional(),
    address: Joi.string().trim().max(500).allow('').optional(),

    // Aadhar
    aadharNumber: Joi.string().trim().pattern(/^[0-9]{12}$/).allow('').optional().messages({
        'string.pattern.base': 'Aadhar number must be 12 digits'
    }),
    aadharImage: Joi.string().uri().allow('').optional(),

    // Salary
    salaryType: Joi.string().valid('monthly', 'daily').default('monthly'),
    salaryAmount: Joi.number().min(0).default(0),
    sundayIncluded: Joi.boolean().default(true),

    // Bank
    bankAccountNumber: Joi.string().trim().max(20).allow('').optional(),
    bankIfscCode: Joi.string().trim().max(15).allow('').optional(),
    bankName: Joi.string().trim().max(100).allow('').optional(),
    upiId: Joi.string().trim().max(50).allow('').optional(),

    // Department/Role
    department: Joi.string().trim().max(50).allow('').optional(),
    designation: Joi.string().trim().max(50).allow('').optional(),

    // Status
    status: Joi.string().valid('active', 'inactive', 'terminated').default('active'),
    exitDate: Joi.date().iso().optional().allow(null),
    exitReason: Joi.string().trim().max(500).allow('').optional(),

    isActive: Joi.boolean().optional(),
    accountCompanyName: Joi.string().required()
};

const createSchema = Joi.object({ ...base });

const updateSchema = Joi.object({
    ...base,
    name: Joi.string().trim().min(1).max(100).optional(),
    dateOfJoining: Joi.date().iso().optional(),
    accountCompanyName: Joi.string().required()
});

function validateCreate(data) {
    return createSchema.validate(data, { abortEarly: false, stripUnknown: true });
}

function validateUpdate(data) {
    return updateSchema.validate(data, { abortEarly: false, stripUnknown: true });
}

module.exports = {
    validateCreate,
    validateUpdate
};
