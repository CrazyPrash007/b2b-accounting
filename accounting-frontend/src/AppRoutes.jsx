import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "src/layouts/AppLayout";
import NotFoundPage from "src/components/NotFoundPage";

import DashboardPage from "src/features/dashboard/DashboardPage";
import ItemCategoryPage from "src/features/items/item-category/ItemCategoryPage";
import ItemsPage from "src/features/items/items/ItemsPage";
import GstPage from "src/features/items/gst/GstPage";
import UnitPage from "src/features/items/unit/UnitPage";
import CustomerPage from "src/features/party/customer/CustomerPage";
import VendorPage from "src/features/party/vendor/VendorPage";
import PartyHistoryPage from "src/features/party/PartyHistoryPage";
import BankPage from "src/features/account/bank/BankPage";
import BrandPage from "src/features/account/brand/BrandPage";
import ExpensePage from "src/features/transactions/expense/ExpensePage";
import IncomePage from "src/features/transactions/income/IncomePage";
import SalesPage from "src/features/transactions/sales/SalesPage";
import PurchasePage from "src/features/transactions/purchase/PurchasePage";
import PaymentPage from "src/features/transactions/payment/PaymentPage";
import ReceiptPage from "src/features/transactions/receipt/ReceiptPage";
import EnquiryPage from "src/features/enquiry/EnquiryPage";
import AdsPage from "src/features/ads/AdsPage";


export default function AppRoutes() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="item-category" element={<ItemCategoryPage />} />
                <Route path="items" element={<ItemsPage />} />
                <Route path="gst" element={<GstPage />} />
                <Route path="unit" element={<UnitPage />} />
                <Route path="customer" element={<CustomerPage />} />
                <Route path="customer/:id" element={<PartyHistoryPage />} />
                <Route path="vendor" element={<VendorPage />} />
                <Route path="vendor/:id" element={<PartyHistoryPage />} />
                <Route path="bank" element={<BankPage />} />
                <Route path="brand" element={<BrandPage />} />
                <Route path="expenses" element={<ExpensePage />} />
                <Route path="income" element={<IncomePage />} />
                <Route path="sales" element={<SalesPage />} />
                <Route path="purchase" element={<PurchasePage />} />
                <Route path="payment" element={<PaymentPage />} />
                <Route path="receipt" element={<ReceiptPage />} />
                <Route path="enquiry" element={<EnquiryPage />} />
                <Route path="ads" element={<AdsPage />} />
            </Route>

            {/* 404 Not Found - outside AppLayout to show full-page error */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
