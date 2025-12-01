export default function RevenueProjections() {
    return (
        <div className="card p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-800">Revenue Projections</h3>

                <button className="text-sm text-gray-500 border px-3 py-1 rounded-md">
                    Current month
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <ProjectionCard label="Total Receivable Amount" amount="₹0.00" />
                <ProjectionCard label="Total Payable Amount" amount="₹0.00" />
            </div>
        </div>
    );
}

function ProjectionCard({ label, amount }) {
    return (
        <div className="p-4 border rounded-lg bg-gray-50">
            <div className="text-sm text-gray-500">{label}</div>
            <div className="text-lg font-semibold mt-2">{amount}</div>
        </div>
    );
}