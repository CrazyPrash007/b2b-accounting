import React from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { Outlet } from "react-router-dom";


export default function AppLayout({ children }) {
    const content = children ?? <Outlet />;

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
            {/* TopBar - Consistent across all pages */}
            <TopBar />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar />

                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    {content}
                </main>
            </div>
        </div>
    );
}

