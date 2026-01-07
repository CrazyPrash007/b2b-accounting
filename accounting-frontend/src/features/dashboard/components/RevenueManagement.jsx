import React from "react";

export default function RevenueManagement({ data, period, onPeriodChange }) {
    const formatAmount = (amount) => `₹${(amount || 0).toFixed(2)}`;

    const periodOptions = [
        { value: 'current-month', label: 'Current Month' },
        { value: 'last-month', label: 'Last Month' },
        { value: 'current-year', label: 'Current Year' },
        { value: 'all-time', label: 'All Time' }
    ];

    return (
        <div className="card p-4 bg-white border border-gray-200 rounded-lg h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-800">Revenue Management</h3>
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

            {/* Changed to 2x2 Grid to save vertical space */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ManageItem 
                    label="Invoice Receivable" 
                    count={data?.invoiceReceivableCount || 0}
                    amount={formatAmount(data?.invoiceReceivableAmount)} 
                    icon="📄" 
                    bg="bg-orange-50" 
                />
                <ManageItem 
                    label="Expected Receivable" 
                    amount={formatAmount(data?.expectedReceivable)} 
                    icon="⏳" 
                    bg="bg-green-50" 
                />
                <ManageItem 
                    label="Bills Payable" 
                    count={data?.billsPayableCount || 0}
                    amount={formatAmount(data?.billsPayableAmount)} 
                    icon="📦" 
                    bg="bg-yellow-50" 
                />
                <ManageItem 
                    label="Expected Payable" 
                    amount={formatAmount(data?.expectedPayable)} 
                    icon="💸" 
                    bg="bg-pink-50" 
                />
            </div>
        </div>
    );
}

function ManageItem({ label, amount, count, icon, bg }) {
    return (
        <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-white">
            <div className={`min-w-10 h-10 rounded-lg ${bg} flex items-center justify-center text-lg`}>
                {icon}
            </div>
            <div className="overflow-hidden">
                {count !== undefined ? (
                    <>
                        <div className="text-lg font-bold text-gray-900 leading-none">{count}</div>
                        <div className="text-xs text-gray-500 mt-1 truncate">{label}</div>
                        <div className="text-sm font-semibold text-gray-700 mt-1">{amount}</div>
                    </>
                ) : (
                    <>
                        <div className="text-lg font-bold text-gray-900 leading-none">{amount}</div>
                        <div className="text-xs text-gray-500 mt-1 truncate">{label}</div>
                    </>
                )}
            </div>
        </div>
    );
}