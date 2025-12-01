// import Sidebar from "./Sidebar";

// export default function AppLayout({ children }) {
//     return (
//         <div className="flex min-h-screen">
//             <Sidebar />
//             <main className="flex-1 p-6 overflow-y-auto">
//                 <div className="max-w-[1200px] mx-auto">
//                     {children}
//                 </div>
//             </main>
//         </div>
//     );
// }

// src/layouts/AppLayout.jsx
import React from "react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

/**
 * AppLayout - global page wrapper
 * - Sidebar on the left (desktop)
 * - Topbar with small controls
 * - Main content area (children or <Outlet/> when used inside Router)
 *
 * Usage:
 * 1) If you render pages with react-router, wrap routes like:
 *    <Route element={<AppLayout />} >
 *      <Route path="/" element={<DashboardPage />} />
 *      <Route path="/item-category" element={<ItemCategoryPage />} />
 *    </Route>
 *
 * 2) Or use AppLayout as a wrapper: <AppLayout><Page /></AppLayout>
 */

export default function AppLayout({ children }) {
    // if children is provided, render it; otherwise render <Outlet/> for nested routes
    const content = children ?? <Outlet />;

    return (
        <div className="min-h-screen flex bg-slate-50">
            <Sidebar />

            <div className="flex-1 flex flex-col">
                {/* Topbar */}
                <header className="bg-white border-b px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* small controls */}
                            <button className="md:hidden p-2 rounded hover:bg-slate-100" aria-label="Open menu">
                                ☰
                            </button>
                            <div className="text-lg font-semibold">Munim Accounting</div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-sm text-slate-600">2025-26 • Shah accounting</div>
                            <button className="px-3 py-1 border rounded text-sm">Buy Now</button>
                            <div className="text-sm text-slate-500">Welcome, Atulya</div>
                        </div>
                    </div>
                </header>

                {/* Main */}
                <main className="p-6">
                    {content}
                </main>
            </div>
        </div>
    );
}

