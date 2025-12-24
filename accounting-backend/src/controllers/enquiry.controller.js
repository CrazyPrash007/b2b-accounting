// src/controllers/enquiry.controller.js
const Enquiry = require("../models/Enquiry");
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

        const { page = 1, limit = 50, search, sort, enquiryType, status } = req.query;

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
 * LIST PUBLIC ENQUIRIES - Others' open enquiries (filtered by user's state)
 */
async function listPublicEnquiries(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const userState = req.query.userState || "";

        const { page = 1, limit = 50, search, sort, enquiryType, category, state } = req.query;

        const q = {
            ownerId: { $ne: ownerId }, // Exclude user's own enquiries
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

        // Filter by target states - show enquiries that target user's state or have no target states (all states)
        if (state?.trim()) {
            q.$or = [
                { targetStates: { $size: 0 } }, // No target states means visible to all
                { targetStates: { $exists: false } },
                { targetStates: state.trim() }
            ];
        } else if (userState?.trim()) {
            q.$or = [
                { targetStates: { $size: 0 } },
                { targetStates: { $exists: false } },
                { targetStates: userState.trim() }
            ];
        }

        // Search by product name, category, description
        if (search?.trim()) {
            const s = search.trim();
            // Combine search with existing $or using $and
            const searchOr = [
                { productName: { $regex: s, $options: "i" } },
                { category: { $regex: s, $options: "i" } },
                { description: { $regex: s, $options: "i" } },
                { creatorCompany: { $regex: s, $options: "i" } },
            ];
            
            if (q.$or) {
                q.$and = [
                    { $or: q.$or },
                    { $or: searchOr }
                ];
                delete q.$or;
            } else {
                q.$or = searchOr;
            }
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
        }

        return res.json({ success: true, data: responseData });
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

        const payload = {
            ...req.body,
            ownerId,
            accountCompanyName: companyId,
            createdBy: req.user.id,
            status: 'open',
            responses: [],
        };

        payload.productName = payload.productName.trim();

        const doc = await Enquiry.create(payload);

        return res.status(201).json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

/**
 * UPDATE ENQUIRY
 */
async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;

        const companyId = toObjectId(req.body.accountCompanyName || req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                message: "Valid accountCompanyName (companyId) is required",
            });
        }

        // Only owner can update their enquiry
        const existing = await Enquiry.findOne({
            _id: id,
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false,
        });

        if (!existing) {
            return res
                .status(404)
                .json({ success: false, error: { message: "Not found or not authorized" } });
        }

        const payload = {
            ...req.body,
            updatedBy: req.user.id,
        };

        // Trim product name if provided
        if (payload.productName !== undefined) {
            payload.productName = payload.productName.trim();
        }

        // Don't allow changing responses via update
        delete payload.responses;

        const doc = await Enquiry.findOneAndUpdate(
            {
                _id: id,
                ownerId,
                accountCompanyName: companyId,
            },
            payload,
            { new: true, runValidators: true }
        );

        return res.json({ success: true, data: doc });
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
            message: req.body.message || "",
            respondedAt: new Date(),
        };

        const doc = await Enquiry.findByIdAndUpdate(
            enquiryId,
            { $push: { responses: response } },
            { new: true }
        );

        return res.json({ success: true, data: doc });
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

        // Only owner can close their enquiry
        const doc = await Enquiry.findOneAndUpdate(
            {
                _id: enquiryId,
                ownerId,
                accountCompanyName: companyId,
                isDeleted: false,
            },
            { status: 'closed', updatedBy: req.user.id },
            { new: true }
        );

        if (!doc) {
            return res
                .status(404)
                .json({ success: false, error: { message: "Not found or not authorized" } });
        }

        return res.json({ success: true, data: doc });
    } catch (err) {
        next(err);
    }
}

module.exports = { 
    listMyEnquiries, 
    listPublicEnquiries, 
    getOne, 
    create, 
    update, 
    remove, 
    respond, 
    closeEnquiry 
};
