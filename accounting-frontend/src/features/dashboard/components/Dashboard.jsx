// src/features/dashboard/components/Dashboard.jsx
import React from "react";
import useDashboard from "../hooks/useDashboard";
import BusinessOperations from "./BusinessOperations";
import RevenueProjections from "./RevenueProjections";
import QuickAccess from "./QuickAccess";
import TotalIncome from "./TotalIncome";
import RevenueInflow from "./RevenueInflow";
import RevenueManagement from "./RevenueManagement";
import SaleAnalytics from "./SaleAnalytics";
import LowStockItems from "./LowStockItems";

export default function Dashboard() {
    const { stats, loading, error, period, changePeriod, refresh } = useDashboard();

    console.log('Dashboard Component - Stats:', stats);
    console.log('Dashboard Component - Loading:', loading);
    console.log('Dashboard Component - Error:', error);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={refresh}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 1. Top Section: Full Width Cards */}
            <BusinessOperations data={stats?.businessOperations} period={period} onPeriodChange={changePeriod} />
            <RevenueProjections data={stats?.revenueProjections} period={period} onPeriodChange={changePeriod} />
            <QuickAccess />
            <TotalIncome data={stats?.totalIncome} period={period} onPeriodChange={changePeriod} />

            {/* Row: Revenue Inflow (2/3) + Revenue Management (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 h-full">
                    <RevenueInflow data={stats?.revenueInflow} period={period} onPeriodChange={changePeriod} />
                </div>
                <div className="lg:col-span-1 h-full">
                    <RevenueManagement data={stats?.revenueManagement} period={period} onPeriodChange={changePeriod} />
                </div>
            </div>

            {/* Changed to grid-cols-2 for 50-50 split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="h-full">
                    <SaleAnalytics data={stats?.topSalesItems} period={period} onPeriodChange={changePeriod} />
                </div>
                <div className="h-full">
                    <LowStockItems data={stats?.lowStockItems} />
                </div>
            </div>
        </div>
    );
}

