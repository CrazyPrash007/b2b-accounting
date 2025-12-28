import React, { useState } from "react";

export default function SaleAnalytics({ data, period, onPeriodChange }) {
    const [tab, setTab] = useState("top-item");

    const periodOptions = [
        { value: 'current-month', label: 'Current Month' },
        { value: 'last-month', label: 'Last Month' },
        { value: 'current-year', label: 'Current Year' },
        { value: 'all-time', label: 'All Time' }
    ];

    const topItems = data || [];
    const formatAmount = (amount) => `₹${(amount || 0).toFixed(2)}`;

    return (
        <div className="card p-4">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-800">Sale Analytics</h3>

                <div className="flex items-center gap-2">
                    <select
                        className="text-sm border rounded px-2 py-1"
                        value={period}
                        onChange={(e) => onPeriodChange(e.target.value)}
                    >
                        {periodOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="border-b mb-3">
                <nav className="flex gap-6">
                    <button
                        onClick={() => setTab("top-item")}
                        className={`py-2 ${
                            tab === "top-item" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500"
                        }`}
                    >
                        Top Sales Item
                    </button>
                    <button
                        onClick={() => setTab("top-qty")}
                        className={`py-2 ${
                            tab === "top-qty" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500"
                        }`}
                    >
                        Top Sold Quantity
                    </button>
                </nav>
            </div>

            <div className="min-h-[200px] rounded-b-md bg-white border-t border-gray-100">
                {topItems.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 py-8">
                        No sales record found
                    </div>
                ) : (
                    <div className="space-y-2 p-2">
                        {tab === "top-item" ? (
                            topItems.slice(0, 5).map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 border-b border-gray-100 last:border-0">
                                    <div>
                                        <div className="font-medium text-gray-800">{item.name}</div>
                                        <div className="text-xs text-gray-500">Qty: {item.totalQuantity}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-gray-900">{formatAmount(item.totalAmount)}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            topItems
                                .slice()
                                .sort((a, b) => b.totalQuantity - a.totalQuantity)
                                .slice(0, 5)
                                .map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-2 border-b border-gray-100 last:border-0">
                                        <div>
                                            <div className="font-medium text-gray-800">{item.name}</div>
                                            <div className="text-xs text-gray-500">{formatAmount(item.totalAmount)}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-gray-900">{item.totalQuantity} units</div>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
