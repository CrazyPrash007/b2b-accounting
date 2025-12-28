// src/controllers/vendor.controller.js
const Vendor = require('../models/Vendor');
const mongoose = require("mongoose");
const { lookupChatUserByPhone } = require("../utils/chatUserLookup");

/* ---------------------------- Helpers ---------------------------- */

function toObjectId(id) {
    if (!id) return null;
    try {
        return new mongoose.Types.ObjectId(id);
    } catch (err) {
        return null;
    }
}

function normalize(v) {
    if (v === undefined || v === null) return "";
    return String(v).trim().replace(/\s+/g, " ").toLowerCase();
}

/* =========================== LIST =========================== */
async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const accountCompanyName = toObjectId(req.query.accountCompanyName);
        if (!accountCompanyName) {
            return res.status(400).json({
                success: false,
                error: { message: "accountCompanyName is required and must be valid" }
            });
        }

        const { page = 1, limit = 50, search, sort } = req.query;

        const q = {
            ownerId,
            accountCompanyName,
            isDeleted: false
        };

        if (search) {
            const s = search.trim();
            q.$or = [
                { vendorName: { $regex: s, $options: "i" } },
                { name: { $regex: s, $options: "i" } },
                { companyName: { $regex: s, $options: "i" } },
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
            Vendor.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Vendor.countDocuments(q)
        ]);

        res.json({
            success: true,
            data: items,
            meta: { page: Number(page), limit: Number(limit), total }
        });

    } catch (err) {
        next(err);
    }
}

/* =========================== GET ONE =========================== */
async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const accountCompanyName = toObjectId(req.query.accountCompanyName);
        if (!accountCompanyName) {
            return res.status(400).json({
                success: false,
                error: { message: "accountCompanyName is required and must be valid" }
            });
        }

        const doc = await Vendor.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName,
            isDeleted: false
        });

        if (!doc) {
            return res.status(404).json({
                success: false,
                error: { message: "Not found" }
            });
        }

        res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

/* =========================== CREATE =========================== */
async function create(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const accountCompanyName = toObjectId(req.body.accountCompanyName);
        if (!accountCompanyName) {
            return res.status(400).json({
                success: false,
                error: { message: "accountCompanyName is required and must be valid" }
            });
        }

        const payload = {
            ...req.body,
            ownerId,
            accountCompanyName,
            createdBy: req.user.id
        };

        if (!payload.vendorName) {
            return res.status(400).json({
                success: false,
                error: { message: "vendorName is required" }
            });
        }

        payload.vendorName = payload.vendorName.trim();
        payload.companyName = payload.companyName ? payload.companyName.trim() : "";

        payload.vendorNameNorm = normalize(payload.vendorName);
        payload.companyNameNorm = normalize(payload.companyName);

        // Opening balance normalize
        payload.openingBalanceAmount =
            Number(payload.openingBalanceAmount || 0);

        // Conflict check
        const conflict = await Vendor.findOne({
            ownerId,
            accountCompanyName,
            vendorNameNorm: payload.vendorNameNorm,
            companyNameNorm: payload.companyNameNorm,
            isDeleted: false
        }).lean();

        if (conflict) {
            const msg = "vendor already created";
            res.set("X-Error-Message", msg);
            return res.status(409).json({
                success: false,
                error: { message: msg }
            });
        }

        // Lookup chat user by phone number if provided
        if (payload.mobileNumber) {
            try {
                const chatUser = await lookupChatUserByPhone(payload.mobileNumber);
                if (chatUser) {
                    payload.chatUserId = chatUser.userId;
                    console.log(`[Vendor Create] Linked to chat user: ${chatUser.userId} (${chatUser.name})`);
                }
            } catch (err) {
                console.warn('[Vendor Create] Chat user lookup failed:', err.message);
                // Continue without chat user - not a blocking error
            }
        }

        const doc = await Vendor.create(payload);

        res.status(201).json({ success: true, data: doc });

    } catch (err) {
        if (err?.code === 11000) {
            const msg = "vendor already created";
            res.set("X-Error-Message", msg);
            return res.status(409).json({
                success: false,
                error: { message: msg },
                details: err.keyValue
            });
        }
        next(err);
    }
}

