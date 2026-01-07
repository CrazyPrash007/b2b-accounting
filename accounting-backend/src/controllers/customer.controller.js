// src/controllers/customer.controller.js
const Customer = require("../models/Customer");
const Sale = require("../models/Sale");
const Receipt = require("../models/Receipt");
const mongoose = require("mongoose");
const { lookupChatUserByPhone } = require("../utils/chatUserLookup");
const { handleChatInvitation } = require("../utils/chatInvitation");

function toObjectId(id) {
    if (!id || !mongoose.isValidObjectId(id)) return null;
    return new mongoose.Types.ObjectId(id);
}

function normalizeString(v) {
    if (!v) return "";
    return String(v).trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Calculate pending amount for a customer
 * Pending = Opening Balance + Sum of Due Amounts from Sales
 * Note: Sale.dueAmount already accounts for payments, so we don't subtract receipts separately
 */
async function calculatePendingAmount(customerId, customerName, openingBalanceType, openingBalanceAmount, ownerId, companyId) {
    // Opening balance: Credit means we owe them (negative), Debit means they owe us (positive)
    let balance = 0;
    if (openingBalanceType === "Debit") {
        balance = Number(openingBalanceAmount) || 0;
    } else if (openingBalanceType === "Credit") {
        balance = -(Number(openingBalanceAmount) || 0);
    }

    // Add due amounts from sales (totalAmount - paidAmount)
    const sales = await Sale.find({
        ownerId,
        accountCompanyName: companyId,
        $or: [
            { customerId: customerId },
            { customer: customerName }
        ],
        isDeleted: false
    }).lean();

    for (const sale of sales) {
        // Use dueAmount if available, otherwise calculate as totalAmount - paidAmount
        const dueAmount = sale.dueAmount ?? ((sale.totalAmount || 0) - (sale.paidAmount || 0));
        balance += dueAmount;
    }

    return balance;
}

/**
 * LIST CUSTOMERS
 */
async function list(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                message: "Valid accountCompanyName (companyId) is required",
            });
        }

        const { page = 1, limit = 50, search, sort } = req.query;

        const q = {
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false,
        };

        // Searching multiple fields
        if (search?.trim()) {
            const s = search.trim();
            q.$or = [
                { customerName: { $regex: s, $options: "i" } },
                { name: { $regex: s, $options: "i" } },
                { companyName: { $regex: s, $options: "i" } },
                { mobileNumber: { $regex: s, $options: "i" } },
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
            Customer.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Customer.countDocuments(q),
        ]);

        // Calculate pending amount for each customer
        let totalPending = 0;
        const itemsWithPending = await Promise.all(items.map(async (customer) => {
            const pendingAmount = await calculatePendingAmount(
                customer._id,
                customer.customerName,
                customer.openingBalanceType,
                customer.openingBalanceAmount,
                ownerId,
                companyId
            );
            totalPending += pendingAmount;
            return { ...customer, pendingAmount };
        }));

        return res.json({
            success: true,
            data: itemsWithPending,
            meta: { page: Number(page), limit: Number(limit), total, totalPending },
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET ONE CUSTOMER
 */
async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                message: "Valid accountCompanyName (companyId) is required",
            });
        }

        const doc = await Customer.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false,
        });

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
 * CREATE CUSTOMER
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

        if (!req.body.customerName?.trim()) {
            const msg = "customerName is required";
            return res.status(400).json({ success: false, error: { message: msg } });
        }

        const payload = {
            ...req.body,
            ownerId,
            accountCompanyName: companyId,
            createdBy: req.user.id,
        };

        payload.customerName = payload.customerName.trim();
        payload.customerNameNorm = normalizeString(payload.customerName);
        payload.companyNameNorm = normalizeString(payload.companyName);

        const gstType = (payload.gstType || "Unregistered").trim();
        const gstNumber = gstType === "Unregistered"
            ? ""
            : String(payload.gstNumber || "").trim().toUpperCase();

        if (gstType !== "Unregistered" && !gstNumber) {
            return res.status(400).json({
                success: false,
                error: { message: "GST number is required for Regular or Composition GST type" },
            });
        }

        payload.gstType = gstType;
        payload.gstNumber = gstNumber;

        // Prevent duplicates (scoped by owner + company)
        const exists = await Customer.findOne({
            ownerId,
            accountCompanyName: companyId,
            customerNameNorm: payload.customerNameNorm,
            companyNameNorm: payload.companyNameNorm,
            isDeleted: false,
        }).lean();

        if (exists) {
            const msg = "customer already created";
            return res
                .status(409)
                .json({ success: false, error: { message: msg } });
        }

        // Handle chat invitation/message
        if (payload.mobileNumber) {
            try {
                const chatResult = await handleChatInvitation({
                    phoneNumber: payload.mobileNumber,
                    name: payload.customerName,
                    companyName: payload.companyName || '',
                    ownerId: String(ownerId),
                    ownerName: req.user.name || 'A business contact',
                    type: 'customer'
                });

                if (chatResult.chatUserId) {
                    payload.chatUserId = chatResult.chatUserId;
                    payload.chatConversationId = chatResult.conversationId;
                    console.log(`[Customer Create] Chat action: ${chatResult.action}, User ID: ${chatResult.chatUserId}`);
                } else {
                    console.log(`[Customer Create] Chat action: ${chatResult.action} (invitee created or pending)`);
                }
            } catch (err) {
                console.warn('[Customer Create] Chat invitation failed:', err.message);
                // Continue without chat - not a blocking error
            }
        }

        const doc = await Customer.create(payload);

        return res.status(201).json({ success: true, data: doc });
    } catch (err) {
        if (err.code === 11000) {
            const msg = "customer already created";
            return res.status(409).json({
                success: false,
                error: { message: msg },
            });
        }
        next(err);
    }
}

