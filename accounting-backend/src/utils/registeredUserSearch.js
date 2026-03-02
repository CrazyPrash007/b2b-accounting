// src/utils/registeredUserSearch.js
// Shared utility for searching registered users (User + Company from chat-starter DB)
// Used by both customer and vendor global search.

const { getChatStarterConnection } = require('../db/mongo');
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
}, { collection: 'users' });

const CompanySchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    companyName: String,
    businessType: [String],
    industryType: String,
    gst: String,
    registrationType: String,
    address1: String,
    address2: String,
    country: String,
    pincode: String,
    state: String,
    city: String,
    mobile: String,
    email: String,
}, { collection: 'companies' });

let RegisteredUser = null;
let RegisteredCompany = null;

function getModels() {
    if (RegisteredUser && RegisteredCompany) return { RegisteredUser, RegisteredCompany };
    try {
        const conn = getChatStarterConnection();
        RegisteredUser = conn.models['RegisteredUser'] || conn.model('RegisteredUser', UserSchema);
        RegisteredCompany = conn.models['RegisteredCompany'] || conn.model('RegisteredCompany', CompanySchema);
        return { RegisteredUser, RegisteredCompany };
    } catch (err) {
        console.error('[registeredUserSearch] Failed to get models:', err.message);
        return { RegisteredUser: null, RegisteredCompany: null };
    }
}

function normalizePhone(phone) {
    if (!phone) return '';
    let cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.length > 10 && cleaned.startsWith('91')) {
        cleaned = cleaned.substring(2);
    }
    return cleaned.slice(-10);
}

/**
 * Search registered users by name, phone, company name, or company mobile.
 * Returns: array of { userId, userName, userPhone, userEmail, companies: [...] }
 * Each company: { companyId, companyName, mobile, gst, registrationType, address, city, state, pincode, country, businessType, industryType }
 */
async function searchRegisteredUsers(searchTerm, limit = 20) {
    const { RegisteredUser, RegisteredCompany } = getModels();
    if (!RegisteredUser || !RegisteredCompany) {
        console.warn('[registeredUserSearch] Models not available');
        return [];
    }

    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const normalizedSearch = normalizePhone(searchTerm);

    // 1. Search users by name or phone
    const userPhonePatterns = normalizedSearch && normalizedSearch.length >= 3
        ? [{ phone: regex }, { phone: { $regex: normalizedSearch + '$' } }]
        : [{ phone: regex }];

    const userMatches = await RegisteredUser.find({
        $or: [
            { name: regex },
            ...userPhonePatterns,
        ]
    }).select('_id name email phone').limit(Number(limit) * 2).lean();

    // 2. Search companies by name or mobile
    const companyPhonePatterns = normalizedSearch && normalizedSearch.length >= 3
        ? [{ mobile: regex }, { mobile: { $regex: normalizedSearch + '$' } }]
        : [{ mobile: regex }];

    const companyMatches = await RegisteredCompany.find({
        $or: [
            { companyName: regex },
            ...companyPhonePatterns,
        ]
    }).select('_id owner companyName businessType industryType gst registrationType address1 address2 country pincode state city mobile email').lean();

    // 3. Collect all unique user IDs (from direct user matches + company owners)
    const userIdSet = new Map(); // userId string -> user doc or null

    for (const u of userMatches) {
        userIdSet.set(u._id.toString(), u);
    }
    for (const c of companyMatches) {
        if (c.owner && !userIdSet.has(c.owner.toString())) {
            userIdSet.set(c.owner.toString(), null); // will fetch below
        }
    }

    // 4. Fetch any missing user docs (company owners not in initial user search)
    const missingUserIds = [];
    for (const [uid, doc] of userIdSet) {
        if (!doc) missingUserIds.push(uid);
    }
    if (missingUserIds.length > 0) {
        const extraUsers = await RegisteredUser.find({
            _id: { $in: missingUserIds }
        }).select('_id name email phone').lean();
        for (const u of extraUsers) {
            userIdSet.set(u._id.toString(), u);
        }
    }

    // 5. Fetch ALL companies for matched users (to show all their companies, not just the one matched)
    const allUserIds = [...userIdSet.keys()].filter(uid => userIdSet.get(uid) !== null);
    const allCompanies = await RegisteredCompany.find({
        owner: { $in: allUserIds }
    }).select('_id owner companyName businessType industryType gst registrationType address1 address2 country pincode state city mobile email').lean();

    // 6. Group companies by owner
    const companiesByOwner = new Map();
    for (const c of allCompanies) {
        const ownerStr = c.owner.toString();
        if (!companiesByOwner.has(ownerStr)) {
            companiesByOwner.set(ownerStr, []);
        }
        companiesByOwner.get(ownerStr).push({
            companyId: c._id,
            companyName: c.companyName || '',
            mobile: c.mobile || '',
            email: c.email || '',
            gst: c.gst || '',
            registrationType: c.registrationType || 'unregistered',
            address: [c.address1, c.address2].filter(Boolean).join(', '),
            city: c.city || '',
            state: c.state || '',
            pincode: c.pincode || '',
            country: c.country || 'India',
            businessType: c.businessType || [],
            industryType: c.industryType || '',
        });
    }

    // 7. Build final result
    const results = [];
    for (const [uid, userDoc] of userIdSet) {
        if (!userDoc) continue; // skipped if user lookup failed
        results.push({
            userId: userDoc._id,
            userName: userDoc.name || '',
            userPhone: userDoc.phone || '',
            userEmail: userDoc.email || '',
            companies: companiesByOwner.get(uid) || [],
        });
    }

    return results.slice(0, Number(limit));
}

