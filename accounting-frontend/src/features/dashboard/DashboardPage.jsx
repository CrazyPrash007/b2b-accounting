// src/features/dashboard/DashboardPage.jsx
import React from "react";
import AppLayout from "src/layouts/AppLayout"; // global layout (absolute import)
import Dashboard from "src/features/dashboard/components/Dashboard"; // local component

export default function DashboardPage() {
    return (
        <AppLayout>
            <Dashboard />
        </AppLayout>
    );
}
