// src/controllers/enquiry.controller.js
const Enquiry = require("../models/Enquiry");
const EnquiryResponse = require("../models/EnquiryResponse");
const Vendor = require("../models/Vendor");
const mongoose = require("mongoose");

function toObjectId(id) {
    if (!id || !mongoose.isValidObjectId(id)) return null;
    return new mongoose.Types.ObjectId(id);
}

/**
 * LIST MY ENQUIRIES - User's own enquiries
 */
async function listMyEnquiries(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                message: "Valid accountCompanyName (companyId) is required",
            });
        }

        const { page = 1, limit = 50, search, sort, enquiryType, status, distributionType } = req.query;

        const q = {
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false,
        };

        // Filter by enquiry type
        if (enquiryType && ['buy', 'sell'].includes(enquiryType)) {
            q.enquiryType = enquiryType;
        }

        // Filter by status
        if (status && ['open', 'closed'].includes(status)) {
            q.status = status;
        }

        // Filter by distribution type
        if (distributionType && ['public', 'vendors'].includes(distributionType)) {
            q.distributionType = distributionType;
        }

        // Search by product name, category, description
        if (search?.trim()) {
            const s = search.trim();
            q.$or = [
                { productName: { $regex: s, $options: "i" } },
                { category: { $regex: s, $options: "i" } },
                { description: { $regex: s, $options: "i" } },
            ];
        }

        const sortObj = {};
        if (sort) {
            const [k, dir] = sort.split(":");
            sortObj[k || "createdAt"] = dir === "desc" ? -1 : 1;
        } else {
            sortObj.createdAt = -1;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [items, total] = await Promise.all([
            Enquiry.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Enquiry.countDocuments(q),
        ]);

        return res.json({
            success: true,
            data: items,
            meta: { page: Number(page), limit: Number(limit), total },
        });
    } catch (err) {
        next(err);
    }
}

/**
 * LIST PUBLIC ENQUIRIES - Public enquiries visible to all users
 * Only shows enquiries with distributionType='public'
 * Filters by targetStates if specified in the enquiry
 */
async function listPublicEnquiries(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const userState = req.query.userState; // User's company state for filtering

        const { page = 1, limit = 50, search, sort, enquiryType, category } = req.query;

        const q = {
            ownerId: { $ne: ownerId }, // Exclude user's own enquiries
            distributionType: 'public', // Only public enquiries
            status: 'open',
            isDeleted: false,
        };

        // Filter by targetStates - if enquiry has targetStates, user's state must match
        // If targetStates is empty, enquiry is visible to all states
        if (userState?.trim()) {
            q.$or = [
                { targetStates: { $size: 0 } }, // No state restriction
                { targetStates: { $exists: false } }, // No targetStates field
                { targetStates: userState.trim() }, // User's state is in targetStates
            ];
        }

        // Filter by enquiry type
        if (enquiryType && ['buy', 'sell'].includes(enquiryType)) {
            q.enquiryType = enquiryType;
        }

        // Filter by category
        if (category?.trim()) {
            q.category = { $regex: category.trim(), $options: "i" };
        }

        // Search by product name, category, description, company
        if (search?.trim()) {
            const s = search.trim();
            q.$or = [
                { productName: { $regex: s, $options: "i" } },
                { category: { $regex: s, $options: "i" } },
                { description: { $regex: s, $options: "i" } },
                { creatorCompany: { $regex: s, $options: "i" } },
            ];
        }

        const sortObj = {};
        if (sort) {
            const [k, dir] = sort.split(":");
            sortObj[k || "createdAt"] = dir === "desc" ? -1 : 1;
        } else {
            sortObj.createdAt = -1;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [items, total] = await Promise.all([
            Enquiry.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Enquiry.countDocuments(q),
        ]);

        return res.json({
            success: true,
            data: items,
            meta: { page: Number(page), limit: Number(limit), total },
        });
    } catch (err) {
        next(err);
    }
}

/**
 * LIST VENDOR ENQUIRIES - Enquiries sent specifically to the current user (as a vendor)
 * Shows enquiries where the user's chatUserId is in targetVendors
 */
