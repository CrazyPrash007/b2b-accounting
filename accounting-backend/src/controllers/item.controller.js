// src/controllers/item.controller.js
const Item = require("../models/Item");
const Sale = require("../models/Sale");
const Purchase = require("../models/Purchase");
const mongoose = require("mongoose");

/* --------------------------- Helper --------------------------- */
function toObjectId(id) {
    if (!id) return null;
    try {
        return new mongoose.Types.ObjectId(id);
    } catch (e) {
        return null;
    }
}

/**
 * Calculate current stock for an item
 * Stock = Opening Stock + Total Purchases - Total Sales
 * Centralized, reusable logic for consistent stock calculation
 */
async function calculateStock(itemId, itemName, openingStock, ownerId, companyId) {
    let stock = Number(openingStock) || 0;
    const itemIdStr = itemId ? itemId.toString() : null;
    const normalizedItemName = itemName ? itemName.toLowerCase().trim() : '';

    // Add purchases - match by itemId OR item name
    const purchases = await Purchase.find({
        ownerId,
        accountCompanyName: companyId,
        isDeleted: false
    }).lean();

    for (const purchase of purchases) {
        for (const item of purchase.items) {
            const matchById = item.itemId && itemIdStr && item.itemId.toString() === itemIdStr;
            const matchByName = normalizedItemName && item.name && 
                item.name.toLowerCase().trim() === normalizedItemName;
            
            if (matchById || matchByName) {
                stock += Number(item.qty) || 0;
            }
        }
    }

    // Subtract sales - match by itemId OR item name
    const sales = await Sale.find({
        ownerId,
        accountCompanyName: companyId,
        isDeleted: false
    }).lean();

    for (const sale of sales) {
        for (const item of sale.items) {
            const matchById = item.itemId && itemIdStr && item.itemId.toString() === itemIdStr;
            const matchByName = normalizedItemName && item.name && 
                item.name.toLowerCase().trim() === normalizedItemName;
            
            if (matchById || matchByName) {
                stock -= Number(item.qty) || 0;
            }
        }
    }

    return stock;
}

/* ============================= GLOBAL SEARCH (All Users) ============================= */
async function globalSearch(req, res, next) {
    try {
        const { q, limit = 20 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.json({ success: true, data: [] });
        }

        const searchTerm = q.trim();

        // Search across all items from all users (for suggestion/autocomplete)
        const items = await Item.aggregate([
            {
                $match: {
                    isDeleted: false,
                    $or: [
                        { name: { $regex: searchTerm, $options: "i" } },
                        { itemName: { $regex: searchTerm, $options: "i" } },
                        { description: { $regex: searchTerm, $options: "i" } }
                    ]
                }
            },
            {
                // Group by item name to get unique items with their details
                $group: {
                    _id: { $toLower: "$name" },
                    itemName: { $first: "$name" },
                    description: { $first: "$description" },
                    itemType: { $first: { $ifNull: ["$itemType", "$type"] } },
                    unit: { $first: "$unit" },
                    brandName: { $first: "$brandName" },
                    gstRate: { $first: "$gstRate" },
                    category: { $first: "$category" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }, // Most common items first
            { $limit: Number(limit) },
            {
                $project: {
                    _id: 0,
                    itemName: 1,
                    description: 1,
                    itemType: 1,
                    unit: 1,
                    brandName: 1,
                    gstRate: 1,
                    category: 1,
                    popularity: "$count"
                }
            }
        ]);

        return res.json({ success: true, data: items });

    } catch (err) {
        next(err);
    }
}

/* ============================= LIST ============================= */
async function list(req, res, next) {
    try {
        // Check if requesting another user's items (for viewing profiles)
        const requestedUserId = req.headers['x-user-id'] || req.headers['user-id'];
        const ownerId = requestedUserId || req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                success: false,
                error: { message: "Valid accountCompanyName (companyId) is required" }
            });
        }

        const { page = 1, limit = 50, search, sort, category, brand } = req.query;

        const q = {
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        };

        // Search: item name + alias name + hsn
        if (search) {
            const s = search.trim();
            q.$or = [
                { name: { $regex: s, $options: "i" } },
                { itemName: { $regex: s, $options: "i" } },
                { hsnNo: { $regex: s, $options: "i" } }
            ];
        }

        // optional category, brand filters
        if (category) q.category = category;
        if (brand) q.brandName = brand;

        // Sorting
        const sortObj = {};
        if (sort) {
            const [key, dir] = sort.split(":");
            sortObj[key || "createdAt"] = dir === "desc" ? -1 : 1;
        } else {
            sortObj.createdAt = -1;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [items, total] = await Promise.all([
            Item.find(q).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
            Item.countDocuments(q)
        ]);

        // Calculate stock for each item
        let totalStock = 0;
        let negativeStockCount = 0;
        const itemsWithStock = await Promise.all(items.map(async (item) => {
            const currentStock = await calculateStock(
                item._id,
                item.name,
                item.openingStock,
                ownerId,
                companyId
            );
            totalStock += currentStock;
            if (currentStock < 0) negativeStockCount++;
            return { ...item, currentStock };
        }));

        return res.json({
            success: true,
            data: itemsWithStock,
            meta: { 
                page: Number(page), 
                limit: Number(limit), 
                total,
                totalStock,
                negativeStockCount
            }
        });

    } catch (err) {
        next(err);
    }
}