/**
 * UPDATE CUSTOMER
 */
async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;

        const companyId = toObjectId(req.body.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                message: "Valid accountCompanyName (companyId) is required",
            });
        }

        const payload = {
            ...req.body,
            updatedBy: req.user.id,
        };

        // GST handling: normalize and do not wipe existing number unless explicitly changing type
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
                    error: { message: "GST number is required for Regular or Composition GST type" },
                });
            }
        } else if (gstNumberProvided) {
            // gstType unchanged, but number provided
            payload.gstNumber = String(payload.gstNumber || "").trim().toUpperCase();
        }

        // Normalize if customerName/companyName was modified
        if (payload.customerName !== undefined) {
            payload.customerName = payload.customerName.trim();
            payload.customerNameNorm = normalizeString(payload.customerName);
        }
        if (payload.companyName !== undefined) {
            payload.companyNameNorm = normalizeString(payload.companyName);
        }

        // Duplicate check only when name fields change
        if (payload.customerNameNorm || payload.companyNameNorm) {
            const conflict = await Customer.findOne({
                ownerId,
                accountCompanyName: companyId,
                customerNameNorm: payload.customerNameNorm,
                companyNameNorm: payload.companyNameNorm,
                isDeleted: false,
                _id: { $ne: id },
            }).lean();

            if (conflict) {
                const msg = "customer already created";
                return res
                    .status(409)
                    .json({ success: false, error: { message: msg } });
            }
        }

        // If mobile number changed, lookup chat user again
        if (payload.mobileNumber !== undefined) {
            try {
                const chatUser = await lookupChatUserByPhone(payload.mobileNumber);
                if (chatUser) {
                    payload.chatUserId = chatUser.userId;
                    console.log(`[Customer Update] Linked to chat user: ${chatUser.userId} (${chatUser.name})`);
                } else {
                    // Clear chat user if phone changed and no match found
                    payload.chatUserId = null;
                }
            } catch (err) {
                console.warn('[Customer Update] Chat user lookup failed:', err.message);
            }
        }

        const doc = await Customer.findOneAndUpdate(
            {
                _id: id,
                ownerId,
                accountCompanyName: companyId,
            },
            payload,
            { new: true, runValidators: true }
        );

        if (!doc) {
            return res
                .status(404)
                .json({ success: false, error: { message: "Not found" } });
        }

        return res.json({ success: true, data: doc });
    } catch (err) {
        if (err.code === 11000) {
            const msg = "customer already created";
            return res.status(409).json({
                success: false,
                error: { message: msg },
            });
        }
        next(err);
    }
}

/**
 * DELETE CUSTOMER (SOFT DELETE)
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

        const doc = await Customer.findOneAndUpdate(
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

module.exports = { list, getOne, create, update, remove };