async function listVendorEnquiries(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const userChatId = req.user.chatUserId || req.user.id?.toString();

        const { page = 1, limit = 50, search, sort, enquiryType, category } = req.query;

        const q = {
            ownerId: { $ne: ownerId }, // Exclude user's own enquiries
            distributionType: 'vendors',
            'targetVendors.chatUserId': userChatId, // User is a target vendor
            status: 'open',
            isDeleted: false,
        };

        // Filter by enquiry type
        if (enquiryType && ['buy', 'sell'].includes(enquiryType)) {
            q.enquiryType = enquiryType;
        }

        // Filter by category
        if (category?.trim()) {
            q.category = { $regex: category.trim(), $options: "i" };
        }

        // Search
        if (search?.trim()) {
            const s = search.trim();
            q.$or = [
                { productName: { $regex: s, $options: "i" } },
                { category: { $regex: s, $options: "i" } },
                { description: { $regex: s, $options: "i" } },
            ];
        }

        const sortObj = {};
        if (sort) {
            const [k, dir] = sort.split(":");
            sortObj[k || "createdAt"] = dir === "desc" ? -1 : 1;
        } else {
            sortObj.createdAt = -1;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [items, total] = await Promise.all([
            Enquiry.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Enquiry.countDocuments(q),
        ]);

        return res.json({
            success: true,
            data: items,
            meta: { page: Number(page), limit: Number(limit), total },
        });
    } catch (err) {
        next(err);
    }
}

/**
 * LIST MY RESPONSES - Enquiries the user has responded to
 */
