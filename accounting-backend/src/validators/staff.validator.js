// src/validators/staff.validator.js
const Joi = require('joi');

// ── Helper: coerce empty strings to null ───────────────────────────────
// Prevents '' from reaching the DB where it would collide with unique /
// partial indexes or simply waste storage.
const optionalString = (schema) => schema.allow('', null).empty('').default(null);
const optionalTrimmed = (maxLen = 500) => optionalString(Joi.string().trim().max(maxLen));

const base = {
    // ── Required (*) fields ────────────────────────────────────────────
    name: Joi.string().trim().min(2).max(100).required().messages({
        'string.empty': 'Staff name is required',
        'string.min': 'Staff name must be at least 2 characters',
        'any.required': 'Staff name is required'
    }),
    dateOfJoining: Joi.date().iso().required().messages({
        'date.base': 'Please enter a valid date of joining',
        'any.required': 'Date of joining is required'
    }),
    salaryAmount: Joi.number().min(0).max(10000000).precision(2).required().messages({
        'number.base': 'Salary amount must be a number',
        'number.min': 'Salary amount cannot be negative',
        'number.max': 'Salary amount cannot exceed 1 crore (10,000,000)',
        'any.required': 'Salary amount is required'
    }),
    accountCompanyName: Joi.string().trim().required().messages({
        'string.empty': 'Company name is required',
        'any.required': 'Company name is required'
    }),

    // ── Optional personal details ──────────────────────────────────────
    fatherName: optionalString(Joi.string().trim().min(2).max(100)).messages({
        'string.min': 'Father name must be at least 2 characters'
    }),
    dateOfBirth: Joi.date().iso().max('now').allow(null).empty('').default(null).messages({
        'date.max': 'Date of birth cannot be in the future'
    }),

    // ── Optional contact (empty → null to satisfy partial unique index) ─
    mobile: optionalString(Joi.string().trim().pattern(/^[0-9]{10}$/)).messages({
        'string.pattern.base': 'Mobile number must be exactly 10 digits'
    }),
    fatherMobileNumber: optionalString(Joi.string().trim().pattern(/^[0-9]{10}$/)).messages({
        'string.pattern.base': 'Father mobile number must be exactly 10 digits'
    }),
    email: optionalString(Joi.string().email({ minDomainSegments: 2 }).lowercase().trim()).messages({
        'string.email': 'Please enter a valid email address'
    }),
    address: optionalTrimmed(500),

    // ── Optional Aadhar ────────────────────────────────────────────────
    aadharNumber: optionalString(Joi.string().trim().pattern(/^[0-9]{12}$/)).messages({
        'string.pattern.base': 'Aadhar number must be exactly 12 digits'
    }),
    aadharImage: optionalTrimmed(1000),

    // ── Salary config ──────────────────────────────────────────────────
    salaryType: Joi.string().valid('monthly', 'daily').default('monthly'),
    sundayIncluded: Joi.boolean().default(true),

    // ── Optional bank ──────────────────────────────────────────────────
    bankAccountNumber: optionalString(Joi.string().trim().pattern(/^[0-9]{9,18}$/)).messages({
        'string.pattern.base': 'Bank account number must be 9-18 digits'
    }),
    bankIfscCode: optionalString(Joi.string().trim().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).uppercase()).messages({
        'string.pattern.base': 'IFSC code must be in valid format (e.g., SBIN0001234)'
    }),
    bankName: optionalTrimmed(100),
    upiId: optionalString(Joi.string().trim().pattern(/^[a-zA-Z0-9._-]+@[a-zA-Z]+$/)).messages({
        'string.pattern.base': 'UPI ID must be in valid format (e.g., username@upi)'
    }),

    // ── Optional department / role ─────────────────────────────────────
    department: optionalString(Joi.string().trim().min(2).max(50)).messages({
        'string.min': 'Department name must be at least 2 characters'
    }),
    designation: optionalString(Joi.string().trim().min(2).max(50)).messages({
        'string.min': 'Designation must be at least 2 characters'
    }),

    // ── Status / exit ──────────────────────────────────────────────────
    status: Joi.string().valid('active', 'inactive', 'terminated').default('active'),
    exitDate: Joi.date().iso().allow(null).empty('').default(null),
    exitReason: optionalTrimmed(500),

    isActive: Joi.boolean().optional(),
};

const createSchema = Joi.object({ ...base });

const updateSchema = Joi.object({
    ...base,
    // On update these required-on-create fields become optional
    name: Joi.string().trim().min(2).max(100).optional().messages({
        'string.min': 'Staff name must be at least 2 characters'
    }),
    dateOfJoining: Joi.date().iso().optional().allow(null).empty('').messages({
        'date.base': 'Please enter a valid date of joining'
    }),
    salaryAmount: Joi.number().min(0).max(10000000).precision(2).optional().messages({
        'number.min': 'Salary amount cannot be negative',
        'number.max': 'Salary amount cannot exceed 1 crore (10,000,000)'
    }),
    // accountCompanyName stays required for authorization scoping
    accountCompanyName: Joi.string().trim().required().messages({
        'string.empty': 'Company name is required',
        'any.required': 'Company name is required'
    }),
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
