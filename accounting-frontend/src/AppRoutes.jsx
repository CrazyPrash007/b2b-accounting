import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "src/layouts/AppLayout";

import DashboardPage from "src/features/dashboard/DashboardPage";
import ItemCategoryPage from "src/features/items/item-category/ItemCategoryPage";
import ItemsPage from "src/features/items/items/ItemsPage";
import GstPage from "src/features/items/gst/GstPage";
import UnitPage from "src/features/items/unit/UnitPage";
import CustomerPage from "src/features/party/customer/CustomerPage";
import VendorPage from "src/features/party/vendor/VendorPage";
import BankPage from "src/features/account/bank/BankPage";


export default function AppRoutes() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="item-category" element={<ItemCategoryPage />} />
                <Route path="items" element={<ItemsPage />} />
                <Route path="gst" element={<GstPage />} />
                <Route path="unit" element={<UnitPage />} />
                <Route path="party/customer" element={<CustomerPage />} />
                <Route path="party/vendor" element={<VendorPage />} />
                <Route path="account/bank" element={<BankPage />} />

                <Route path="*" element={<div className="p-6">Page not found</div>} />
            </Route>

            <Route path="/" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