async function listMyResponses(req, res, next) {
    try {
        const responderId = req.user.ownerId;

        const { page = 1, limit = 50, search, sort, status } = req.query;

        const q = {
            responderId,
            isDeleted: false,
        };

        // Filter by status
        if (status && ['pending', 'viewed', 'accepted', 'rejected', 'expired'].includes(status)) {
            q.status = status;
        }

        // Search by product name
        if (search?.trim()) {
            const s = search.trim();
            q.$or = [
                { 'enquiryDetails.productName': { $regex: s, $options: "i" } },
                { 'enquiryDetails.creatorCompany': { $regex: s, $options: "i" } },
            ];
        }

        const sortObj = {};
        if (sort) {
            const [k, dir] = sort.split(":");
            sortObj[k || "respondedAt"] = dir === "desc" ? -1 : 1;
        } else {
            sortObj.respondedAt = -1;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [items, total] = await Promise.all([
            EnquiryResponse.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            EnquiryResponse.countDocuments(q),
        ]);

        return res.json({
            success: true,
            data: items,
            meta: { page: Number(page), limit: Number(limit), total },
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET ONE ENQUIRY
 */
async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const doc = await Enquiry.findOne({
            _id: req.params.id,
            isDeleted: false,
        });

        if (!doc) {
            return res
                .status(404)
                .json({ success: false, error: { message: "Not found" } });
        }

        // Users can only see full details of their own enquiries
        // or public enquiries (responses are hidden for non-owners)
        const isOwner = doc.ownerId.toString() === ownerId.toString();
        
        const responseData = doc.toObject();
        if (!isOwner) {
            // Hide responses for non-owners
            responseData.responses = [];
            // Hide other vendor details
            responseData.targetVendors = [];
        }

        return res.json({ success: true, data: responseData });
    } catch (err) {
        next(err);
    }
}

/**
 * GET RESPONSES FOR ENQUIRY - With filtering and sorting
 */
async function getEnquiryResponses(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const enquiryId = req.params.id;

        const { sort, sortDir = 'asc' } = req.query;

        const enquiry = await Enquiry.findOne({
            _id: enquiryId,
            ownerId, // Only owner can view responses
            isDeleted: false,
        });

        if (!enquiry) {
            return res.status(404).json({ 
                success: false, 
                error: { message: "Enquiry not found or not authorized" } 
            });
        }

        let responses = enquiry.responses || [];

        // Sort responses
        if (sort === 'price') {
            responses = responses.sort((a, b) => 
                sortDir === 'asc' ? a.price - b.price : b.price - a.price
            );
        } else if (sort === 'quantity') {
            responses = responses.sort((a, b) => 
                sortDir === 'asc' ? a.quantity - b.quantity : b.quantity - a.quantity
            );
        } else if (sort === 'date') {
            responses = responses.sort((a, b) => 
                sortDir === 'asc' 
                    ? new Date(a.respondedAt) - new Date(b.respondedAt)
                    : new Date(b.respondedAt) - new Date(a.respondedAt)
            );
        }

        return res.json({
            success: true,
            data: {
                enquiry: {
                    _id: enquiry._id,
                    productName: enquiry.productName,
                    enquiryType: enquiry.enquiryType,
                    quantity: enquiry.quantity,
                    unit: enquiry.unit,
                    expectedPrice: enquiry.expectedPrice,
                    status: enquiry.status,
                    responseCount: enquiry.responseCount,
                    lowestPrice: enquiry.lowestPrice,
                    highestPrice: enquiry.highestPrice,
                    avgPrice: enquiry.avgPrice,
                },
                responses,
            },
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET REGISTERED VENDORS - List vendors from user's vendor list who are registered on platform
 */
async function getRegisteredVendors(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                message: "Valid accountCompanyName (companyId) is required",
            });
        }

        const { search } = req.query;

        const q = {
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false,
            chatUserId: { $ne: null, $exists: true }, // Only vendors with chatUserId (registered on platform)
        };

        if (search?.trim()) {
            const s = search.trim();
            q.$or = [
                { vendorName: { $regex: s, $options: "i" } },
                { companyName: { $regex: s, $options: "i" } },
            ];
        }

        const vendors = await Vendor.find(q)
            .select('_id vendorName companyName mobileNumber emailAddress billingState chatUserId')
            .sort({ vendorName: 1 })
            .lean();

        return res.json({
            success: true,
            data: vendors,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * CREATE ENQUIRY
 */
async function create(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.body.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                message: "Valid accountCompanyName (companyId) is required",
            });
        }

        if (!req.body.productName?.trim()) {
            const msg = "productName is required";
            return res.status(400).json({ success: false, error: { message: msg } });
        }

        if (!req.body.enquiryType || !['buy', 'sell'].includes(req.body.enquiryType)) {
            const msg = "enquiryType must be 'buy' or 'sell'";
            return res.status(400).json({ success: false, error: { message: msg } });
        }

        if (!req.body.distributionType || !['public', 'vendors'].includes(req.body.distributionType)) {
            const msg = "distributionType must be 'public' or 'vendors'";
            return res.status(400).json({ success: false, error: { message: msg } });
        }

        // If vendor distribution, validate target vendors
        let targetVendors = [];
        if (req.body.distributionType === 'vendors') {
            if (!req.body.targetVendorIds || !Array.isArray(req.body.targetVendorIds) || req.body.targetVendorIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: { message: "At least one vendor must be selected for vendor distribution" }
                });
            }

            // Fetch vendor details
            const vendorIds = req.body.targetVendorIds.map(id => toObjectId(id)).filter(Boolean);
            const vendors = await Vendor.find({
                _id: { $in: vendorIds },
                ownerId,
                accountCompanyName: companyId,
                isDeleted: false,
                chatUserId: { $ne: null }
            }).lean();

            if (vendors.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: { message: "No valid registered vendors found in selection" }
                });
            }

            targetVendors = vendors.map(v => ({
                vendorId: v._id,
                chatUserId: v.chatUserId,
                vendorName: v.vendorName,
                companyName: v.companyName,
                mobile: v.mobileNumber,
                email: v.emailAddress,
                notified: false,
            }));
        }

        const payload = {
            ownerId,
            accountCompanyName: companyId,
            enquiryType: req.body.enquiryType,
            distributionType: req.body.distributionType,
            targetStates: Array.isArray(req.body.targetStates) ? req.body.targetStates.filter(s => s?.trim()) : [],
            targetVendors,
            productName: req.body.productName.trim(),
            category: req.body.category?.trim() || "",
            subCategory: req.body.subCategory?.trim() || "",
            quantity: req.body.quantity || 0,
            unit: req.body.unit?.trim() || "",
            expectedPrice: req.body.expectedPrice || 0,
            description: req.body.description?.trim() || "",
            specifications: req.body.specifications?.trim() || "",
            deliveryLocation: req.body.deliveryLocation?.trim() || "",
            requiredByDate: req.body.requiredByDate || null,
            creatorName: req.body.creatorName?.trim() || "",
            creatorCompany: req.body.creatorCompany?.trim() || "",
            creatorState: req.body.creatorState?.trim() || "",
            creatorMobile: req.body.creatorMobile?.trim() || "",
            creatorEmail: req.body.creatorEmail?.trim() || "",
            validUntil: req.body.validUntil || null,
            createdBy: req.user.id,
            status: 'open',
            responses: [],
            responseCount: 0,
        };

        const doc = await Enquiry.create(payload);

        return res.status(201).json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

/**
 * DELETE ENQUIRY (SOFT DELETE)
 */
async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                message: "Valid accountCompanyName (companyId) is required",
            });
        }

        const doc = await Enquiry.findOneAndUpdate(
            {
                _id: req.params.id,
                ownerId,
                accountCompanyName: companyId,
            },
            { isDeleted: true, updatedBy: req.user.id },
            { new: true }
        );

        if (!doc) {
            return res
                .status(404)
                .json({ success: false, error: { message: "Not found" } });
        }

        // Also update related EnquiryResponse records
        await EnquiryResponse.updateMany(
            { enquiryId: doc._id },
            { 'enquiryDetails.enquiryStatus': 'closed' }
        );

        return res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

