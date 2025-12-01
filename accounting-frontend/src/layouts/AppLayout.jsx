import React from "react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";


export default function AppLayout({ children }) {
    // if children is provided, render it; otherwise render <Outlet/> for nested routes
    const content = children ?? <Outlet />;

    return (
        <div className="min-h-screen flex bg-slate-50">
            <Sidebar />

            <div className="flex-1 flex flex-col">
                {/* Topbar */}


                {/* Main */}
                <main className="p-6">
                    {content}
                </main>
            </div>
        </div>
    );
}

