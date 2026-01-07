const { getCompanyModel } = require('../models/Company');
const { chatStarterConnection } = require('../db/mongo');

async function listCompanies(req, res, next) {
    try {
        const Company = getCompanyModel();

        // Check if requesting another user's companies (for viewing profiles)
        const requestedUserId = req.headers['x-user-id'] || req.headers['user-id'];
        const ownerId = requestedUserId || req.user.ownerId;

        const companies = await Company.find({ owner: ownerId }).lean();

        res.json({ success: true, data: companies });
    } catch (err) {
        next(err);
    }
}

/**
 * GET ONE COMPANY
 * Fetch a single company by ID for the logged-in user
 */
async function getOne(req, res, next) {
    try {
        const Company = getCompanyModel();
        const companyId = req.params.id;

        const company = await Company.findOne({
            _id: companyId,
            owner: req.user.ownerId
        }).lean();

        if (!company) {
            return res.status(404).json({
                success: false,
                error: { message: "Company not found" }
            });
        }

        res.json({ success: true, data: company });
    } catch (err) {
        next(err);
    }
}

/**
 * CREATE COMPANY
 * Creates a new company for the logged-in user
 */
async function createCompany(req, res, next) {
    try {
        const Company = getCompanyModel();
        const ownerId = req.user.ownerId;

        const {
            companyName,
            businessType,
            industryType,
            registrationType,
            gstin,
            addressLine1,
            addressLine2,
            city,
            state,
            pincode,
            country,
            mobile,
            email,
        } = req.body;

        // Validate required field
        if (!companyName || !companyName.trim()) {
            return res.status(400).json({
                success: false,
                error: { message: "companyName is required" }
            });
        }

        // Check for duplicate company name for this owner
        const existingCompany = await Company.findOne({
            owner: ownerId,
            companyName: companyName.trim()
        }).lean();

        if (existingCompany) {
            return res.status(409).json({
                success: false,
                error: { message: "A company with this name already exists" }
            });
        }

        // Create new company document
        const newCompany = await Company.create({
            owner: ownerId,
            companyName: companyName.trim(),
            businessType: businessType || "",
            industryType: industryType || "",
            registrationType: registrationType || "unregistered",
            gst: gstin || null,
            address1: addressLine1 || "",
            address2: addressLine2 || "",
            city: city || "",
            state: state || "",
            pincode: pincode || "",
            country: country || "India",
            mobile: mobile || "",
            email: email || "",
        });

        res.status(201).json({
            success: true,
            data: newCompany.toObject()
        });

    } catch (err) {
        // Handle duplicate key error from unique index
        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                error: { message: "A company with this name already exists" }
            });
        }
        next(err);
    }
}

module.exports = { listCompanies, getOne, createCompany };
