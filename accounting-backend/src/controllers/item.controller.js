// src/controllers/item.controller.js
const Item = require("../models/Item");
const MasterItem = require("../models/MasterItem");
const Sale = require("../models/Sale");
const Purchase = require("../models/Purchase");
const mongoose = require("mongoose");
const multer = require("multer");

// Configure multer to store files in memory (for converting to Base64)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
    fileFilter: (req, file, cb) => {
        // Only allow image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Export multer middleware for use in routes
const uploadMiddleware = upload.single('itemImage');

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

function normalizeItemName(v) {
    if (!v) return "";
    return String(v).trim().replace(/\s+/g, ' ').toLowerCase();
}

/* ============================= GLOBAL SEARCH (MasterItem Catalog) ============================= */
async function globalSearch(req, res, next) {
    try {
        const { q, limit = 20 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.json({ success: true, data: [] });
        }

        const searchTerm = q.trim();
        const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const limitNum = Number(limit);

        // Try MasterItem catalog first
        const masterItems = await MasterItem.find({
            isDeleted: false,
            $or: [
                { name: regex },
                { description: regex },
                { brandName: regex },
            ]
        })
            .sort({ userCount: -1 })
            .limit(limitNum)
            .select('_id name description brandName itemType category itemImage itemImageMimeType userCount')
            .lean();

        if (masterItems.length > 0) {
            const data = masterItems.map(mi => ({
                masterItemId: mi._id,
                itemName: mi.name,
                description: mi.description || '',
                brandName: mi.brandName || '',
                itemType: mi.itemType || 'Goods',
                category: mi.category || '',
                itemImage: mi.itemImage || '',
                itemImageMimeType: mi.itemImageMimeType || '',
                userCount: mi.userCount || 0,
            }));
            return res.json({ success: true, data });
        }

        // Fallback: aggregate from Item collection (when MasterItem catalog is empty/no matches)
        const items = await Item.aggregate([
            {
                $match: {
                    isDeleted: false,
                    $or: [
                        { name: regex },
                        { itemName: regex },
                        { description: regex },
                        { brandName: regex },
                    ]
                }
            },
            {
                $group: {
                    _id: { $toLower: '$name' },
                    name: { $first: '$name' },
                    description: { $first: '$description' },
                    brandName: { $first: '$brandName' },
                    itemType: { $first: '$itemType' },
                    category: { $first: '$category' },
                    itemImage: { $first: '$itemImage' },
                    itemImageMimeType: { $first: '$itemImageMimeType' },
                    userCount: { $sum: 1 },
                }
            },
            { $sort: { userCount: -1 } },
            { $limit: limitNum },
        ]);

        const data = items.map(it => ({
            masterItemId: null,
            itemName: it.name || '',
            description: it.description || '',
            brandName: it.brandName || '',
            itemType: it.itemType || 'Goods',
            category: it.category || '',
            itemImage: it.itemImage || '',
            itemImageMimeType: it.itemImageMimeType || '',
            userCount: it.userCount || 0,
        }));

        return res.json({ success: true, data });

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

        // ---- MasterItem linkage ----
        if (payload.masterItemId) {
            // User selected from global search — copy locked fields from MasterItem
            const masterItem = await MasterItem.findById(payload.masterItemId).lean();
            if (masterItem && !masterItem.isDeleted) {
                payload.name = masterItem.name;
                payload.itemName = masterItem.name;
                payload.description = masterItem.description || payload.description || '';
                payload.brandName = masterItem.brandName || payload.brandName || '';
                payload.itemImage = masterItem.itemImage || payload.itemImage || '';
                payload.itemImageMimeType = masterItem.itemImageMimeType || payload.itemImageMimeType || '';
                payload.isFromMaster = true;
            }
        } else {
            // New item — check if a MasterItem with same normalized name exists
            const nameNorm = normalizeItemName(payload.name);
            let masterItem = await MasterItem.findOne({ nameNorm, isDeleted: false }).lean();
            if (masterItem) {
                // Auto-link to existing MasterItem
                payload.masterItemId = masterItem._id;
                payload.isFromMaster = false; // created independently, just auto-linked
            } else {
                // Create a new MasterItem
                try {
                    const newMaster = await MasterItem.create({
                        name: payload.name,
                        description: payload.description || '',
                        brandName: payload.brandName || '',
                        itemType: payload.itemType || 'Goods',
                        category: payload.category || '',
                        itemImage: payload.itemImage || '',
                        itemImageMimeType: payload.itemImageMimeType || '',
                        status: 'active',
                        userCount: 0,
                    });
                    payload.masterItemId = newMaster._id;
                } catch (masterErr) {
                    // Race condition: another request created it — try to find it
                    if (masterErr.code === 11000) {
                        masterItem = await MasterItem.findOne({ nameNorm, isDeleted: false }).lean();
                        if (masterItem) payload.masterItemId = masterItem._id;
                    } else {
                        console.warn('[Item Create] MasterItem creation failed:', masterErr.message);
                    }
                }
            }
        }

        const doc = await Item.create(payload);

        // Increment MasterItem userCount
        if (payload.masterItemId) {
            await MasterItem.findByIdAndUpdate(payload.masterItemId, { $inc: { userCount: 1 } }).catch(err =>
                console.warn('[Item Create] MasterItem userCount increment failed:', err.message)
            );
            // Set createdFromItemId if this is the first item
            await MasterItem.findOneAndUpdate(
                { _id: payload.masterItemId, createdFromItemId: null },
                { $set: { createdFromItemId: doc._id } }
            ).catch(() => { });
        }

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

        // Decrement MasterItem userCount on soft-delete
        if (doc.masterItemId) {
            await MasterItem.findByIdAndUpdate(doc.masterItemId, {
                $inc: { userCount: -1 }
            }).catch(err => console.warn('[Item Delete] MasterItem userCount decrement failed:', err.message));
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

/* ============================= UPLOAD ITEM IMAGE ============================= */
async function uploadImage(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { message: "No image file provided" }
            });
        }

        // Convert image buffer to Base64 string
        const base64Image = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;
        const dataUri = `data:${mimeType};base64,${base64Image}`;

        return res.json({
            success: true,
            data: {
                itemImage: dataUri,
                itemImageMimeType: mimeType,
                originalName: req.file.originalname,
                size: req.file.size
            }
        });

    } catch (err) {
        next(err);
    }
}

