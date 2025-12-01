import React, { useState } from "react";

export default function SaleAnalytics() {
    const [tab, setTab] = useState("top-item");

    return (
        <div className="card p-4">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-800">Sale Analytics</h3>

                <div className="flex items-center gap-2">
                    <select className="text-sm border rounded px-2 py-1">
                        <option>item : Product</option>
                    </select>
                    <select className="text-sm border rounded px-2 py-1">
                        <option>Current month</option>
                    </select>
                </div>
            </div>

            <div className="border-b mb-3">
                <nav className="flex gap-6">
                    <button
                        onClick={() => setTab("top-item")}
                        className={`py-2 ${tab === "top-item" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500"}`}
                    >
                        Top Sales Item
                    </button>
                    <button
                        onClick={() => setTab("top-qty")}
                        className={`py-2 ${tab === "top-qty" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500"}`}
                    >
                        Top Sold Quantity
                    </button>
                </nav>
            </div>

            <div className="min-h-[200px] rounded-b-md bg-white border-t border-gray-100 flex items-center justify-center text-gray-400">
                No sales record found
            </div>
        </div>
    );
}
