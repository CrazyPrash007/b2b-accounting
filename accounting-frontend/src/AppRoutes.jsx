import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "src/layouts/AppLayout";

import DashboardPage from "src/features/dashboard/DashboardPage";
import ItemCategoryPage from "src/features/items/item-category/ItemCategoryPage";
import ItemCategoryFormPage from "src/features/items/item-category/ItemCategoryFormPage";
import ItemsPage from "src/features/items/items/ItemsPage";
import ItemFormPage from "src/features/items/items/ItemFormPage";


export default function AppRoutes() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="item-category" element={<ItemCategoryPage />} />
                <Route path="item-category/new" element={<ItemCategoryFormPage />} />
                <Route path="item-category/edit" element={<ItemCategoryFormPage />} />
                <Route path="items" element={<ItemsPage />} />
                <Route path="items/new" element={<ItemFormPage />} />
                <Route path="items/edit" element={<ItemFormPage />} />

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
