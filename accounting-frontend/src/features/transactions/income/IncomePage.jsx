// IncomePage.jsx
import React, { useState, useEffect, useRef } from "react";

/**
 * IncomeModal - Modal for creating/editing income entries
 */
function IncomeModal({ isOpen, onClose, onSave, onDelete, editData }) {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        billName: "",
        incomeAmount: "",
        paymentMethod: "",
        category: "",
        uploadBill: null,
        uploadBillName: "",
        notes: "",
    });
    const [error, setError] = useState("");
    const fileInputRef = useRef(null);

    const isEditMode = !!editData;

    const categories = [
        "Sales Revenue",
        "Service Income",
        "Interest Income",
        "Rental Income",
        "Commission",
        "Consulting",
        "Investment Returns",
        "Refunds",
        "Other Income"
    ];

    const paymentMethods = [
        "Cash",
        "Bank Transfer",
        "Credit Card",
        "Debit Card",
        "UPI",
        "Cheque",
        "Other"
    ];

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setFormData({
                    date: editData.date || new Date().toISOString().split('T')[0],
                    billName: editData.billName || "",
                    incomeAmount: editData.incomeAmount || "",
                    paymentMethod: editData.paymentMethod || "",
                    category: editData.category || "",
                    uploadBill: editData.uploadBill || null,
                    uploadBillName: editData.uploadBillName || "",
                    notes: editData.notes || "",
                });
            } else {
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    billName: "",
                    incomeAmount: "",
                    paymentMethod: "",
                    category: "",
                    uploadBill: null,
                    uploadBillName: "",
                    notes: "",
                });
            }
            setError("");
        }
    }, [editData, isOpen]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (error) setError("");
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
            if (allowedTypes.includes(file.type)) {
                setFormData((prev) => ({
                    ...prev,
                    uploadBill: file,
                    uploadBillName: file.name,
                }));
            } else {
                setError("Please upload JPG, PNG, PDF or Excel files only");
            }
        }
    };

    const handleSave = () => {
        if (!formData.billName.trim()) {
            setError("Bill Name is required");
            return;
        }
        if (!formData.incomeAmount || parseFloat(formData.incomeAmount) <= 0) {
            setError("Valid Income Amount is required");
            return;
        }
        if (!formData.category) {
            setError("Category is required");
            return;
        }

        const incomeData = {
            id: isEditMode ? editData.id : String(Date.now()),
            ...formData,
            billName: formData.billName.trim(),
            incomeAmount: parseFloat(formData.incomeAmount),
            notes: formData.notes.trim(),
        };

        onSave(incomeData, isEditMode);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleSave();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-green-500 rounded"></div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {isEditMode ? "Edit Income" : "Basic Details"}
                        </h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">Date</span>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => handleChange("date", e.target.value)}
                            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-5 space-y-5" onKeyDown={handleKeyDown}>
                    {/* Bill Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 uppercase tracking-wide">
                            Bill Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.billName}
                            onChange={(e) => handleChange("billName", e.target.value)}
                            placeholder="Enter income source or bill name"
                            className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Income Amount & Payment Done */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 uppercase tracking-wide">
                                Income Amount <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 font-medium">₹</span>
                                <input
                                    type="number"
                                    value={formData.incomeAmount}
                                    onChange={(e) => handleChange("incomeAmount", e.target.value)}
                                    placeholder="0.00"
                                    className="w-full border border-gray-300 rounded pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 uppercase tracking-wide">
                                Payment Done
                            </label>
                            <select
                                value={formData.paymentMethod}
                                onChange={(e) => handleChange("paymentMethod", e.target.value)}
                                className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                                <option value="">Select Payment Method</option>
                                {paymentMethods.map((method) => (
                                    <option key={method} value={method}>{method}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Category & Upload Bill */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 uppercase tracking-wide">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => handleChange("category", e.target.value)}
                                className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                                <option value="">Select Category</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 uppercase tracking-wide">
                                Upload Bill
                            </label>
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={handleFileUpload}
                                    accept=".jpg,.jpeg,.png,.pdf,.xls,.xlsx"
                                    className="hidden"
                                />
                                {formData.uploadBillName ? (
                                    <div className="text-sm text-blue-600">{formData.uploadBillName}</div>
                                ) : (
                                    <>
                                        <div className="text-yellow-500 text-2xl mb-1">📁</div>
                                        <div className="text-xs font-medium text-gray-600">CLICK TO UPLOAD INCOME DOCUMENT OR RECEIPT</div>
                                        <div className="text-xs text-gray-400 mt-1">SUPPORTS: JPG, PNG, PDF, EXCEL FILES</div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 uppercase tracking-wide">
                            Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleChange("notes", e.target.value)}
                            placeholder="Add notes about this income... (Ctrl+Enter to submit)"
                            rows={3}
                            className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg sticky bottom-0">
                    {isEditMode ? (
                        <button
                            type="button"
                            onClick={() => onDelete && onDelete(editData.id)}
                            className="px-4 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 transition-colors"
                        >
                            Delete
                        </button>
                    ) : (
                        <div></div>
                    )}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                            {isEditMode ? "Update" : "Save Income"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * IncomePage
 * - Frontend-only income management
 * - Excel-like table with row highlighting and cell selection
 */
export default function IncomePage() {
    const [incomes, setIncomes] = useState([]);
    const [selectedCell, setSelectedCell] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState(null);

    const handleOpenCreate = () => {
        setEditingIncome(null);
        setIsModalOpen(true);
    };

    const handleEditIncome = (income) => {
        setEditingIncome(income);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingIncome(null);
    };

    const handleSaveIncome = (incomeData, isEdit) => {
        if (isEdit) {
            setIncomes((prev) =>
                prev.map((inc) =>
                    inc.id === incomeData.id ? incomeData : inc
                )
            );
        } else {
            setIncomes((prev) => [...prev, incomeData]);
        }
        setIsModalOpen(false);
        setEditingIncome(null);
    };

    const handleDeleteIncome = (id) => {
        if (window.confirm("Are you sure you want to delete this income entry?")) {
            setIncomes((prev) => prev.filter((inc) => inc.id !== id));
            setIsModalOpen(false);
            setEditingIncome(null);
        }
    };

    const handleCellClick = (rowIndex, colIndex) => {
        setSelectedCell({ rowIndex, colIndex });
    };

    const handleTableContainerClick = (e) => {
        if (e.target === e.currentTarget) {
            setSelectedCell(null);
        }
    };

    const TOTAL_ROWS = 15;
    const tableContainerRef = useRef(null);
    const [visibleRows, setVisibleRows] = useState(TOTAL_ROWS);

    useEffect(() => {
        const calculateRows = () => {
            if (tableContainerRef.current) {
                const containerHeight = tableContainerRef.current.clientHeight;
                const rowHeight = 32;
                const headerHeight = 36;
                const availableHeight = containerHeight - headerHeight;
                const rows = Math.floor(availableHeight / rowHeight);
                setVisibleRows(Math.max(rows, 1));
            }
        };

        calculateRows();
        window.addEventListener('resize', calculateRows);
        return () => window.removeEventListener('resize', calculateRows);
    }, []);

    const emptyRowsCount = Math.max(0, visibleRows - incomes.length);
    const emptyRows = Array.from({ length: emptyRowsCount }, (_, i) => i);

    const totalRecords = incomes.length;
    const startRecord = totalRecords > 0 ? 1 : 0;
    const endRecord = totalRecords;

    const isCellSelected = (rowIndex, colIndex) => {
        return selectedCell?.rowIndex === rowIndex && selectedCell?.colIndex === colIndex;
    };

    const getCellClasses = (rowIndex, colIndex) => {
        const baseClasses = "h-8 px-4 border-r border-gray-400 cursor-cell";
        const selectedClasses = isCellSelected(rowIndex, colIndex)
            ? "outline outline-2 outline-blue-500 outline-offset-[-2px] bg-blue-50"
            : "";
        return `${baseClasses} ${selectedClasses}`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header Row */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">Income</h2>
                    <button className="text-gray-400 hover:text-yellow-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </button>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Income
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-gray-100">
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </button>
                <div className="w-px h-5 bg-gray-300 mx-1"></div>
                <button className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    More Filter
                </button>
            </div>

            {/* Table Container - Scrollable */}
            <div
                ref={tableContainerRef}
                className="flex-1 overflow-auto px-4 pb-1"
                onClick={handleTableContainerClick}
            >
                <div className="border border-gray-400 rounded overflow-hidden h-full">
                    <table className="w-full border-collapse text-sm" style={{ borderSpacing: 0 }}>
                        <thead className="sticky top-0 z-10 bg-white">
                            <tr className="border-b border-gray-400">
                                <th className="w-[12%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Date</span>
                                    </div>
                                </th>
                                <th className="w-[22%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Bill Name</span>
                                    </div>
                                </th>
                                <th className="w-[15%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Amount</span>
                                    </div>
                                </th>
                                <th className="w-[15%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Category</span>
                                    </div>
                                </th>
                                <th className="w-[15%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Payment Method</span>
                                    </div>
                                </th>
                                <th className="w-[11%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Bill</span>
                                    </div>
                                </th>
                                <th className="w-[10%] h-9 px-4 text-left text-sm font-medium text-gray-700">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Data rows */}
                            {incomes.map((income, rowIndex) => (
                                <tr
                                    key={income.id}
                                    className={`border-b border-gray-400 hover:bg-blue-100 transition-colors ${rowIndex % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'}`}
                                >
                                    <td
                                        className={getCellClasses(rowIndex, 0) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 0)}
                                    >
                                        {formatDate(income.date)}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 1) + " text-left text-blue-600"}
                                        onClick={() => handleCellClick(rowIndex, 1)}
                                    >
                                        {income.billName}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 2) + " text-left text-green-600 font-medium"}
                                        onClick={() => handleCellClick(rowIndex, 2)}
                                    >
                                        {formatCurrency(income.incomeAmount)}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 3) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 3)}
                                    >
                                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">
                                            {income.category}
                                        </span>
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 4) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 4)}
                                    >
                                        {income.paymentMethod || "-"}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 5) + " text-left"}
                                        onClick={() => handleCellClick(rowIndex, 5)}
                                    >
                                        {income.uploadBillName ? (
                                            <span className="text-blue-600 text-xs">📄 Attached</span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="h-8 px-4 text-left">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEditIncome(income)}
                                                className="text-blue-600 hover:underline text-sm"
                                            >
                                                Edit
                                            </button>
                                            <button className="text-gray-400 hover:text-gray-600">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {/* Empty rows to fill the display */}
                            {emptyRows.map((_, idx) => {
                                const rowIndex = incomes.length + idx;
                                return (
                                    <tr
                                        key={`empty-${idx}`}
                                        className={`border-b border-gray-400 hover:bg-blue-100 transition-colors ${rowIndex % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'}`}
                                    >
                                        <td className={getCellClasses(rowIndex, 0)} onClick={() => handleCellClick(rowIndex, 0)}></td>
                                        <td className={getCellClasses(rowIndex, 1)} onClick={() => handleCellClick(rowIndex, 1)}></td>
                                        <td className={getCellClasses(rowIndex, 2)} onClick={() => handleCellClick(rowIndex, 2)}></td>
                                        <td className={getCellClasses(rowIndex, 3)} onClick={() => handleCellClick(rowIndex, 3)}></td>
                                        <td className={getCellClasses(rowIndex, 4)} onClick={() => handleCellClick(rowIndex, 4)}></td>
                                        <td className={getCellClasses(rowIndex, 5)} onClick={() => handleCellClick(rowIndex, 5)}></td>
                                        <td className="h-8 px-4"></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="px-4 py-2 border-t border-gray-200 text-sm text-blue-600 bg-white">
                {totalRecords > 0 ? `${startRecord}-${endRecord} of ${totalRecords} Records` : '0 Records'}
            </div>

            {/* Income Modal */}
            <IncomeModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveIncome}
                onDelete={handleDeleteIncome}
                editData={editingIncome}
            />
        </div>
    );
}