/**
 * RESPOND TO ENQUIRY - Add response to an enquiry
 */
async function respond(req, res, next) {
    try {
        const responderId = req.user.ownerId;
        const enquiryId = req.params.id;
        const responderCompanyId = toObjectId(req.body.accountCompanyName);

        const enquiry = await Enquiry.findOne({
            _id: enquiryId,
            status: 'open',
            isDeleted: false,
        });

        if (!enquiry) {
            return res
                .status(404)
                .json({ success: false, error: { message: "Enquiry not found or closed" } });
        }

        // Users cannot respond to their own enquiries
        if (enquiry.ownerId.toString() === responderId.toString()) {
            return res
                .status(400)
                .json({ success: false, error: { message: "Cannot respond to your own enquiry" } });
        }

        // For vendor-targeted enquiries, check if user is a target
        if (enquiry.distributionType === 'vendors') {
            const userChatId = req.user.chatUserId || req.user.id?.toString();
            const isTargetVendor = enquiry.targetVendors.some(
                v => v.chatUserId === userChatId
            );
            if (!isTargetVendor) {
                return res.status(403).json({
                    success: false,
                    error: { message: "This enquiry was not sent to you" }
                });
            }
        }

        // Check if user has already responded
        const alreadyResponded = enquiry.responses.some(
            r => r.responderId.toString() === responderId.toString()
        );

        if (alreadyResponded) {
            return res
                .status(409)
                .json({ success: false, error: { message: "You have already responded to this enquiry" } });
        }

        const response = {
            responderId,
            responderName: req.body.responderName || "",
            responderCompany: req.body.responderCompany || "",
            responderState: req.body.responderState || "",
            responderMobile: req.body.responderMobile || "",
            responderEmail: req.body.responderEmail || "",
            price: req.body.price || 0,
            quantity: req.body.quantity || 0,
            unit: req.body.unit || enquiry.unit || "",
            message: req.body.message || "",
            deliveryTime: req.body.deliveryTime || "",
            paymentTerms: req.body.paymentTerms || "",
            validityDays: req.body.validityDays || 0,
            additionalNotes: req.body.additionalNotes || "",
            respondedAt: new Date(),
        };

        // Add response to enquiry
        enquiry.responses.push(response);
        enquiry.updateResponseStats();
        await enquiry.save();

        // Also create EnquiryResponse record for "My Responses" tracking
        await EnquiryResponse.create({
            responderId,
            responderCompanyId,
            enquiryId,
            enquiryDetails: {
                enquiryType: enquiry.enquiryType,
                productName: enquiry.productName,
                category: enquiry.category,
                quantity: enquiry.quantity,
                unit: enquiry.unit,
                expectedPrice: enquiry.expectedPrice,
                description: enquiry.description,
                creatorName: enquiry.creatorName,
                creatorCompany: enquiry.creatorCompany,
                creatorState: enquiry.creatorState,
                creatorMobile: enquiry.creatorMobile,
                creatorEmail: enquiry.creatorEmail,
                enquiryCreatedAt: enquiry.createdAt,
                enquiryStatus: enquiry.status,
            },
            responderName: response.responderName,
            responderCompany: response.responderCompany,
            responderState: response.responderState,
            responderMobile: response.responderMobile,
            responderEmail: response.responderEmail,
            price: response.price,
            quantity: response.quantity,
            unit: response.unit,
            message: response.message,
            deliveryTime: response.deliveryTime,
            paymentTerms: response.paymentTerms,
            validityDays: response.validityDays,
            additionalNotes: response.additionalNotes,
            status: 'pending',
            respondedAt: response.respondedAt,
        });

        return res.json({ success: true, data: enquiry });
    } catch (err) {
        next(err);
    }
}

/**
 * CLOSE ENQUIRY - Mark enquiry as closed
 */
async function closeEnquiry(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const enquiryId = req.params.id;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                message: "Valid accountCompanyName (companyId) is required",
            });
        }

        const closureReason = req.body.closureReason || "";

        // Only owner can close their enquiry
        const doc = await Enquiry.findOneAndUpdate(
            {
                _id: enquiryId,
                ownerId,
                accountCompanyName: companyId,
                isDeleted: false,
            },
            { 
                status: 'closed', 
                closureReason,
                closedAt: new Date(),
                updatedBy: req.user.id 
            },
            { new: true }
        );

        if (!doc) {
            return res
                .status(404)
                .json({ success: false, error: { message: "Not found or not authorized" } });
        }

        // Update related EnquiryResponse records
        await EnquiryResponse.updateMany(
            { enquiryId: doc._id },
            { 'enquiryDetails.enquiryStatus': 'closed' }
        );

        return res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

