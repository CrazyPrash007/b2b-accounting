// src/controllers/vendor.controller.js
const Vendor = require('../models/Vendor');
const Customer = require('../models/Customer');
const Purchase = require('../models/Purchase');
const Payment = require('../models/Payment');
const UnregisteredContact = require('../models/UnregisteredContact');
const mongoose = require("mongoose");
const { lookupChatUserByPhone } = require("../utils/chatUserLookup");
const { handleChatInvitation } = require("../utils/chatInvitation");
const { searchRegisteredUsers, checkMobileRegistered, normalizePhone } = require("../utils/registeredUserSearch");

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

/* ============================= GLOBAL SEARCH (Registered Users Only) ============================= */
async function globalSearch(req, res, next) {
    try {
        const { q, limit = 20 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.json({ success: true, data: [] });
        }

        const searchTerm = q.trim();

        // Search registered users (User + Company from chat-starter DB)
        // Same pool as customer search — registered users can be added as either customer or vendor
        const registeredUsers = await searchRegisteredUsers(searchTerm, Number(limit));

        return res.json({ success: true, data: registeredUsers });

    } catch (err) {
        next(err);
    }
}

/* ============================= BATCH CREATE ============================= */
async function batchCreate(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const { vendors, accountCompanyName: companyIdStr } = req.body;

        const accountCompanyName = toObjectId(companyIdStr);
        if (!accountCompanyName) {
            return res.status(400).json({
                success: false,
                error: { message: "Valid accountCompanyName is required" }
            });
        }

        if (!Array.isArray(vendors) || vendors.length === 0) {
            return res.status(400).json({
                success: false,
                error: { message: "vendors array is required and must not be empty" }
            });
        }

        const results = [];
        const errors = [];

        for (let i = 0; i < vendors.length; i++) {
            const vendorData = vendors[i];

            try {
                if (!vendorData.vendorName?.trim()) {
                    errors.push({ index: i, error: "vendorName is required" });
                    continue;
                }

                const payload = {
                    ...vendorData,
                    ownerId,
                    accountCompanyName,
                    createdBy: req.user.id,
                };

                payload.vendorName = payload.vendorName.trim();
                payload.companyName = payload.companyName ? payload.companyName.trim() : "";
                payload.vendorNameNorm = normalize(payload.vendorName);
                payload.companyNameNorm = normalize(payload.companyName);

                const gstType = (payload.gstType || "Unregistered").trim();
                const gstNumber = gstType === "Unregistered"
                    ? ""
                    : String(payload.gstNumber || "").trim().toUpperCase();

                if (gstType !== "Unregistered" && !gstNumber) {
                    errors.push({ index: i, vendorName: payload.vendorName, error: "GST number is required for Regular or Composition GST type" });
                    continue;
                }

                payload.gstType = gstType;
                payload.gstNumber = gstNumber;
                payload.openingBalanceAmount = Number(payload.openingBalanceAmount || 0);

                // Mobile registered user check (skip if registeredUserId provided)
                if (payload.mobileNumber && !payload.registeredUserId) {
                    try {
                        const registeredMatches = await checkMobileRegistered(payload.mobileNumber);
                        if (registeredMatches.length > 0) {
                            errors.push({
                                index: i,
                                vendorName: payload.vendorName,
                                error: "Mobile number belongs to a registered user",
                                code: 'REGISTERED_USER_EXISTS',
                                registeredUsers: registeredMatches,
                            });
                            continue;
                        }
                    } catch (err) {
                        console.warn('[Vendor BatchCreate] Registered user check failed:', err.message);
                    }
                }

                if (payload.registeredUserId) {
                    payload.isFromRegistered = true;
                }

                // Check for duplicates
                const exists = await Vendor.findOne({
                    ownerId,
                    accountCompanyName,
                    vendorNameNorm: payload.vendorNameNorm,
                    companyNameNorm: payload.companyNameNorm,
                    isDeleted: false,
                }).lean();

                if (exists) {
                    errors.push({ index: i, vendorName: payload.vendorName, error: "Vendor already exists" });
                    continue;
                }

                // Handle chat invitation
                if (payload.mobileNumber) {
                    try {
                        const chatResult = await handleChatInvitation({
                            phoneNumber: payload.mobileNumber,
                            name: payload.vendorName,
                            companyName: payload.companyName || '',
                            ownerId: String(ownerId),
                            ownerName: req.user.name || 'A business contact',
                            type: 'vendor'
                        });

                        if (chatResult.chatUserId) {
                            payload.chatUserId = chatResult.chatUserId;
                            payload.chatConversationId = chatResult.conversationId;
                        }
                    } catch (err) {
                        console.warn('[Vendor BatchCreate] Chat invitation failed:', err.message);
                    }
                }

                const doc = await Vendor.create(payload);
                results.push({ index: i, success: true, data: doc });

                // Track unregistered contact
                if (payload.mobileNumber && !payload.isFromRegistered) {
                    try {
                        const normalized = normalizePhone(payload.mobileNumber);
                        if (normalized && normalized.length === 10) {
                            await UnregisteredContact.findOneAndUpdate(
                                { mobileNorm: normalized, isDeleted: false },
                                {
                                    $setOnInsert: {
                                        name: payload.vendorName || '',
                                        mobileRaw: payload.mobileNumber,
                                        email: payload.emailAddress || '',
                                        companyName: payload.companyName || '',
                                        source: 'vendor',
                                        firstReportedBy: ownerId,
                                        firstReportedAt: new Date(),
                                    },
                                    $inc: { reportCount: 1 },
                                },
                                { upsert: true, new: true }
                            );
                        }
                    } catch (err) {
                        console.warn('[Vendor BatchCreate] UnregisteredContact upsert failed:', err.message);
                    }
                }

            } catch (err) {
                if (err.code === 11000) {
                    errors.push({ index: i, vendorName: vendorData.vendorName, error: "Vendor already exists" });
                } else {
                    errors.push({ index: i, vendorName: vendorData.vendorName, error: err.message });
                }
            }
        }

        return res.status(results.length > 0 ? 201 : 400).json({
            success: results.length > 0,
            data: results,
            errors: errors,
            summary: {
                total: vendors.length,
                created: results.length,
                failed: errors.length
            }
        });

    } catch (err) {
        next(err);
    }
}

