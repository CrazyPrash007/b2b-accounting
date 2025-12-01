import React from "react";

export default function LowStockItems() {
    return (
        <div className="card p-4">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-800">Low Stock Items</h3>
            </div>

            <div className="min-h-[200px] rounded-md border border-gray-100 bg-white flex items-center justify-center text-gray-400">
                No low stock items found
            </div>
        </div>
    );
}
