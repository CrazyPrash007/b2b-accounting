import React from "react";

export default function BusinessOperations({ data, period, onPeriodChange }) {
    const formatAmount = (amount) => `₹${(amount || 0).toFixed(2)}`;

    const periodOptions = [
        { value: 'current-month', label: 'Current Month' },
        { value: 'last-month', label: 'Last Month' },
        { value: 'current-year', label: 'Current Year' },
        { value: 'all-time', label: 'All Time' }
    ];

    return (
        <div className="card p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-800">Business operations</h3>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <OperationCard 
                    label="Total Sale" 
                    amount={formatAmount(data?.totalSales)} 
                    icon="🛒" 
                    bg="bg-blue-50" 
                    border="border-blue-100" 
                />
                <OperationCard 
                    label="Total Purchase" 
                    amount={formatAmount(data?.totalPurchases)} 
                    icon="🛍️" 
                    bg="bg-indigo-50" 
                    border="border-indigo-100" 
                />
                <OperationCard 
                    label="Total Expenses" 
                    amount={formatAmount(data?.totalExpenses)} 
                    icon="💸" 
                    bg="bg-red-50" 
                    border="border-red-100" 
                />
            </div>
        </div>
    );
}

function OperationCard({ label, amount, icon, bg, border }) {
    return (
        <div className={`border rounded-lg p-4 flex items-center gap-4 ${bg} ${border}`}>
            <div className="text-2xl w-10 h-10 flex items-center justify-center bg-white rounded border border-gray-100">
                {icon}
            </div>
            <div>
                <div className="text-lg font-bold text-gray-900">{amount}</div>
                <div className="text-sm text-gray-500">{label}</div>
            </div>
        </div>
    );
}