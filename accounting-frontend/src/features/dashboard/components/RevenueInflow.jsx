import React from "react";

export default function RevenueInflow() {
    return (
        <div className="card p-4 bg-white border border-gray-200 rounded-lg h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-800">Revenue Inflow</h3>
                <button className="text-sm text-gray-500 border px-3 py-1 rounded-md bg-white">
                    Current month ▾
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InflowItem label="Total Cash Collected" amount="₹0.00" icon="💵" bg="bg-blue-50" />
                <InflowItem label="Total Cash Balance (As on)" amount="₹0.00" icon="🏦" bg="bg-indigo-50" />
                <InflowItem label="Total Collection In Bank" amount="₹0.00" icon="🏛️" bg="bg-orange-50" />
                <InflowItem label="Total Bank Balance (As on)" amount="₹0.00" icon="💳" bg="bg-pink-50" />
            </div>
        </div>
    );
}

function InflowItem({ label, amount, icon, bg }) {
    return (
        <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-white">
            <div className={`min-w-[40px] h-[40px] rounded-lg ${bg} flex items-center justify-center text-lg`}>
                {icon}
            </div>
            <div className="overflow-hidden">
                <div className="text-lg font-bold text-gray-900 leading-none">{amount}</div>
                <div className="text-xs text-gray-500 mt-1 truncate">{label}</div>
            </div>
        </div>
    );
}