/**
 * MARK RESPONSE AS VIEWED
 */
async function markResponseViewed(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const enquiryId = req.params.id;
        const responseId = req.params.responseId;

        const enquiry = await Enquiry.findOne({
            _id: enquiryId,
            ownerId, // Only owner can mark as viewed
            isDeleted: false,
        });

        if (!enquiry) {
            return res.status(404).json({
                success: false,
                error: { message: "Enquiry not found or not authorized" }
            });
        }

        // Find and update the response
        const response = enquiry.responses.id(responseId);
        if (!response) {
            return res.status(404).json({
                success: false,
                error: { message: "Response not found" }
            });
        }

        response.isViewed = true;
        response.viewedAt = new Date();
        await enquiry.save();

        // Also update EnquiryResponse record
        await EnquiryResponse.findOneAndUpdate(
            { enquiryId, responderId: response.responderId },
            { viewedByOwner: true, viewedAt: new Date(), status: 'viewed' }
        );

        return res.json({ success: true, data: enquiry });
    } catch (err) {
        next(err);
    }
}

/**
 * SELECT RESPONSE - Accept one response and reject all others
 * If enquiry is still open, it will be auto-closed
 */
async function selectResponse(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const enquiryId = req.params.id;
        const responseId = req.params.responseId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                message: "Valid accountCompanyName (companyId) is required",
            });
        }

        const selectionNote = req.body.selectionNote || "";

        // Find the enquiry (owner only)
        const enquiry = await Enquiry.findOne({
            _id: enquiryId,
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false,
        });

        if (!enquiry) {
            return res.status(404).json({
                success: false,
                error: { message: "Enquiry not found or not authorized" }
            });
        }

        // Check if already has a selected response
        if (enquiry.selectedResponseId) {
            return res.status(400).json({
                success: false,
                error: { message: "A response has already been selected for this enquiry" }
            });
        }

        // Find the response to accept
        const selectedResponse = enquiry.responses.id(responseId);
        if (!selectedResponse) {
            return res.status(404).json({
                success: false,
                error: { message: "Response not found" }
            });
        }

        const now = new Date();

        // Update all responses in the enquiry
        for (const response of enquiry.responses) {
            if (response._id.toString() === responseId) {
                // Accept this response
                response.selectionStatus = 'accepted';
                response.selectionStatusUpdatedAt = now;
                response.selectionNote = selectionNote;
            } else {
                // Reject other responses
                response.selectionStatus = 'rejected';
                response.selectionStatusUpdatedAt = now;
            }
        }

        // Set selected response info on enquiry
        enquiry.selectedResponseId = selectedResponse._id;
        enquiry.selectedResponderId = selectedResponse.responderId;
        enquiry.selectedAt = now;

        // Auto-close enquiry if still open
        if (enquiry.status === 'open') {
            enquiry.status = 'closed';
            enquiry.closureReason = 'Response selected';
            enquiry.closedAt = now;
        }

        enquiry.updatedBy = req.user.id;
        await enquiry.save();

        // Update all EnquiryResponse records for this enquiry
        // Accept the selected one
        await EnquiryResponse.findOneAndUpdate(
            { enquiryId, responderId: selectedResponse.responderId },
            { 
                selectionStatus: 'accepted', 
                selectionStatusUpdatedAt: now,
                selectionNote,
                'enquiryDetails.enquiryStatus': 'closed'
            }
        );

        // Reject all other responses
        await EnquiryResponse.updateMany(
            { 
                enquiryId, 
                responderId: { $ne: selectedResponse.responderId }
            },
            { 
                selectionStatus: 'rejected', 
                selectionStatusUpdatedAt: now,
                'enquiryDetails.enquiryStatus': 'closed'
            }
        );

        return res.json({ 
            success: true, 
            data: enquiry,
            message: "Response accepted successfully. Other responses have been rejected."
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { 
    listMyEnquiries, 
    listPublicEnquiries, 
    listVendorEnquiries,
    listMyResponses,
    getOne, 
    getEnquiryResponses,
    getRegisteredVendors,
    create, 
    remove, 
    respond, 
    closeEnquiry,
    markResponseViewed,
    selectResponse,
};
