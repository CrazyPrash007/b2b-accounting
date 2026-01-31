// ContraPage.jsx - Fund Transfer between Cash/Bank Accounts
import React, { useState, useEffect, useRef, useContext } from "react";
import { CompanyContext } from "src/App";
import { exportTableToExcel } from "../../../utils/excelExport";
import { authFetch, API_BASE_URL } from "../../../services/apiClient";

const API_BASE = API_BASE_URL;

/**
 * ContraModal - Modal for creating contra entries (fund transfers)
 */
function ContraModal({ isOpen, onClose, onSave, editData }) {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        fromAccount: "",
        toAccount: "",
        amount: "",
        description: "",
    });
    const [error, setError] = useState("");
    const [bankAccounts, setBankAccounts] = useState([]);
    const { selectedCompany } = useContext(CompanyContext);

    const isEditMode = !!editData;

    // Cash accounts + bank accounts - all available accounts (no Petty Cash)
    const allAccounts = [
        "Cash-in-Hand",
        ...bankAccounts.map(b => {
            const displayName = b.accountDisplayName || b.bankName || "";
            const accNum = b.accountNumber ? ` (${b.accountNumber.slice(-4)})` : "";
            return displayName + accNum;
        }).filter(name => name.trim() !== "")
    ];

    // Filter accounts for From dropdown - exclude the one selected in To
    const fromAccountOptions = allAccounts.filter(acc => acc !== formData.toAccount);
    
    // Filter accounts for To dropdown - exclude the one selected in From
    const toAccountOptions = allAccounts.filter(acc => acc !== formData.fromAccount);

    useEffect(() => {
        if (isOpen) {
            fetchBankAccounts();
            if (editData) {
                setFormData({
                    date: editData.date || new Date().toISOString().split('T')[0],
                    fromAccount: editData.fromAccount || "",
                    toAccount: editData.toAccount || "",
                    amount: editData.amount || "",
                    description: editData.description || "",
                });
            } else {
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    fromAccount: "",
                    toAccount: "",
                    amount: "",
                    description: "",
                });
            }
            setError("");
        }
    }, [editData, isOpen]);

    const fetchBankAccounts = async () => {
        try {
            const response = await authFetch(`${API_BASE}/api/bank?accountCompanyName=${selectedCompany}`);
            const data = await response.json();
            // Bank API returns { success: true, data: [...], meta: {...} }
            const banks = data?.data || (Array.isArray(data) ? data : []);
            setBankAccounts(banks);
        } catch (err) {
            console.error("Failed to fetch bank accounts:", err);
            setBankAccounts([]);
        }
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (error) setError("");
    };

    const handleSave = () => {
        if (!formData.fromAccount.trim()) {
            setError("From Account is required");
            return;
        }
        if (!formData.toAccount.trim()) {
            setError("To Account is required");
            return;
        }
        if (formData.fromAccount === formData.toAccount) {
            setError("From and To accounts cannot be the same");
            return;
        }
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            setError("Valid amount is required");
            return;
        }

        const contraData = {
            ...formData,
            amount: parseFloat(formData.amount)
        };

        if (isEditMode) {
            contraData.id = editData.id || editData._id;
        }

        onSave(contraData, isEditMode);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-t-lg flex items-center justify-between sticky top-0 z-10">
                    <h3 className="text-lg font-semibold text-white">
                        {isEditMode ? "Edit Contra Entry" : "New Contra Entry"}
                    </h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => handleChange("date", e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                From Account<span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.fromAccount}
                                onChange={(e) => handleChange("fromAccount", e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">Select Account</option>
                                {fromAccountOptions.map((acc, idx) => (
                                    <option key={idx} value={acc}>{acc}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                To Account<span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.toAccount}
                                onChange={(e) => handleChange("toAccount", e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">Select Account</option>
                                {toAccountOptions.map((acc, idx) => (
                                    <option key={idx} value={acc}>{acc}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount<span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => handleChange("amount", e.target.value)}
                            placeholder="Enter amount"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            rows={3}
                            placeholder="Enter description (optional)"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3 sticky bottom-0">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors text-sm font-medium">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium">
                        {isEditMode ? "Update" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * ContraPage - Contra Entry Management Page
 */
export default function ContraPage() {
    const { selectedCompany } = useContext(CompanyContext);
    const [contraEntries, setContraEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);

    const tableContainerRef = useRef(null);
    const [visibleRows, setVisibleRows] = useState(20);

    useEffect(() => {
        fetchContraEntries();
    }, [selectedCompany]);

    const fetchContraEntries = async () => {
        setLoading(true);
        try {
            const response = await authFetch(`${API_BASE}/api/contra?accountCompanyName=${selectedCompany}`);
            const data = await response.json();
            setContraEntries(Array.isArray(data) ? data : (data?.data || []));
        } catch (err) {
            console.error("Failed to fetch contra entries:", err);
            setContraEntries([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEntry = () => {
        setEditingEntry(null);
        setIsModalOpen(true);
    };

    const handleEditEntry = (entry) => {
        setEditingEntry(entry);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEntry(null);
    };

    const handleSaveEntry = async (entryData, isEdit) => {
        try {
            const payload = {
                ...entryData,
                accountCompanyName: selectedCompany,
                type: "Contra Entry"
            };

            if (isEdit) {
                await authFetch(`${API_BASE}/api/contra/${entryData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                await authFetch(`${API_BASE}/api/contra`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            await fetchContraEntries();
            setIsModalOpen(false);
            setEditingEntry(null);
        } catch (err) {
            console.error("Failed to save contra entry:", err);
            alert(err?.message || "Failed to save contra entry");
        }
    };

    const handleDeleteEntry = async (id) => {
        if (!window.confirm("Are you sure you want to delete this contra entry?")) return;
        try {
            await authFetch(`${API_BASE}/api/contra/${id}`, { method: 'DELETE' });
            await fetchContraEntries();
        } catch (err) {
            console.error("Failed to delete entry:", err);
            alert(err?.message || "Failed to delete contra entry");
        }
    };

    const handleExportToExcel = () => {
        const columns = [
            { header: 'Date', key: 'date' },
            { header: 'From Account', key: 'fromAccount' },
            { header: 'To Account', key: 'toAccount' },
            { header: 'Amount', key: 'amount' },
            { header: 'Description', key: 'description' },
        ];

        const exportData = contraEntries.map(entry => ({
            date: entry.date || '-',
            fromAccount: entry.fromAccount || '-',
            toAccount: entry.toAccount || '-',
            amount: entry.amount ? `₹${entry.amount}` : '-',
            description: entry.description || '-',
        }));

        exportTableToExcel(exportData, columns, 'Contra_Entries', 'Contra Entries');
    };

    useEffect(() => {
        const calculateRows = () => {
            if (tableContainerRef.current) {
                const containerHeight = tableContainerRef.current.clientHeight;
                const headerHeight = 36;
                const rowHeight = 32;
                const rows = Math.floor((containerHeight - headerHeight) / rowHeight);
                setVisibleRows(Math.max(rows, 1));
            }
        };

        calculateRows();
        window.addEventListener('resize', calculateRows);
        return () => window.removeEventListener('resize', calculateRows);
    }, []);

    const emptyRowsCount = Math.max(0, visibleRows - contraEntries.length);
    const emptyRows = Array.from({ length: emptyRowsCount }, (_, i) => i);

    const totalRecords = contraEntries.length;
    const startRecord = totalRecords > 0 ? 1 : 0;
    const endRecord = totalRecords;

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header Row */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">Contra Entry</h2>
                    <button className="text-gray-400 hover:text-yellow-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </button>
                </div>
                <button
                    onClick={handleCreateEntry}
                    className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Contra Entry
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-gray-100">
                <button 
                    onClick={handleExportToExcel}
                    className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded text-sm"
                    title="Export to Excel"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export to Excel
                </button>
            </div>

            {/* Table Container */}
            <div ref={tableContainerRef} className="flex-1 overflow-auto px-4 pb-1">
                <div className="border border-gray-400 rounded overflow-hidden h-full">
                    <div className="overflow-x-auto h-full">
                        <table className="min-w-full w-full border-collapse text-sm" style={{ borderSpacing: 0 }}>
                            <thead className="sticky top-0 z-20 bg-gray-100">
                                <tr className="border-b border-gray-400">
                                    <th className="min-w-[120px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">Date</th>
                                    <th className="min-w-[200px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">From Account</th>
                                    <th className="min-w-[200px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">To Account</th>
                                    <th className="min-w-[120px] h-9 px-4 text-right text-sm font-medium text-gray-700 border-r border-gray-400">Amount</th>
                                    <th className="min-w-[250px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">Description</th>
                                    <th className="min-w-[120px] h-9 px-4 text-left text-sm font-medium text-gray-700 sticky right-0 z-20 bg-gray-100 border-l border-gray-400" style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.15)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contraEntries.map((entry, rowIndex) => (
                                    <tr
                                        key={entry.id || entry._id || rowIndex}
                                        className={`border-b border-gray-400 hover:bg-blue-100 transition-colors ${rowIndex % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'}`}
                                    >
                                        <td className="h-8 px-4 border-r border-gray-400 text-gray-600">{entry.date || "-"}</td>
                                        <td className="h-8 px-4 border-r border-gray-400 text-gray-600">{entry.fromAccount || "-"}</td>
                                        <td className="h-8 px-4 border-r border-gray-400 text-gray-600">{entry.toAccount || "-"}</td>
                                        <td className="h-8 px-4 border-r border-gray-400 text-right text-gray-600">
                                            {entry.amount ? `₹${Number(entry.amount).toFixed(2)}` : "-"}
                                        </td>
                                        <td className="h-8 px-4 border-r border-gray-400 text-gray-600">{entry.description || "-"}</td>
                                        <td className={`h-8 px-4 text-left sticky right-0 z-10 border-l border-gray-400 ${rowIndex % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`} style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.1)' }}>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditEntry(entry)}
                                                    className="text-blue-600 hover:underline text-sm"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEntry(entry.id || entry._id)}
                                                    className="text-red-600 hover:underline text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {/* Empty rows to fill the display */}
                                {emptyRows.map((_, idx) => {
                                    const rowIndex = contraEntries.length + idx;
                                    return (
                                        <tr
                                            key={`empty-${idx}`}
                                            className={`border-b border-gray-400 hover:bg-blue-100 transition-colors ${rowIndex % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'}`}
                                        >
                                            <td className="h-8 px-4 border-r border-gray-400"></td>
                                            <td className="h-8 px-4 border-r border-gray-400"></td>
                                            <td className="h-8 px-4 border-r border-gray-400"></td>
                                            <td className="h-8 px-4 border-r border-gray-400"></td>
                                            <td className="h-8 px-4 border-r border-gray-400"></td>
                                            <td className={`h-8 px-4 sticky right-0 z-10 border-l border-gray-400 ${rowIndex % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`} style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.1)' }}></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-200 text-sm text-blue-600 bg-white">
                {totalRecords > 0 ? `${startRecord}-${endRecord} of ${totalRecords} Records` : '0 Records'}
            </div>

            {/* Contra Modal */}
            <ContraModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveEntry}
                editData={editingEntry}
            />
        </div>
    );
}
