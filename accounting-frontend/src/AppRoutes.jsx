import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "src/layouts/AppLayout";

import DashboardPage from "src/features/dashboard/DashboardPage";
import ItemCategoryPage from "src/features/items/item-category/ItemCategoryPage";


export default function AppRoutes() {
    return (
        <Routes>
            {/* Routes rendered inside the main application layout */}
            <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="item-category" element={<ItemCategoryPage />} />

                {/* Example placeholders for future features */}
                {/* <Route path="party">
          <Route path="customer" element={<CustomerPage />} />
          <Route path="vendor" element={<VendorPage />} />
        </Route> */}

                <Route path="*" element={<div className="p-6">Page not found</div>} />
            </Route>

            <Route path="/" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
