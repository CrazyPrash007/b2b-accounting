// ItemMovementModal.jsx - Item history view (matches Party History layout)
import React, { useState, useEffect, useContext } from "react";
import { CompanyContext } from "src/App";
import apiClient from "src/services/apiClient";

/**
 * ItemMovementModal - Display item purchase/sales movement history
 * Behaves like PartyHistoryPage - occupies only the table/content area
 * Sidebar and topbar remain visible
 */
export default function ItemMovementModal({ isOpen, onClose, item }) {
    const context = useContext(CompanyContext);
    const selectedCompany = context?.selectedCompany || "";

    const [movements, setMovements] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("all");
    
    // Date filters - view-level only, doesn't mutate base data
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [allMovements, setAllMovements] = useState([]); // Store all movements for filtering

    useEffect(() => {
        if (isOpen && item && selectedCompany) {
            fetchData();
        }
        
        async function fetchData() {
            setLoading(true);
            setError(null);
            
            try {
                const params = {
                    accountCompanyName: selectedCompany
                };
                
                const response = await apiClient.get(`/api/items/${item.id || item._id}/movement`, {
                    params
                });

                if (response?.data?.success && response.data.data) {
                    const fetchedMovements = response.data.data.movements || [];
                    setAllMovements(fetchedMovements);
                    setMovements(fetchedMovements);
                    setSummary(response.data.data.summary || {});
                }
            } catch (err) {
                console.error("Failed to fetch movement history:", err);
                setError(err?.response?.data?.error?.message || "Failed to load movement history");
            } finally {
                setLoading(false);
            }
        }
    }, [isOpen, item, selectedCompany]);

    // Apply date filter as view-level operation (doesn't mutate base data)
    useEffect(() => {
        if (!fromDate && !toDate) {
            setMovements(allMovements);
            return;
        }
        
        const filtered = allMovements.filter(m => {
            const movementDate = new Date(m.date);
            if (fromDate && toDate) {
                const from = new Date(fromDate);
                const to = new Date(toDate);
                to.setHours(23, 59, 59, 999);
                return movementDate >= from && movementDate <= to;
            } else if (fromDate) {
                return movementDate >= new Date(fromDate);
            } else if (toDate) {
                const to = new Date(toDate);
                to.setHours(23, 59, 59, 999);
                return movementDate <= to;
            }
            return true;
        });
        setMovements(filtered);
    }, [fromDate, toDate, allMovements]);

    // handleApplyFilter - Filter is auto-applied via useEffect on date change
    const handleApplyFilter = () => {
        // Explicitly re-apply filter (for button click feedback)
        if (!fromDate && !toDate) {
            setMovements(allMovements);
            return;
        }
        const filtered = allMovements.filter(m => {
            const movementDate = new Date(m.date);
            if (fromDate && toDate) {
                const from = new Date(fromDate);
                const to = new Date(toDate);
                to.setHours(23, 59, 59, 999);
                return movementDate >= from && movementDate <= to;
            } else if (fromDate) {
                return movementDate >= new Date(fromDate);
            } else if (toDate) {
                const to = new Date(toDate);
                to.setHours(23, 59, 59, 999);
                return movementDate <= to;
            }
            return true;
        });
        setMovements(filtered);
    };

    const handleClearFilter = () => {
        setFromDate("");
        setToDate("");
        setMovements(allMovements);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return "-";
        return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    // Filter movements based on active tab
    const filteredMovements = activeTab === 'all' 
        ? movements 
        : movements.filter(m => m.type === activeTab);

    const purchaseCount = movements.filter(m => m.type === 'purchase').length;
    const saleCount = movements.filter(m => m.type === 'sale').length;

    if (!isOpen) return null;

    const itemName = item?.name || item?.itemName || "Unknown Item";

    // Render in content area only - sidebar and topbar remain visible
    // This matches PartyHistoryPage behavior
    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">{itemName}</h1>
                            <p className="text-sm text-gray-500">Item Movement History</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {item?.hsnNo && (
                            <span className="text-sm text-gray-600">
                                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                </svg>
                                HSN: {item.hsnNo}
                            </span>
                        )}
                        {item?.category && (
                            <span className="text-sm text-gray-600">
                                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                {item.category}
                            </span>
                        )}
                        {item?.unit && (
                            <span className="text-sm text-gray-600">
                                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                </svg>
                                Unit: {item.unit}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Opening Stock</p>
                        <p className="text-xl font-semibold text-blue-700">{summary.openingStock || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">Initial quantity</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Total Purchased</p>
                        <p className="text-xl font-semibold text-green-700">{summary.totalPurchased || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">{purchaseCount} transactions</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Total Sold</p>
                        <p className="text-xl font-semibold text-orange-700">{summary.totalSold || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">{saleCount} transactions</p>
                    </div>
                    <div className={`rounded-lg p-4 border border-gray-200 shadow-sm ${summary.currentStock < 0 ? 'bg-red-50' : 'bg-white'}`}>
                        <p className="text-sm text-gray-500 mb-1">Current Stock</p>
                        <p className={`text-xl font-semibold ${summary.currentStock < 0 ? 'text-red-700' : 'text-purple-700'}`}>
                            {summary.currentStock != null ? summary.currentStock.toFixed(2) : 0}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {summary.currentStock < 0 ? 'Negative stock!' : 'Available'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="px-6 py-3 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2 mt-5">
                        <button
                            onClick={handleApplyFilter}
                            className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                        >
                            Apply Filter
                        </button>
                        <button
                            onClick={handleClearFilter}
                            className="px-4 py-1.5 bg-gray-500 text-white text-sm font-medium rounded hover:bg-gray-600 transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-gray-200">
                <div className="flex gap-1">
                    {[
                        { key: 'all', label: 'All Movements', count: movements.length },
                        { key: 'purchase', label: 'Purchases', count: purchaseCount },
                        { key: 'sale', label: 'Sales', count: saleCount },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                                    ? 'text-blue-600 border-blue-600'
                                    : 'text-gray-500 border-transparent hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Movement Table */}
            <div className="flex-1 overflow-auto px-6 py-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-red-500">{error}</div>
                    </div>
                ) : filteredMovements.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500">
                            {movements.length === 0 ? 'No movement history found' : `No ${activeTab} transactions found`}
                        </div>
                    </div>
                ) : (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Invoice No</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Party</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Quantity</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Rate</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredMovements.map((movement, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            {formatDate(movement.date)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${movement.type === 'purchase' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                {movement.type === 'purchase' ? 'Purchase' : 'Sale'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                            {movement.invoiceNumber || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            {movement.supplier || movement.customer || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-700">
                                            {movement.quantity || 0}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-700">
                                            {formatCurrency(movement.rate)}
                                        </td>
                                        <td className={`px-4 py-3 text-sm text-right font-medium ${movement.type === 'purchase' ? 'text-green-600' : 'text-orange-600'
                                            }`}>
                                            {formatCurrency(movement.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