/* ============================= GET ONE ============================= */
async function getOne(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                success: false,
                error: { message: "Valid accountCompanyName (companyId) is required" }
            });
        }

        const doc = await Item.findOne({
            _id: req.params.id,
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        });

        if (!doc) {
            return res.status(404).json({
                success: false,
                error: { message: "Not found" }
            });
        }

        return res.json({ success: true, data: doc });

    } catch (err) {
        next(err);
    }
}

/* ============================= CREATE ============================= */
async function create(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.body.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                success: false,
                error: { message: "Valid accountCompanyName is required" }
            });
        }

        if (!req.body.name && !req.body.itemName) {
            return res.status(400).json({
                success: false,
                error: { message: "Item name (name or itemName) is required" }
            });
        }

        const payload = {
            ...req.body,
            ownerId,
            accountCompanyName: companyId,
            createdBy: req.user.id,
            // canonical name fallback
            name: req.body.name?.trim() || req.body.itemName?.trim()
        };

        // Numeric coercions
        ["gstRate", "buyPrice", "sellPrice", "openingStock", "minStock"].forEach((field) => {
            if (payload[field] != null && payload[field] !== "") {
                payload[field] = Number(payload[field]) || 0;
            }
        });

        // Date coercion
        if (payload.openingDate) {
            payload.openingDate = new Date(payload.openingDate);
        }

        const doc = await Item.create(payload);

        return res.status(201).json({ success: true, data: doc });

    } catch (err) {
        if (err?.code === 11000) {
            return res.status(409).json({
                success: false,
                error: { message: "Item with same name already exists for this company" }
            });
        }
        next(err);
    }
}

/* ============================= UPDATE ============================= */
async function update(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const id = req.params.id;

        const companyId = toObjectId(req.body.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                success: false,
                error: { message: "Valid accountCompanyName is required" }
            });
        }

        const payload = {
            ...req.body,
            updatedBy: req.user.id
        };

        // Canonical name sync
        if (payload.itemName && !payload.name) {
            payload.name = payload.itemName.trim();
        }
        if (payload.name) {
            payload.name = payload.name.trim();
        }

        // Numeric coercions
        ["gstRate", "buyPrice", "sellPrice", "openingStock", "minStock"].forEach((field) => {
            if (payload[field] != null && payload[field] !== "") {
                payload[field] = Number(payload[field]) || 0;
            }
        });

        // Date coercion
        if (payload.openingDate) {
            payload.openingDate = new Date(payload.openingDate);
        }

        const doc = await Item.findOneAndUpdate(
            {
                _id: id,
                ownerId,
                accountCompanyName: companyId
            },
            payload,
            { new: true, runValidators: true }
        );

        if (!doc) {
            return res.status(404).json({
                success: false,
                error: { message: "Not found" }
            });
        }

        return res.json({ success: true, data: doc });

    } catch (err) {
        if (err?.code === 11000) {
            return res.status(409).json({
                success: false,
                error: { message: "Item with same name already exists for this company" }
            });
        }
        next(err);
    }
}

