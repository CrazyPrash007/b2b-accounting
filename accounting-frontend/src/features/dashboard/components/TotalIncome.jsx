import React from "react";

export default function TotalIncome({ data, period, onPeriodChange }) {
    const formatAmount = (amount) => (amount || 0).toFixed(2);

    const periodOptions = [
        { value: 'current-month', label: 'Current Month' },
        { value: 'last-month', label: 'Last Month' },
        { value: 'current-year', label: 'Current Year' },
        { value: 'all-time', label: 'All Time' }
    ];

    return (
        <div className="card p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-800">Total Available Income</h3>
                <select
                    className="text-sm text-gray-500 border px-3 py-1 rounded-md bg-white"
                    value={period}
                    onChange={(e) => onPeriodChange(e.target.value)}
                >
                    {periodOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {/* Grid: Left (Green) takes 2 parts, Right (Stock) takes 1 part */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Green Block */}
                <div className="lg:col-span-2 bg-[#ecfdf3] border border-[#d1f3da] rounded-lg p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-white border border-[#d1f3da] flex items-center justify-center text-xl text-green-600">
                        ₹
                    </div>
                    <div>
                        <div className="text-sm text-gray-600 font-medium">Total Income</div>
                        <div className="text-2xl font-bold text-gray-900 mt-1">{formatAmount(data?.totalIncome)}</div>
                    </div>
                </div>

                {/* Stock Block */}
                <div className="lg:col-span-1 bg-white border border-gray-200 rounded-lg p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-xl">
                        👜
                    </div>
                    <div>
                        <div className="text-sm text-gray-600 font-medium">Total Available Stock on Hand</div>
                        <div className="text-2xl font-bold text-gray-900 mt-1">{formatAmount(data?.totalStockValue)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}