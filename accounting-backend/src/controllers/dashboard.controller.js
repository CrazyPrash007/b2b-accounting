// src/controllers/dashboard.controller.js
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Receipt = require('../models/Receipt');
const Payment = require('../models/Payment');
const Item = require('../models/Item');
const Bank = require('../models/Bank');
const PayrollPeriod = require('../models/PayrollPeriod');
const PayrollCalculation = require('../models/PayrollCalculation');
const Staff = require('../models/Staff');

/**
 * Calculate current stock for an item (centralized logic)
 * Stock = Opening Stock + Total Purchases - Total Sales
 */
async function calculateItemStock(itemId, itemName, openingStock, ownerId, companyId) {
    let stock = Number(openingStock) || 0;
    const itemIdStr = itemId ? itemId.toString() : null;
    const normalizedItemName = itemName ? itemName.toLowerCase().trim() : '';

    // Add purchases
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

    // Subtract sales
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

/**
 * GET /api/dashboard/stats
 * Returns aggregated stats for the dashboard
 * Query params: companyId (required), startDate, endDate, period (current-month, last-month, etc)
 */
exports.getDashboardStats = async (req, res, next) => {
    try {
        const { companyId, startDate, endDate, period = 'current-month' } = req.query;
        const ownerId = req.user.id;

        if (!companyId) {
            return res.status(400).json({ error: 'companyId is required' });
        }

        // Convert companyId to ObjectId
        let companyObjectId;
        try {
            companyObjectId = new mongoose.Types.ObjectId(companyId);
        } catch (err) {
            return res.status(400).json({ error: 'Invalid companyId format' });
        }

        // Calculate date range
        const dateRange = getDateRange(period, startDate, endDate);

        // Build base query
        const baseQuery = {
            ownerId: new mongoose.Types.ObjectId(ownerId),
            accountCompanyName: companyObjectId,
            isDeleted: false,
        };

        // Build date queries for different models (they use different date fields)
        const salesDateQuery = dateRange ? {
            ...baseQuery,
            invoiceDate: {
                $gte: dateRange.start,
                $lte: dateRange.end
            }
        } : baseQuery;

        const purchaseDateQuery = dateRange ? {
            ...baseQuery,
            invoiceDate: {
                $gte: dateRange.start,
                $lte: dateRange.end
            }
        } : baseQuery;

        const expenseDateQuery = dateRange ? {
            ...baseQuery,
            date: {
                $gte: dateRange.start,
                $lte: dateRange.end
            }
        } : baseQuery;

        const incomeDateQuery = dateRange ? {
            ...baseQuery,
            date: {
                $gte: dateRange.start,
                $lte: dateRange.end
            }
        } : baseQuery;

        const receiptDateQuery = dateRange ? {
            ...baseQuery,
            date: {
                $gte: dateRange.start,
                $lte: dateRange.end
            }
        } : baseQuery;

        const paymentDateQuery = dateRange ? {
            ...baseQuery,
            date: {
                $gte: dateRange.start,
                $lte: dateRange.end
            }
        } : baseQuery;

        // Parallel queries for better performance
        const [
            salesStats,
            purchaseStats,
            expenseStats,
            incomeStats,
            receiptStats,
            paymentStats,
            lowStockItems,
            topSalesItems
        ] = await Promise.all([
            // Sales stats
            Sale.aggregate([
                { $match: salesDateQuery },
                {
                    $group: {
                        _id: null,
                        totalSales: { $sum: '$totalAmount' },
                        count: { $sum: 1 },
                        totalReceivable: {
                            $sum: {
                                $cond: [{ $gt: ['$dueAmount', 0] }, '$dueAmount', 0]
                            }
                        },
                        invoiceReceivableCount: {
                            $sum: {
                                $cond: [{ $gt: ['$dueAmount', 0] }, 1, 0]
                            }
                        }
                    }
                }
            ]),

            // Purchase stats
            Purchase.aggregate([
                { $match: purchaseDateQuery },
                {
                    $group: {
                        _id: null,
                        totalPurchases: { $sum: '$totalAmount' },
                        count: { $sum: 1 },
                        totalPayable: {
                            $sum: {
                                $cond: [{ $gt: ['$dueAmount', 0] }, '$dueAmount', 0]
                            }
                        },
                        billsPayableCount: {
                            $sum: {
                                $cond: [{ $gt: ['$dueAmount', 0] }, 1, 0]
                            }
                        }
                    }
                }
            ]),

            // Expense stats
            Expense.aggregate([
                { $match: expenseDateQuery },
                {
                    $group: {
                        _id: null,
                        totalExpenses: { $sum: '$expenseAmount' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Income stats
            Income.aggregate([
                { $match: incomeDateQuery },
                {
                    $group: {
                        _id: null,
                        totalIncome: { $sum: '$incomeAmount' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Receipt stats (cash collected)
            Receipt.aggregate([
                { $match: receiptDateQuery },
                {
                    $group: {
                        _id: null,
                        totalCashCollected: { $sum: '$amount' },
                        cashCollections: {
                            $sum: {
                                $cond: [{ $eq: ['$paymentMethod', 'Cash'] }, '$amount', 0]
                            }
                        },
                        bankCollections: {
                            $sum: {
                                $cond: [{ $ne: ['$paymentMethod', 'Cash'] }, '$amount', 0]
                            }
                        }
                    }
                }
            ]),

            // Payment stats
            Payment.aggregate([
                { $match: paymentDateQuery },
                {
                    $group: {
                        _id: null,
                        totalPayments: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Low stock items - calculate actual current stock
            (async () => {
                const items = await Item.find({
                    ...baseQuery,
                    isActive: true,
                    minStock: { $gt: 0 }
                })
                    .select('name openingStock minStock unit buyPrice')
                    .lean();
                
                // Calculate current stock for each item
                const itemsWithStock = await Promise.all(items.map(async (item) => {
                    const currentStock = await calculateItemStock(
                        item._id,
                        item.name,
                        item.openingStock,
                        new mongoose.Types.ObjectId(ownerId),
                        companyObjectId
                    );
                    return { ...item, currentStock };
                }));
                
                // Filter to only low stock items (current stock <= min stock)
                return itemsWithStock
                    .filter(item => item.currentStock <= item.minStock)
                    .slice(0, 10);
            })(),

            // Top sales items by amount
            Sale.aggregate([
                { $match: salesDateQuery },
                { $unwind: '$items' },
                {
                    $group: {
                        _id: '$items.name',
                        totalAmount: { $sum: '$items.finalAmount' },
                        totalQuantity: { $sum: '$items.qty' }
                    }
                },
                { $sort: { totalAmount: -1 } },
                { $limit: 10 }
            ])
        ]);

        // Calculate expected receivable (future dated sales)
        const futureReceivables = await Sale.aggregate([
            {
                $match: {
                    ownerId: new mongoose.Types.ObjectId(ownerId),
                    accountCompanyName: companyObjectId,
                    isDeleted: false,
                    dueAmount: { $gt: 0 },
                    invoiceDate: { $gt: new Date() }
                }
            },
            {
                $group: {
                    _id: null,
                    expectedReceivable: { $sum: '$dueAmount' }
                }
            }
        ]);

        // Calculate expected payable (future dated purchases)
        const futurePayables = await Purchase.aggregate([
            {
                $match: {
                    ownerId: new mongoose.Types.ObjectId(ownerId),
                    accountCompanyName: companyObjectId,
                    isDeleted: false,
                    dueAmount: { $gt: 0 },
                    invoiceDate: { $gt: new Date() }
                }
            },
            {
                $group: {
                    _id: null,
                    expectedPayable: { $sum: '$dueAmount' }
                }
            }
        ]);

        // Calculate total stock value using CURRENT stock (not opening stock)
        const allItems = await Item.find(baseQuery).select('name openingStock buyPrice').lean();
        let totalStockValue = 0;
        
        for (const item of allItems) {
            const currentStock = await calculateItemStock(
                item._id,
                item.name,
                item.openingStock,
                new mongoose.Types.ObjectId(ownerId),
                companyObjectId
            );
            // Stock value = current stock * buy price
            totalStockValue += (currentStock > 0 ? currentStock : 0) * (Number(item.buyPrice) || 0);
        }

        // Build response
        const stats = {
            businessOperations: {
                totalSales: salesStats[0]?.totalSales || 0,
                totalPurchases: purchaseStats[0]?.totalPurchases || 0,
                totalExpenses: expenseStats[0]?.totalExpenses || 0,
                salesCount: salesStats[0]?.count || 0,
                purchaseCount: purchaseStats[0]?.count || 0,
                expenseCount: expenseStats[0]?.count || 0
            },
            revenueProjections: {
                totalReceivable: salesStats[0]?.totalReceivable || 0,
                totalPayable: purchaseStats[0]?.totalPayable || 0,
                expectedReceivable: futureReceivables[0]?.expectedReceivable || 0,
                expectedPayable: futurePayables[0]?.expectedPayable || 0
            },
            totalIncome: {
                totalIncome: incomeStats[0]?.totalIncome || 0,
                totalStockValue: totalStockValue
            },
            revenueInflow: {
                totalCashCollected: receiptStats[0]?.totalCashCollected || 0,
                cashCollections: receiptStats[0]?.cashCollections || 0,
                bankCollections: receiptStats[0]?.bankCollections || 0,
                totalCashBalance: await calculateCashBalance(ownerId, companyObjectId),
                totalBankBalance: await calculateBankBalance(ownerId, companyObjectId)
            },
            revenueManagement: {
                invoiceReceivableCount: salesStats[0]?.invoiceReceivableCount || 0,
                invoiceReceivableAmount: salesStats[0]?.totalReceivable || 0,
                expectedReceivable: futureReceivables[0]?.expectedReceivable || 0,
                billsPayableCount: purchaseStats[0]?.billsPayableCount || 0,
                billsPayableAmount: purchaseStats[0]?.totalPayable || 0,
                expectedPayable: futurePayables[0]?.expectedPayable || 0
            },
            lowStockItems: lowStockItems.map(item => ({
                name: item.name,
                currentStock: item.currentStock,
                minStock: item.minStock,
                unit: item.unit
            })),
            topSalesItems: topSalesItems.map(item => ({
                name: item._id,
                totalAmount: item.totalAmount,
                totalQuantity: item.totalQuantity
            })),
            payrollOverview: await getPayrollOverview(ownerId, companyId),
            period: period,
            dateRange: dateRange
        };

        res.json(stats);

    } catch (error) {
        console.error('Dashboard Error:', error);
        next(error);
    }
};

/**
 * Helper function to calculate date range based on period
 */
function getDateRange(period, customStart, customEnd) {
    const now = new Date();
    let start, end;

    if (period === 'custom' && customStart && customEnd) {
        return {
            start: new Date(customStart),
            end: new Date(customEnd)
        };
    }

    switch (period) {
        case 'current-month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            break;

        case 'last-month':
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            break;

        case 'current-year':
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            break;

        case 'last-year':
            start = new Date(now.getFullYear() - 1, 0, 1);
            end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
            break;

        case 'all-time':
            return null; // No date filter

        default:
            // Default to current month
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    return { start, end };
}

/**
 * Calculate total cash balance
 * Cash Balance = Cash Receipts - Cash Payments
 */
async function calculateCashBalance(ownerId, companyId) {
    // Get all cash receipts
    const cashReceipts = await Receipt.aggregate([
        {
            $match: {
                ownerId: new mongoose.Types.ObjectId(ownerId),
                accountCompanyName: companyId,
                isDeleted: false,
                paymentMethod: 'Cash'
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' }
            }
        }
    ]);

    // Get all cash payments
    const cashPayments = await Payment.aggregate([
        {
            $match: {
                ownerId: new mongoose.Types.ObjectId(ownerId),
                accountCompanyName: companyId,
                isDeleted: false,
                paymentMethod: 'Cash'
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' }
            }
        }
    ]);

    const totalCashIn = cashReceipts[0]?.total || 0;
    const totalCashOut = cashPayments[0]?.total || 0;

    return totalCashIn - totalCashOut;
}

/**
 * Calculate total bank balance across all bank accounts
 * Bank Balance = Opening Balance + Bank Receipts - Bank Payments
 */
async function calculateBankBalance(ownerId, companyId) {
    // Get all bank accounts and their opening balances
    const banks = await Bank.find({
        ownerId: new mongoose.Types.ObjectId(ownerId),
        accountCompanyName: companyId,
        isDeleted: false,
        isActive: true
    }).select('openingBalance openingBalanceType').lean();

    // Calculate total opening balance (Credit is positive, Debit is negative)
    let openingBalance = 0;
    for (const bank of banks) {
        const balance = Number(bank.openingBalance) || 0;
        if (bank.openingBalanceType === 'Credit') {
            openingBalance += balance;
        } else {
            openingBalance -= balance;
        }
    }

    // Get all bank receipts (non-cash payment methods)
    const bankReceipts = await Receipt.aggregate([
        {
            $match: {
                ownerId: new mongoose.Types.ObjectId(ownerId),
                accountCompanyName: companyId,
                isDeleted: false,
                paymentMethod: { $ne: 'Cash' }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' }
            }
        }
    ]);

    // Get all bank payments (non-cash payment methods)
    const bankPayments = await Payment.aggregate([
        {
            $match: {
                ownerId: new mongoose.Types.ObjectId(ownerId),
                accountCompanyName: companyId,
                isDeleted: false,
                paymentMethod: { $ne: 'Cash' }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' }
            }
        }
    ]);

    const totalBankIn = bankReceipts[0]?.total || 0;
    const totalBankOut = bankPayments[0]?.total || 0;

    return openingBalance + totalBankIn - totalBankOut;
}

/**
 * GET /api/dashboard/section/:sectionName
 * Returns stats for a specific dashboard section only
 * This allows section-level filtering without reloading other sections
 */
exports.getSectionStats = async (req, res, next) => {
    try {
        const { sectionName } = req.params;
        const { companyId, startDate, endDate, period = 'current-month' } = req.query;
        const ownerId = req.user.id;

        if (!companyId) {
            return res.status(400).json({ error: 'companyId is required' });
        }

        // Convert companyId to ObjectId
        let companyObjectId;
        try {
            companyObjectId = new mongoose.Types.ObjectId(companyId);
        } catch (err) {
            return res.status(400).json({ error: 'Invalid companyId format' });
        }

        // Calculate date range
        const dateRange = getDateRange(period, startDate, endDate);

        // Build base query
        const baseQuery = {
            ownerId: new mongoose.Types.ObjectId(ownerId),
            accountCompanyName: companyObjectId,
            isDeleted: false,
        };

        let result = {};

        switch (sectionName) {
            case 'businessOperations': {
                const salesDateQuery = dateRange ? {
                    ...baseQuery,
                    invoiceDate: { $gte: dateRange.start, $lte: dateRange.end }
                } : baseQuery;

                const purchaseDateQuery = dateRange ? {
                    ...baseQuery,
                    invoiceDate: { $gte: dateRange.start, $lte: dateRange.end }
                } : baseQuery;

                const expenseDateQuery = dateRange ? {
                    ...baseQuery,
                    date: { $gte: dateRange.start, $lte: dateRange.end }
                } : baseQuery;

                const [salesStats, purchaseStats, expenseStats] = await Promise.all([
                    Sale.aggregate([
                        { $match: salesDateQuery },
                        {
                            $group: {
                                _id: null,
                                totalSales: { $sum: '$totalAmount' },
                                count: { $sum: 1 }
                            }
                        }
                    ]),
                    Purchase.aggregate([
                        { $match: purchaseDateQuery },
                        {
                            $group: {
                                _id: null,
                                totalPurchases: { $sum: '$totalAmount' },
                                count: { $sum: 1 }
                            }
                        }
                    ]),
                    Expense.aggregate([
                        { $match: expenseDateQuery },
                        {
                            $group: {
                                _id: null,
                                totalExpenses: { $sum: '$expenseAmount' },
                                count: { $sum: 1 }
                            }
                        }
                    ])
                ]);

                result = {
                    totalSales: salesStats[0]?.totalSales || 0,
                    totalPurchases: purchaseStats[0]?.totalPurchases || 0,
                    totalExpenses: expenseStats[0]?.totalExpenses || 0,
                    salesCount: salesStats[0]?.count || 0,
                    purchaseCount: purchaseStats[0]?.count || 0,
                    expenseCount: expenseStats[0]?.count || 0
                };
                break;
            }

            case 'revenueProjections': {
                const salesDateQuery = dateRange ? {
                    ...baseQuery,
                    invoiceDate: { $gte: dateRange.start, $lte: dateRange.end }
                } : baseQuery;

                const purchaseDateQuery = dateRange ? {
                    ...baseQuery,
                    invoiceDate: { $gte: dateRange.start, $lte: dateRange.end }
                } : baseQuery;

                const [salesStats, purchaseStats, futureReceivables, futurePayables] = await Promise.all([
                    Sale.aggregate([
                        { $match: salesDateQuery },
                        {
                            $group: {
                                _id: null,
                                totalReceivable: {
                                    $sum: { $cond: [{ $gt: ['$dueAmount', 0] }, '$dueAmount', 0] }
                                }
                            }
                        }
                    ]),
                    Purchase.aggregate([
                        { $match: purchaseDateQuery },
                        {
                            $group: {
                                _id: null,
                                totalPayable: {
                                    $sum: { $cond: [{ $gt: ['$dueAmount', 0] }, '$dueAmount', 0] }
                                }
                            }
                        }
                    ]),
                    Sale.aggregate([
                        {
                            $match: {
                                ...baseQuery,
                                dueAmount: { $gt: 0 },
                                invoiceDate: { $gt: new Date() }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                expectedReceivable: { $sum: '$dueAmount' }
                            }
                        }
                    ]),
                    Purchase.aggregate([
                        {
                            $match: {
                                ...baseQuery,
                                dueAmount: { $gt: 0 },
                                invoiceDate: { $gt: new Date() }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                expectedPayable: { $sum: '$dueAmount' }
                            }
                        }
                    ])
                ]);

                result = {
                    totalReceivable: salesStats[0]?.totalReceivable || 0,
                    totalPayable: purchaseStats[0]?.totalPayable || 0,
                    expectedReceivable: futureReceivables[0]?.expectedReceivable || 0,
                    expectedPayable: futurePayables[0]?.expectedPayable || 0
                };
                break;
            }

            case 'totalIncome': {
                const incomeDateQuery = dateRange ? {
                    ...baseQuery,
                    date: { $gte: dateRange.start, $lte: dateRange.end }
                } : baseQuery;

                const incomeStats = await Income.aggregate([
                    { $match: incomeDateQuery },
                    {
                        $group: {
                            _id: null,
                            totalIncome: { $sum: '$incomeAmount' }
                        }
                    }
                ]);

                // Stock value is independent of period filter
                const allItems = await Item.find(baseQuery).select('name openingStock buyPrice').lean();
                let totalStockValue = 0;
                
                for (const item of allItems) {
                    const currentStock = await calculateItemStock(
                        item._id,
                        item.name,
                        item.openingStock,
                        new mongoose.Types.ObjectId(ownerId),
                        companyObjectId
                    );
                    totalStockValue += (currentStock > 0 ? currentStock : 0) * (Number(item.buyPrice) || 0);
                }

                result = {
                    totalIncome: incomeStats[0]?.totalIncome || 0,
                    totalStockValue: totalStockValue
                };
                break;
            }

            case 'revenueInflow': {
                const receiptDateQuery = dateRange ? {
                    ...baseQuery,
                    date: { $gte: dateRange.start, $lte: dateRange.end }
                } : baseQuery;

                const receiptStats = await Receipt.aggregate([
                    { $match: receiptDateQuery },
                    {
                        $group: {
                            _id: null,
                            totalCashCollected: { $sum: '$amount' },
                            cashCollections: {
                                $sum: { $cond: [{ $eq: ['$paymentMethod', 'Cash'] }, '$amount', 0] }
                            },
                            bankCollections: {
                                $sum: { $cond: [{ $ne: ['$paymentMethod', 'Cash'] }, '$amount', 0] }
                            }
                        }
                    }
                ]);

                result = {
                    totalCashCollected: receiptStats[0]?.totalCashCollected || 0,
                    cashCollections: receiptStats[0]?.cashCollections || 0,
                    bankCollections: receiptStats[0]?.bankCollections || 0,
                    totalCashBalance: await calculateCashBalance(ownerId, companyObjectId),
                    totalBankBalance: await calculateBankBalance(ownerId, companyObjectId)
                };
                break;
            }

            case 'revenueManagement': {
                const salesDateQuery = dateRange ? {
                    ...baseQuery,
                    invoiceDate: { $gte: dateRange.start, $lte: dateRange.end }
                } : baseQuery;

                const purchaseDateQuery = dateRange ? {
                    ...baseQuery,
                    invoiceDate: { $gte: dateRange.start, $lte: dateRange.end }
                } : baseQuery;

                const [salesStats, purchaseStats, futureReceivables, futurePayables] = await Promise.all([
                    Sale.aggregate([
                        { $match: salesDateQuery },
                        {
                            $group: {
                                _id: null,
                                totalReceivable: {
                                    $sum: { $cond: [{ $gt: ['$dueAmount', 0] }, '$dueAmount', 0] }
                                },
                                invoiceReceivableCount: {
                                    $sum: { $cond: [{ $gt: ['$dueAmount', 0] }, 1, 0] }
                                }
                            }
                        }
                    ]),
                    Purchase.aggregate([
                        { $match: purchaseDateQuery },
                        {
                            $group: {
                                _id: null,
                                totalPayable: {
                                    $sum: { $cond: [{ $gt: ['$dueAmount', 0] }, '$dueAmount', 0] }
                                },
                                billsPayableCount: {
                                    $sum: { $cond: [{ $gt: ['$dueAmount', 0] }, 1, 0] }
                                }
                            }
                        }
                    ]),
                    Sale.aggregate([
                        {
                            $match: {
                                ...baseQuery,
                                dueAmount: { $gt: 0 },
                                invoiceDate: { $gt: new Date() }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                expectedReceivable: { $sum: '$dueAmount' }
                            }
                        }
                    ]),
                    Purchase.aggregate([
                        {
                            $match: {
                                ...baseQuery,
                                dueAmount: { $gt: 0 },
                                invoiceDate: { $gt: new Date() }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                expectedPayable: { $sum: '$dueAmount' }
                            }
                        }
                    ])
                ]);

                result = {
                    invoiceReceivableCount: salesStats[0]?.invoiceReceivableCount || 0,
                    invoiceReceivableAmount: salesStats[0]?.totalReceivable || 0,
                    expectedReceivable: futureReceivables[0]?.expectedReceivable || 0,
                    billsPayableCount: purchaseStats[0]?.billsPayableCount || 0,
                    billsPayableAmount: purchaseStats[0]?.totalPayable || 0,
                    expectedPayable: futurePayables[0]?.expectedPayable || 0
                };
                break;
            }

            case 'saleAnalytics': {
                const salesDateQuery = dateRange ? {
                    ...baseQuery,
                    invoiceDate: { $gte: dateRange.start, $lte: dateRange.end }
                } : baseQuery;

                const topSalesItems = await Sale.aggregate([
                    { $match: salesDateQuery },
                    { $unwind: '$items' },
                    {
                        $group: {
                            _id: '$items.name',
                            totalAmount: { $sum: '$items.finalAmount' },
                            totalQuantity: { $sum: '$items.qty' }
                        }
                    },
                    { $sort: { totalAmount: -1 } },
                    { $limit: 10 }
                ]);

                result = topSalesItems.map(item => ({
                    name: item._id,
                    totalAmount: item.totalAmount,
                    totalQuantity: item.totalQuantity
                }));
                break;
            }

            default:
                return res.status(400).json({ error: `Unknown section: ${sectionName}` });
        }

        res.json({ data: result, period, dateRange });

    } catch (error) {
        console.error('Section Stats Error:', error);
        next(error);
    }
};

/**
 * Helper: get payroll overview for dashboard
 */
async function getPayrollOverview(ownerId, accountCompanyName) {
    try {
        const totalStaff = await Staff.countDocuments({
            accountCompanyName,
            isDeleted: false,
            status: 'active',
        });

        // Get current month payroll period
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const currentPeriod = await PayrollPeriod.findOne({
            accountCompanyName,
            isDeleted: false,
            fromDate: { $lte: monthEnd },
            toDate: { $gte: monthStart },
        }).lean();

        // Overall pending salary
        const pendingCalcs = await PayrollCalculation.aggregate([
            {
                $match: {
                    accountCompanyName,
                    isDeleted: false,
                    paymentStatus: { $in: ['pending', 'partial'] },
                },
            },
            {
                $group: {
                    _id: null,
                    totalPending: { $sum: { $subtract: [{ $ifNull: ['$netSalary', 0] }, { $ifNull: ['$paidAmount', 0] }] } },
                    count: { $sum: 1 },
                },
            },
        ]);

        return {
            totalActiveStaff: totalStaff,
            currentPeriod: currentPeriod ? {
                periodName: currentPeriod.periodName,
                status: currentPeriod.status,
                totalPayableSalary: currentPeriod.totalPayableSalary || 0,
                totalPaidSalary: currentPeriod.totalPaidSalary || 0,
            } : null,
            pendingSalary: pendingCalcs[0]?.totalPending || 0,
            pendingStaffCount: pendingCalcs[0]?.count || 0,
        };
    } catch (error) {
        console.error('Error getting payroll overview:', error);
        return {
            totalActiveStaff: 0,
            currentPeriod: null,
            pendingSalary: 0,
            pendingStaffCount: 0,
        };
    }
}
