// src/controllers/dashboard.controller.js
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Receipt = require('../models/Receipt');
const Payment = require('../models/Payment');
const Item = require('../models/Item');

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

            // Low stock items (no date filter)
            Item.find({
                ...baseQuery,
                isActive: true,
                $expr: { $lte: ['$openingStock', '$minStock'] },
                minStock: { $gt: 0 }
            })
                .select('name openingStock minStock unit')
                .limit(10)
                .lean(),

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

        // Calculate total stock value
        const stockValue = await Item.aggregate([
            { $match: baseQuery },
            {
                $group: {
                    _id: null,
                    totalStockValue: {
                        $sum: { $multiply: ['$openingStock', '$buyPrice'] }
                    }
                }
            }
        ]);

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
                totalStockValue: stockValue[0]?.totalStockValue || 0
            },
            revenueInflow: {
                totalCashCollected: receiptStats[0]?.totalCashCollected || 0,
                cashCollections: receiptStats[0]?.cashCollections || 0,
                bankCollections: receiptStats[0]?.bankCollections || 0,
                // Balance calculations would need Bank model integration
                totalCashBalance: 0, // TODO: integrate with Bank model
                totalBankBalance: 0  // TODO: integrate with Bank model
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
                currentStock: item.openingStock,
                minStock: item.minStock,
                unit: item.unit
            })),
            topSalesItems: topSalesItems.map(item => ({
                name: item._id,
                totalAmount: item.totalAmount,
                totalQuantity: item.totalQuantity
            })),
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