/* ============================= BATCH CREATE ============================= */
async function batchCreate(req, res, next) {
    try {
        const ownerId = req.user.ownerId;
        const { items, accountCompanyName: companyIdStr } = req.body;

        console.log('📥 Batch items request - ownerId:', ownerId, 'companyIdStr:', companyIdStr, 'itemsCount:', items?.length);

        const companyId = toObjectId(companyIdStr);
        if (!companyId) {
            console.error('❌ Invalid companyId - received:', companyIdStr, 'type:', typeof companyIdStr);
            return res.status(400).json({
                success: false,
                error: { message: `Valid accountCompanyName (companyId) is required. Received: ${companyIdStr}` }
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: { message: "items array is required and must not be empty" }
            });
        }

        const results = [];
        const errors = [];

        for (let i = 0; i < items.length; i++) {
            const itemData = items[i];

            try {
                const itemName = (itemData.name || itemData.itemName || "").trim();
                if (!itemName) {
                    errors.push({ index: i, error: "Item name is required" });
                    continue;
                }

                const payload = {
                    ...itemData,
                    ownerId,
                    accountCompanyName: companyId,
                    createdBy: req.user.id,
                    name: itemName,
                    itemName: itemName,
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

                // ---- MasterItem linkage ----
                if (payload.masterItemId) {
                    const masterItem = await MasterItem.findById(payload.masterItemId).lean();
                    if (masterItem && !masterItem.isDeleted) {
                        payload.name = masterItem.name;
                        payload.itemName = masterItem.name;
                        payload.description = masterItem.description || payload.description || '';
                        payload.brandName = masterItem.brandName || payload.brandName || '';
                        payload.itemImage = masterItem.itemImage || payload.itemImage || '';
                        payload.itemImageMimeType = masterItem.itemImageMimeType || payload.itemImageMimeType || '';
                        payload.isFromMaster = true;
                    }
                } else {
                    const nameNorm = normalizeItemName(payload.name);
                    let masterItem = await MasterItem.findOne({ nameNorm, isDeleted: false }).lean();
                    if (masterItem) {
                        payload.masterItemId = masterItem._id;
                    } else {
                        try {
                            const newMaster = await MasterItem.create({
                                name: payload.name,
                                description: payload.description || '',
                                brandName: payload.brandName || '',
                                itemType: payload.itemType || 'Goods',
                                category: payload.category || '',
                                status: 'active',
                                userCount: 0,
                            });
                            payload.masterItemId = newMaster._id;
                        } catch (masterErr) {
                            if (masterErr.code === 11000) {
                                masterItem = await MasterItem.findOne({ nameNorm, isDeleted: false }).lean();
                                if (masterItem) payload.masterItemId = masterItem._id;
                            }
                        }
                    }
                }

                // Check for duplicates
                const exists = await Item.findOne({
                    ownerId,
                    accountCompanyName: companyId,
                    name: { $regex: `^${itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
                    isDeleted: false,
                }).lean();

                if (exists) {
                    errors.push({ index: i, itemName, error: "Item with same name already exists" });
                    continue;
                }

                const doc = await Item.create(payload);

                // Increment MasterItem userCount
                if (payload.masterItemId) {
                    await MasterItem.findByIdAndUpdate(payload.masterItemId, { $inc: { userCount: 1 } }).catch(() => { });
                    await MasterItem.findOneAndUpdate(
                        { _id: payload.masterItemId, createdFromItemId: null },
                        { $set: { createdFromItemId: doc._id } }
                    ).catch(() => { });
                }

                results.push({ index: i, success: true, data: doc });

            } catch (err) {
                if (err.code === 11000) {
                    errors.push({ index: i, itemName: itemData.name || itemData.itemName, error: "Item already exists" });
                } else {
                    errors.push({ index: i, itemName: itemData.name || itemData.itemName, error: err.message });
                }
            }
        }

        return res.status(results.length > 0 ? 201 : 400).json({
            success: results.length > 0,
            data: results,
            errors: errors,
            summary: {
                total: items.length,
                created: results.length,
                failed: errors.length
            }
        });

    } catch (err) {
        next(err);
    }
}

module.exports = { list, getOne, create, update, remove, globalSearch, getItemMovement, uploadImage, uploadMiddleware, batchCreate };