/* =========================== UPDATE =========================== */
async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const accountCompanyName = toObjectId(req.body.accountCompanyName);
        if (!accountCompanyName) {
            return res.status(400).json({
                success: false,
                error: { message: "accountCompanyName is required and must be valid" }
            });
        }

        const id = req.params.id;

        const payload = { ...req.body, updatedBy: req.user.id };

        // Normalize numbers
        if (payload.openingBalanceAmount !== undefined) {
            payload.openingBalanceAmount =
                Number(payload.openingBalanceAmount || 0);
        }

        // Trim + normalize fields
        if (payload.vendorName) {
            payload.vendorName = payload.vendorName.trim();
            payload.vendorNameNorm = normalize(payload.vendorName);
        }

        if (payload.companyName) {
            payload.companyName = payload.companyName.trim();
            payload.companyNameNorm = normalize(payload.companyName);
        }

        // Check conflicts only if name fields change
        if (payload.vendorNameNorm !== undefined || payload.companyNameNorm !== undefined) {
            const existing = await Vendor.findOne({
                _id: id,
                ownerId,
                accountCompanyName
            }).lean();

            if (!existing) {
                return res.status(404).json({
                    success: false,
                    error: { message: "Not found" }
                });
            }

            const vendorNorm = payload.vendorNameNorm ?? existing.vendorNameNorm;
            const companyNorm = payload.companyNameNorm ?? existing.companyNameNorm;

            const conflict = await Vendor.findOne({
                ownerId,
                accountCompanyName,
                vendorNameNorm: vendorNorm,
                companyNameNorm: companyNorm,
                isDeleted: false,
                _id: { $ne: id }
            }).lean();

            if (conflict) {
                const msg = "vendor already created";
                res.set("X-Error-Message", msg);
                return res.status(409).json({
                    success: false,
                    error: { message: msg }
                });
            }
        }

        // If mobile number changed, lookup chat user again
        if (payload.mobileNumber !== undefined) {
            try {
                const chatUser = await lookupChatUserByPhone(payload.mobileNumber);
                if (chatUser) {
                    payload.chatUserId = chatUser.userId;
                    console.log(`[Vendor Update] Linked to chat user: ${chatUser.userId} (${chatUser.name})`);
                } else {
                    // Clear chat user if phone changed and no match found
                    payload.chatUserId = null;
                }
            } catch (err) {
                console.warn('[Vendor Update] Chat user lookup failed:', err.message);
            }
        }

        const doc = await Vendor.findOneAndUpdate(
            { _id: id, ownerId, accountCompanyName },
            payload,
            { new: true, runValidators: true }
        );

        if (!doc) {
            return res.status(404).json({
                success: false,
                error: { message: "Not found" }
            });
        }

        res.json({ success: true, data: doc });

    } catch (err) {
        if (err?.code === 11000) {
            const msg = "vendor already created";
            res.set("X-Error-Message", msg);
            return res.status(409).json({
                success: false,
                error: { message: msg },
                details: err.keyValue
            });
        }
        next(err);
    }
}

/* =========================== REMOVE (SOFT DELETE) =========================== */
async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const accountCompanyName = toObjectId(req.query.accountCompanyName);

        if (!accountCompanyName) {
            return res.status(400).json({
                success: false,
                error: { message: "accountCompanyName is required and must be valid" }
            });
        }

        const id = req.params.id;

        const doc = await Vendor.findOneAndUpdate(
            { _id: id, ownerId, accountCompanyName },
            { isDeleted: true },
            { new: true }
        );

        if (!doc) {
            return res.status(404).json({
                success: false,
                error: { message: "Not found" }
            });
        }

        res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove };
