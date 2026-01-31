import React from "react";
import { useNavigate } from "react-router-dom";

const actions = [
    { label: "Create Account", icon: "📁", path: "/customer", tooltip: "Add new customer or vendor" },
    { label: "Create Item", icon: "📦", path: "/items", tooltip: "Add new product or service" },
    { label: "Create Sales Invoice", icon: "🧾", path: "/sales", tooltip: "Create new sales invoice" },
    { label: "Create Purchase Bill", icon: "📄", path: "/purchase", tooltip: "Create new purchase bill" },
    { label: "Create Receipt", icon: "🧾", path: "/receipt", tooltip: "Record payment received" },
    { label: "Create Payment", icon: "💳", path: "/payment", tooltip: "Record payment made" },
];

export default function QuickAccess() {
    const navigate = useNavigate();

    const handleQuickAction = (path) => {
        navigate(path);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-800">Quick Access</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {actions.map((a) => (
                    <button
                        key={a.label}
                        onClick={() => handleQuickAction(a.path)}
                        className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer group"
                        title={a.tooltip}
                    >
                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                            {a.icon}
                        </div>
                        <div className="text-xs text-center text-gray-700 group-hover:text-indigo-700 font-medium">
                            {a.label}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