/* ============================= DELETE (SOFT DELETE) ============================= */
async function remove(req, res, next) {
    try {
        const ownerId = req.user.ownerId;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                success: false,
                error: { message: "Valid accountCompanyName is required" }
            });
        }

        const doc = await Item.findOneAndUpdate(
            {
                _id: req.params.id,
                ownerId,
                accountCompanyName: companyId
            },
            { isDeleted: true, updatedBy: req.user.id },
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

/* ============================= GET ITEM MOVEMENT HISTORY ============================= */
async function getItemMovement(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const itemId = req.params.id;

        const companyId = toObjectId(req.query.accountCompanyName);
        if (!companyId) {
            return res.status(400).json({
                success: false,
                error: { message: "Valid accountCompanyName is required" }
            });
        }

        // Get item details
        const item = await Item.findOne({
            _id: itemId,
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        }).lean();

        if (!item) {
            return res.status(404).json({
                success: false,
                error: { message: "Item not found" }
            });
        }

        const itemName = item.name || item.itemName || '';
        const itemIdStr = itemId.toString();

        // Base queries - fetch ALL transactions (no date filter on server)
        // Date filtering is done client-side as view-level operation
        const baseQuery = {
            ownerId,
            accountCompanyName: companyId,
            isDeleted: false
        };

        // Get ALL purchases and sales for this company
        const [allPurchases, allSales] = await Promise.all([
            Purchase.find(baseQuery).sort({ invoiceDate: -1 }).lean(),
            Sale.find(baseQuery).sort({ invoiceDate: -1 }).lean()
        ]);

        // Extract relevant item data from purchases
        // Match by itemId OR by item name (case-insensitive) for better data coverage
        const purchaseHistory = [];
        let totalPurchased = 0;
        for (const purchase of allPurchases) {
            for (const pItem of purchase.items) {
                const matchById = pItem.itemId && pItem.itemId.toString() === itemIdStr;
                const matchByName = itemName && pItem.name && 
                    pItem.name.toLowerCase().trim() === itemName.toLowerCase().trim();
                
                if (matchById || matchByName) {
                    purchaseHistory.push({
                        date: purchase.invoiceDate || purchase.date,
                        type: 'purchase',
                        invoiceNumber: `${purchase.invoicePrefix || ''}${purchase.invoiceNumber || purchase.billNumber || ''}${purchase.invoiceSuffix || ''}`.trim() || '-',
                        supplier: purchase.supplier || purchase.vendorName || '-',
                        quantity: Number(pItem.qty) || 0,
                        rate: Number(pItem.rate) || 0,
                        amount: Number(pItem.finalAmount || pItem.amount) || 0,
                        transactionId: purchase._id
                    });
                    totalPurchased += Number(pItem.qty) || 0;
                }
            }
        }

        // Extract relevant item data from sales
        const salesHistory = [];
        let totalSold = 0;
        for (const sale of allSales) {
            for (const sItem of sale.items) {
                const matchById = sItem.itemId && sItem.itemId.toString() === itemIdStr;
                const matchByName = itemName && sItem.name && 
                    sItem.name.toLowerCase().trim() === itemName.toLowerCase().trim();
                
                if (matchById || matchByName) {
                    salesHistory.push({
                        date: sale.invoiceDate || sale.date,
                        type: 'sale',
                        invoiceNumber: `${sale.invoicePrefix || ''}${sale.invoiceNumber}${sale.invoiceSuffix || ''}`.trim() || '-',
                        customer: sale.customer || sale.customerName || '-',
                        quantity: Number(sItem.qty) || 0,
                        rate: Number(sItem.rate) || 0,
                        amount: Number(sItem.finalAmount || sItem.amount) || 0,
                        transactionId: sale._id
                    });
                    totalSold += Number(sItem.qty) || 0;
                }
            }
        }

        // Combine and sort by date (newest first)
        const movements = [...purchaseHistory, ...salesHistory].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        // Calculate current stock using centralized logic
        const currentStock = await calculateStock(
            itemId,
            item.name,
            item.openingStock,
            ownerId,
            companyId
        );

        return res.json({
            success: true,
            data: {
                item: {
                    id: item._id,
                    name: item.name,
                    openingStock: Number(item.openingStock) || 0,
                    currentStock
                },
                movements,
                summary: {
                    totalPurchased,
                    totalSold,
                    openingStock: Number(item.openingStock) || 0,
                    currentStock
                }
            }
        });

    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove, globalSearch, getItemMovement };
