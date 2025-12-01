import React from "react";

const actions = [
    { label: "Create Account", icon: "📁" },
    { label: "Create Item", icon: "📦" },
    { label: "Create Sales Invoice", icon: "🧾" },
    { label: "Create Purchase Bill", icon: "📄" },
    { label: "Create Receipt", icon: "🧾" },
    { label: "Create Payment", icon: "💳" },
];

export default function QuickAccess() {
    return (
        <div className="card p-4">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-800">Quick Access</h3>
                <button className="text-sm text-primary">View More</button>
            </div>

            <div className="quick-grid">
                {actions.map((a) => (
                    <div key={a.label} className="quick-card">
                        <div className="text-2xl mb-2">{a.icon}</div>
                        <div className="text-sm">{a.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