/**
 * Calculate payable amount for a vendor
 * Payable = Opening Balance + Sum of Due Amounts from Purchases
 * Note: Purchase.dueAmount already accounts for payments, so we don't subtract payments separately
 */
async function calculatePayableAmount(vendorId, vendorName, openingBalanceType, openingBalanceAmount, ownerId, companyId) {
    // Opening balance: Credit means they owe us (negative), Debit means we owe them (positive)
    let balance = 0;
    if (openingBalanceType === "Debit") {
        balance = Number(openingBalanceAmount) || 0;
    } else if (openingBalanceType === "Credit") {
        balance = -(Number(openingBalanceAmount) || 0);
    }

    // Add due amounts from purchases (totalAmount - paidAmount)
    const purchases = await Purchase.find({
        ownerId,
        accountCompanyName: companyId,
        supplier: vendorName,
        isDeleted: false
    }).lean();

    for (const purchase of purchases) {
        // Use dueAmount if available, otherwise calculate as totalAmount - paidAmount
        const dueAmount = purchase.dueAmount ?? ((purchase.totalAmount || 0) - (purchase.paidAmount || 0));
        balance += dueAmount;
    }

    return balance;
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

        // Calculate payable amount for each vendor
        let totalPayable = 0;
        const itemsWithPayable = await Promise.all(items.map(async (vendor) => {
            const payableAmount = await calculatePayableAmount(
                vendor._id,
                vendor.vendorName,
                vendor.openingBalanceType,
                vendor.openingBalanceAmount,
                ownerId,
                accountCompanyName
            );
            totalPayable += payableAmount;
            return { ...vendor, payableAmount };
        }));

        res.json({
            success: true,
            data: itemsWithPayable,
            meta: { page: Number(page), limit: Number(limit), total, totalPayable }
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

        // Debug: log incoming GST fields
        console.log('[Vendor Create] Incoming gstType:', req.body.gstType, 'gstNumber:', req.body.gstNumber);

        const gstType = (payload.gstType || "Unregistered").trim();
        const gstNumber = gstType === "Unregistered"
            ? ""
            : String(payload.gstNumber || "").trim().toUpperCase();

        console.log('[Vendor Create] Processed gstType:', gstType, 'gstNumber:', gstNumber);

        if (gstType !== "Unregistered" && !gstNumber) {
            console.log('[Vendor Create] Rejecting: GST number missing for', gstType);
            return res.status(400).json({
                success: false,
                error: { message: "GST number is required for Regular or Composition GST type" }
            });
        }

        payload.gstType = gstType;
        payload.gstNumber = gstNumber;

        // ---- Mobile number registered user check ----
        if (payload.mobileNumber && !payload.registeredUserId) {
            try {
                const registeredMatches = await checkMobileRegistered(payload.mobileNumber);
                if (registeredMatches.length > 0) {
                    return res.status(409).json({
                        success: false,
                        code: 'REGISTERED_USER_EXISTS',
                        error: { message: "This mobile number belongs to a registered user. Please select from the list." },
                        registeredUsers: registeredMatches,
                    });
                }
            } catch (err) {
                console.warn('[Vendor Create] Registered user check failed:', err.message);
            }
        }

        if (payload.registeredUserId) {
            payload.isFromRegistered = true;
        }

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

        // Handle chat invitation/message
        if (payload.mobileNumber) {
            try {
                const chatResult = await handleChatInvitation({
                    phoneNumber: payload.mobileNumber,
                    name: payload.vendorName,
                    companyName: payload.companyName || '',
                    ownerId: String(ownerId),
                    ownerName: req.user.name || 'A business contact',
                    type: 'vendor'
                });

                if (chatResult.chatUserId) {
                    payload.chatUserId = chatResult.chatUserId;
                    payload.chatConversationId = chatResult.conversationId;
                    console.log(`[Vendor Create] Chat action: ${chatResult.action}, User ID: ${chatResult.chatUserId}`);
                } else {
                    console.log(`[Vendor Create] Chat action: ${chatResult.action} (invitee created or pending)`);
                }
            } catch (err) {
                console.warn('[Vendor Create] Chat invitation failed:', err.message);
                // Continue without chat - not a blocking error
            }
        }

        const doc = await Vendor.create(payload);

        // Track unregistered contacts (for admin outreach)
        if (payload.mobileNumber && !payload.isFromRegistered) {
            try {
                const normalized = normalizePhone(payload.mobileNumber);
                if (normalized && normalized.length === 10) {
                    await UnregisteredContact.findOneAndUpdate(
                        { mobileNorm: normalized, isDeleted: false },
                        {
                            $setOnInsert: {
                                name: payload.vendorName || '',
                                mobileRaw: payload.mobileNumber,
                                email: payload.emailAddress || '',
                                companyName: payload.companyName || '',
                                source: 'vendor',
                                firstReportedBy: ownerId,
                                firstReportedAt: new Date(),
                            },
                            $inc: { reportCount: 1 },
                        },
                        { upsert: true, new: true }
                    );
                }
            } catch (err) {
                console.warn('[Vendor Create] UnregisteredContact upsert failed:', err.message);
            }
        }

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

        const gstTypeProvided = payload.gstType !== undefined;
        const gstType = gstTypeProvided ? (payload.gstType || "Unregistered").trim() : undefined;
        const gstNumberProvided = payload.gstNumber !== undefined;

        if (gstTypeProvided) {
            payload.gstType = gstType;
            payload.gstNumber = gstType === "Unregistered"
                ? ""
                : String(payload.gstNumber || "").trim().toUpperCase();

            if (gstType !== "Unregistered" && !payload.gstNumber) {
                return res.status(400).json({
                    success: false,
                    error: { message: "GST number is required for Regular or Composition GST type" }
                });
            }
        } else if (gstNumberProvided) {
            payload.gstNumber = String(payload.gstNumber || "").trim().toUpperCase();
        }

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

/**
 * REFRESH CHAT LINK
 * Re-check if this vendor's phone number is now registered in the chat system
 * Useful when a vendor registers on the platform after being added
 */
async function refreshChatLink(req, res, next) {
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
            isDeleted: false,
        });

        if (!doc) {
            return res.status(404).json({ success: false, error: { message: "Not found" } });
        }

        if (!doc.mobileNumber) {
            return res.status(400).json({
                success: false,
                error: { message: "Vendor has no phone number to link" }
            });
        }

        // Try to find the user in chat system
        const chatUser = await lookupChatUserByPhone(doc.mobileNumber);

        if (chatUser) {
            // Update the vendor with the new chat user ID
            doc.chatUserId = chatUser.userId;
            doc.chatConversationId = null; // Clear stale conversation ID, will be created fresh
            await doc.save();

            console.log(`[Vendor RefreshChatLink] Linked ${doc.vendorName} to chat user: ${chatUser.userId}`);

            return res.json({
                success: true,
                data: doc,
                chatLinked: true,
                chatUser: {
                    id: chatUser.userId,
                    name: chatUser.name,
                    email: chatUser.email
                }
            });
        } else {
            // Clear any stale chat link
            if (doc.chatUserId) {
                doc.chatUserId = null;
                doc.chatConversationId = null;
                await doc.save();
            }

            return res.json({
                success: true,
                data: doc,
                chatLinked: false,
                message: "User is not registered on the chat platform yet"
            });
        }
    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove, refreshChatLink, globalSearch, batchCreate };
