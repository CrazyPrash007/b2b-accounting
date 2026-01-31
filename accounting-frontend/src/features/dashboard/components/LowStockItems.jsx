import React from "react";

export default function LowStockItems({ data }) {
    const lowStockItems = data || [];

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-800">Low Stock Items</h3>
            </div>

            <div className="min-h-[200px] rounded-md border border-gray-200 bg-white">
                {lowStockItems.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 py-8">
                        No low stock items found
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {lowStockItems.map((item, idx) => (
                            <div key={idx} className="p-3 hover:bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-800">{item.name}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Unit: {item.unit || 'N/A'}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold text-red-600">
                                            {item.currentStock} / {item.minStock}
                                        </div>
                                        <div className="text-xs text-gray-500">Current / Min</div>
                                    </div>
                                </div>
                                {item.currentStock <= 0 && (
                                    <div className="mt-2 text-xs text-red-600 font-medium">
                                        Out of Stock!
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
