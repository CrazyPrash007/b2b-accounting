export default function RevenueProjections({ data, period, onPeriodChange, loading }) {
    const formatAmount = (amount) => `₹${(amount || 0).toFixed(2)}`;

    const periodOptions = [
        { value: 'current-month', label: 'Current Month' },
        { value: 'last-month', label: 'Last Month' },
        { value: 'current-year', label: 'Current Year' },
        { value: 'all-time', label: 'All Time' }
    ];

    return (
        <div className={`relative ${loading ? 'opacity-70' : ''}`}>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 z-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                </div>
            )}
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-800">Revenue Projections</h3>

                <select
                    className="text-sm text-gray-500 border px-3 py-1 rounded-md"
                    value={period}
                    onChange={(e) => onPeriodChange(e.target.value)}
                >
                    {periodOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <ProjectionCard 
                    label="Total Receivable Amount" 
                    amount={formatAmount(data?.totalReceivable)} 
                />
                <ProjectionCard 
                    label="Total Payable Amount" 
                    amount={formatAmount(data?.totalPayable)} 
                />
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