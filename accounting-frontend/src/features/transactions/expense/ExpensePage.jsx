// ExpensePage.jsx
import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useExpense from "./hooks/useExpense";
import { exportTableToExcel } from "../../../utils/excelExport";
import expenseApi from "./api/expense.api";
import { CompanyContext } from "src/App";
import { authFetch } from "../../../services/apiClient";

/**
 * ExpenseModal - Modal for creating/editing expenses
 */
function ExpenseModal({ isOpen, onClose, onSave, onDelete, editData }) {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        billName: "",
        expenseAmount: "",
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
        "Office Supplies",
        "Travel",
        "Utilities",
        "Rent",
        "Salaries",
        "Marketing",
        "Insurance",
        "Maintenance",
        "Professional Services",
        "Other"
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
                    expenseAmount: editData.expenseAmount || "",
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
                    expenseAmount: "",
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
        if (!formData.expenseAmount || parseFloat(formData.expenseAmount) <= 0) {
            setError("Valid Expense Amount is required");
            return;
        }
        if (!formData.category) {
            setError("Category is required");
            return;
        }

        const expenseData = {
            id: isEditMode ? editData.id : String(Date.now()),
            ...formData,
            billName: formData.billName.trim(),
            expenseAmount: parseFloat(formData.expenseAmount),
            notes: formData.notes.trim(),
        };

        onSave(expenseData, isEditMode);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Handle Enter key to move to next input
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleSave();
            return;
        }
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const form = e.target.closest('[data-form-container]');
            if (!form) return;

            const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
            const currentIndex = inputs.indexOf(e.target);

            if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
                inputs[currentIndex + 1].focus();
            }
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 rounded-t-lg shrink-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <h3 className="text-lg font-semibold text-white">
                        {isEditMode ? "Edit Expense" : "New Expense"}
                    </h3>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-white/80">Date</span>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => handleChange("date", e.target.value)}
                            className="border border-white/30 bg-white/20 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/50"
                        />
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors ml-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1" data-form-container onKeyDown={handleKeyDown}>
                    {/* Bill Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 uppercase tracking-wide">
                            Bill Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.billName}
                            onChange={(e) => handleChange("billName", e.target.value)}
                            placeholder="Enter bill or expense name"
                            className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                        />
                    </div>

                    {/* Expense Amount & Payment Done */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 uppercase tracking-wide">
                                Expense Amount <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 font-medium">₹</span>
                                <input
                                    type="number"
                                    value={formData.expenseAmount}
                                    onChange={(e) => handleChange("expenseAmount", e.target.value)}
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
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => handleChange("category", e.target.value)}
                                placeholder="Enter category"
                                className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
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
                                        <div className="text-xs font-medium text-gray-600">CLICK TO UPLOAD BILL OR RECEIPT</div>
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
                            placeholder="Add notes about this expense... (Ctrl+Enter to submit)"
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
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            {isEditMode ? "Update" : "Save Expense"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * ExpensePage
 * - Frontend-only expense management
 * - Excel-like table with row highlighting and cell selection
 */
export default function ExpensePage() {
    // server-backed hook (assumes returns { rows, loading, error, reload, create, update, remove })
    const { rows: hookRows = [], loading, error, reload, create, update, remove } = useExpense({ useLocalFallback: true });

    // keep same local variable name used by UI for minimal changes
    const expenses = hookRows || [];

    const [selectedCell, setSelectedCell] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    const handleOpenCreate = () => {
        setEditingExpense(null);
        setIsModalOpen(true);
    };

    const handleEditExpense = (expense) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingExpense(null);
    };

    const { selectedCompany } = useContext(CompanyContext); // ADD THIS AT TOP

    const handleSaveExpense = async (expenseData, isEdit) => {
        try {
            const fd = new FormData();

            // REQUIRED: company scope
            fd.append("accountCompanyName", selectedCompany);

            // Basic fields
            fd.append("billName", expenseData.billName.trim());
            fd.append("expenseAmount", String(Number(expenseData.expenseAmount)));
            fd.append("category", expenseData.category);
            fd.append("paymentMethod", expenseData.paymentMethod || "");
            fd.append("notes", expenseData.notes || "");

            // Date
            if (expenseData.date) {
                fd.append("date", new Date(expenseData.date).toISOString());
            }

            // IMPORTANT: backend expects "receipt" (same as income)
            if (expenseData.uploadBill instanceof File) {
                fd.append("receipt", expenseData.uploadBill, expenseData.uploadBill.name);
            }

            // CREATE vs UPDATE
            if (isEdit) {
                await expenseApi.update(expenseData._id ?? expenseData.id, fd);
            } else {
                await expenseApi.create(fd);
            }

            // reload after save
            await reload();
            setIsModalOpen(false);
            setEditingExpense(null);

        } catch (err) {
            console.error("Failed to save expense", err);
            alert(err?.message || "Failed to save expense");
        }
    };


    const handleDeleteExpense = async (id) => {
        if (!window.confirm("Are you sure you want to delete this expense entry?")) return;
        try {
            await remove(id);
            setIsModalOpen(false);
            setEditingExpense(null);
            await reload();
        } catch (err) {
            console.error("Failed to delete expense:", err);
            alert(err?.message || "Failed to delete");
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

    const handleExportToExcel = () => {
        const columns = [
            { header: 'Date', key: 'date' },
            { header: 'Bill Name', key: 'billName' },
            { header: 'Amount', key: 'amount' },
            { header: 'Category', key: 'category' },
            { header: 'Payment Method', key: 'paymentMethod' },
            { header: 'Description', key: 'description' },
        ];
        
        const exportData = expenses.map(expense => ({
            date: formatDate(expense.date),
            billName: expense.billName || '-',
            amount: expense.amount || 0,
            category: expense.category || '-',
            paymentMethod: expense.paymentMethod || '-',
            description: expense.description || '-',
        }));
        
        exportTableToExcel(exportData, columns, 'Expense_Report', 'Expense');
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

    const emptyRowsCount = Math.max(0, visibleRows - expenses.length);
    const emptyRows = Array.from({ length: emptyRowsCount }, (_, i) => i);

    const totalRecords = expenses.length;
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
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatCurrency = (amount) => {
        if (amount == null || amount === "") return "₹0.00";
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(Number(amount));
    };

    // Download receipt helper: uses route GET /api/expense/:id/receipt (controller you created)
    const handleDownloadReceipt = async (expense) => {
        try {
            const id = expense._id ?? expense.id;
            if (!id) throw new Error("Invalid expense id");
            const backendBase = "http://localhost:4000";

            const res = await authFetch(`${backendBase}/api/expense/${id}/receipt`, {
                method: 'GET',
            });

            if (!res.ok) {
                let msg = `Failed to download receipt (${res.status})`;
                try {
                    const j = await res.json();
                    if (j && j.error && j.error.message) msg = j.error.message;
                } catch (e) {
                    // ignore parse errors
                }
                throw new Error(msg);
            }
            const contentDisposition = res.headers.get('content-disposition') || '';

            const filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
                || contentDisposition.match(/filename="?([^";]+)"?/i);
            let filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : (
                (expense.receipt && expense.receipt.fileName) ||
                expense.uploadBillName ||
                `receipt-${id}`
            );

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed", err);
            alert(err?.message || "Download failed");
        }
    };


    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header Row */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">Expenses</h2>
                    <button className="text-gray-400 hover:text-yellow-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </button>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Expense
                </button>
            </div>

            {/* Toolbar - Icons commented out as per requirement */}
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
                {/* <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
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
                </button> */}
            </div>

            {/* Table Container - Scrollable */}
            <div
                ref={tableContainerRef}
                className="flex-1 overflow-auto px-4 pb-1"
                onClick={handleTableContainerClick}
            >
                <div className="border border-gray-400 rounded overflow-hidden h-full">
                    <div className="overflow-x-auto h-full">
                        <table className="min-w-[1000px] w-full border-collapse text-sm" style={{ borderSpacing: 0 }}>
                            <thead className="sticky top-0 z-10 bg-white">
                                <tr className="border-b border-gray-400">
                                    <th className="min-w-[110px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                            <span>Date</span>
                                        </div>
                                    </th>
                                    <th className="min-w-[180px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                            <span>Bill Name</span>
                                        </div>
                                    </th>
                                    <th className="min-w-[130px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                            <span>Amount</span>
                                        </div>
                                    </th>
                                    <th className="min-w-[130px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                            <span>Category</span>
                                        </div>
                                    </th>
                                    <th className="min-w-[140px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                            <span>Payment Method</span>
                                        </div>
                                    </th>
                                    <th className="min-w-[100px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                            <span>Bill</span>
                                        </div>
                                    </th>
                                    <th className="min-w-[100px] h-9 px-4 text-left text-sm font-medium text-gray-700 sticky right-0 z-20 bg-gray-100 border-l border-gray-400" style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.15)' }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Data rows */}
                                {expenses.map((expense, rowIndex) => (
                                    <tr
                                        key={expense._id ?? expense.id}
                                        className={`border-b border-gray-400 hover:bg-blue-100 transition-colors ${rowIndex % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'}`}
                                    >
                                        <td
                                            className={getCellClasses(rowIndex, 0) + " text-left text-gray-600"}
                                            onClick={() => handleCellClick(rowIndex, 0)}
                                        >
                                            {formatDate(expense.date ?? expense.createdAt)}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 1) + " text-left text-blue-600"}
                                            onClick={() => handleCellClick(rowIndex, 1)}
                                        >
                                            {expense.billName}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 2) + " text-left text-green-600 font-medium"}
                                            onClick={() => handleCellClick(rowIndex, 2)}
                                        >
                                            {formatCurrency(expense.expenseAmount)}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 3) + " text-left text-gray-600"}
                                            onClick={() => handleCellClick(rowIndex, 3)}
                                        >
                                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">
                                                {expense.category || '-'}
                                            </span>
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 4) + " text-left text-gray-600"}
                                            onClick={() => handleCellClick(rowIndex, 4)}
                                        >
                                            {expense.paymentMethod || "-"}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 5) + " text-left"}
                                            onClick={() => handleCellClick(rowIndex, 5)}
                                        >
                                            {(expense.receipt && expense.receipt.fileName) || expense.uploadBillName ? (
                                                <button onClick={() => handleDownloadReceipt(expense)} className="text-blue-600 text-xs">📄 Attached</button>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className={`h-8 px-4 text-left sticky right-0 z-10 border-l border-gray-400 ${rowIndex % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`} style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.1)' }}>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditExpense(expense)}
                                                    className="text-blue-600 hover:underline text-sm"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteExpense(expense._id ?? expense.id)}
                                                    className="text-red-500 hover:underline text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {/* Empty rows to fill the display */}
                                {emptyRows.map((_, idx) => {
                                    const rowIndex = expenses.length + idx;
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
                                            <td className={`h-8 px-4 sticky right-0 z-10 border-l border-gray-400 ${rowIndex % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`} style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.1)' }}></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="px-4 py-2 border-t border-gray-200 text-sm text-blue-600 bg-white">
                {totalRecords > 0 ? `${startRecord}-${endRecord} of ${totalRecords} Records` : '0 Records'}
            </div>

            {/* Expense Modal */}
            <ExpenseModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveExpense}
                onDelete={handleDeleteExpense}
                editData={editingExpense}
            />
        </div>
    );
}
