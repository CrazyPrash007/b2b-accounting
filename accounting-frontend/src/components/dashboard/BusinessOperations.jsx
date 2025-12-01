import React from "react";

export default function BusinessOperations() {
    return (
        <div className="card p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-800">Business operations</h3>
                <button className="text-sm text-gray-500 border px-3 py-1 rounded-md bg-white">
                    Current month ▾
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <OperationCard label="Total Sale" amount="₹0.00" icon="🛒" bg="bg-blue-50" border="border-blue-100" />
                <OperationCard label="Total Purchase" amount="₹0.00" icon="🛍️" bg="bg-indigo-50" border="border-indigo-100" />
                <OperationCard label="Total Expenses" amount="₹0.00" icon="💸" bg="bg-red-50" border="border-red-100" />
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