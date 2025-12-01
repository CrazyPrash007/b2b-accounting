// src/features/dashboard/components/Dashboard.jsx
import React from "react";
import BusinessOperations from "./BusinessOperations";
import RevenueProjections from "./RevenueProjections";
import QuickAccess from "./QuickAccess";
import TotalIncome from "./TotalIncome";
import RevenueInflow from "./RevenueInflow";
import RevenueManagement from "./RevenueManagement";
import SaleAnalytics from "./SaleAnalytics";
import LowStockItems from "./LowStockItems";

export default function Dashboard() {
    return (
        <div className="space-y-4">
            {/* 1. Top Section: Full Width Cards */}
            <BusinessOperations />
            <RevenueProjections />
            <QuickAccess />
            <TotalIncome />

            {/* Row: Revenue Inflow (2/3) + Revenue Management (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 h-full">
                    <RevenueInflow />
                </div>
                <div className="lg:col-span-1 h-full">
                    <RevenueManagement />
                </div>
            </div>

            {/* Changed to grid-cols-2 for 50-50 split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="h-full">
                    <SaleAnalytics />
                </div>
                <div className="h-full">
                    <LowStockItems />
                </div>
            </div>
        </div>
    );
}