/**
 * Check if a mobile number belongs to a registered user or company.
 * Returns matching registered users with their companies, or empty array if not found.
 */
async function checkMobileRegistered(mobileNumber) {
    const { RegisteredUser, RegisteredCompany } = getModels();
    if (!RegisteredUser || !RegisteredCompany) return [];

    const normalized = normalizePhone(mobileNumber);
    if (!normalized || normalized.length < 10) return [];

    // Check user phone
    const phonePatterns = [
        mobileNumber,
        normalized,
        `+91${normalized}`,
        `91${normalized}`,
    ];

    const matchedUsers = await RegisteredUser.find({
        $or: [
            ...phonePatterns.map(p => ({ phone: p })),
            { phone: { $regex: normalized + '$' } }
        ]
    }).select('_id name email phone').lean();

    // Check company mobile
    const matchedCompanies = await RegisteredCompany.find({
        $or: [
            ...phonePatterns.map(p => ({ mobile: p })),
            { mobile: { $regex: normalized + '$' } }
        ]
    }).select('_id owner companyName mobile gst registrationType address1 address2 city state pincode country businessType industryType email').lean();

    // Build result: one entry per unique user
    const userMap = new Map();

    for (const u of matchedUsers) {
        userMap.set(u._id.toString(), {
            userId: u._id,
            userName: u.name || '',
            userPhone: u.phone || '',
            userEmail: u.email || '',
            companies: [],
        });
    }

    // For company matches, fetch owner user if not already in map
    const missingOwnerIds = [];
    for (const c of matchedCompanies) {
        if (c.owner && !userMap.has(c.owner.toString())) {
            missingOwnerIds.push(c.owner);
        }
    }
    if (missingOwnerIds.length > 0) {
        const owners = await RegisteredUser.find({ _id: { $in: missingOwnerIds } })
            .select('_id name email phone').lean();
        for (const o of owners) {
            userMap.set(o._id.toString(), {
                userId: o._id,
                userName: o.name || '',
                userPhone: o.phone || '',
                userEmail: o.email || '',
                companies: [],
            });
        }
    }

    // Fetch ALL companies for matched users
    const allUserIds = [...userMap.keys()];
    if (allUserIds.length > 0) {
        const allCompanies = await RegisteredCompany.find({
            owner: { $in: allUserIds }
        }).select('_id owner companyName businessType industryType gst registrationType address1 address2 country pincode state city mobile email').lean();

        for (const c of allCompanies) {
            const ownerStr = c.owner.toString();
            const entry = userMap.get(ownerStr);
            if (entry) {
                entry.companies.push({
                    companyId: c._id,
                    companyName: c.companyName || '',
                    mobile: c.mobile || '',
                    email: c.email || '',
                    gst: c.gst || '',
                    registrationType: c.registrationType || 'unregistered',
                    address: [c.address1, c.address2].filter(Boolean).join(', '),
                    city: c.city || '',
                    state: c.state || '',
                    pincode: c.pincode || '',
                    country: c.country || 'India',
                    businessType: c.businessType || [],
                    industryType: c.industryType || '',
                });
            }
        }
    }

    return [...userMap.values()];
}

module.exports = { searchRegisteredUsers, checkMobileRegistered, normalizePhone };
