// BankPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useBank from "./hooks/useBank";

/**
 * BankModal - Compact centered modal for creating/editing a bank account
 */
function BankModal({ isOpen, onClose, onSave, onDelete, editData }) {
    const [formData, setFormData] = useState({
        accountDisplayName: "",
        shortAliasName: "",
        emailAddress: "",
        phoneNo: "",
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        bankName: "",
        openingBalance: "",
        openingBalanceType: "Credit",
        status: "Active",
    });
    const [error, setError] = useState("");

    const isEditMode = !!editData;

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setFormData({
                    accountDisplayName: editData.accountDisplayName || "",
                    shortAliasName: editData.shortAliasName || "",
                    emailAddress: editData.emailAddress || "",
                    phoneNo: editData.phoneNo || "",
                    accountHolderName: editData.accountHolderName || "",
                    accountNumber: editData.accountNumber || "",
                    ifscCode: editData.ifscCode || "",
                    bankName: editData.bankName || "",
                    openingBalance: editData.openingBalance || "",
                    openingBalanceType: editData.openingBalanceType || "Credit",
                    status: editData.status || "Active",
                });
            } else {
                setFormData({
                    accountDisplayName: "",
                    shortAliasName: "",
                    emailAddress: "",
                    phoneNo: "",
                    accountHolderName: "",
                    accountNumber: "",
                    ifscCode: "",
                    bankName: "",
                    openingBalance: "",
                    openingBalanceType: "Credit",
                    status: "Active",
                });
            }
            setError("");
        }
    }, [editData, isOpen]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (error) setError("");
    };

    const handleSave = () => {
        if (!formData.accountDisplayName.trim()) {
            setError("Account Display Name is required");
            return;
        }
        if (!formData.accountNumber.trim()) {
            setError("Account Number is required");
            return;
        }
        if (!formData.bankName.trim()) {
            setError("Bank Name is required");
            return;
        }

        const bankData = {
            id: isEditMode ? editData.id : String(Date.now()),
            ...formData,
            accountDisplayName: formData.accountDisplayName.trim(),
            shortAliasName: formData.shortAliasName.trim(),
            emailAddress: formData.emailAddress.trim(),
            phoneNo: formData.phoneNo.trim(),
            accountHolderName: formData.accountHolderName.trim(),
            accountNumber: formData.accountNumber.trim(),
            ifscCode: formData.ifscCode.trim(),
            bankName: formData.bankName.trim(),
        };

        onSave(bankData, isEditMode);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Handle Enter key to move to next field
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const container = e.target.closest('[data-form-container]');
            if (!container) return;
            
            const focusable = Array.from(container.querySelectorAll('input:not([type="radio"]), select, textarea'));
            const idx = focusable.indexOf(e.target);
            if (idx >= 0 && idx < focusable.length - 1) {
                focusable[idx + 1].focus();
            } else if (idx === focusable.length - 1) {
                // Last field - trigger save
                handleSave();
            }
        }
    };

    // Focus first input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                const container = document.querySelector('[data-form-container]');
                if (container) {
                    const firstInput = container.querySelector('input');
                    firstInput?.focus();
                }
            }, 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-4 rounded-t-lg sticky top-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <h3 className="text-base font-semibold text-white">
                        {isEditMode ? "Edit Bank Account" : "Create Bank Account"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="px-5 py-4 space-y-5" data-form-container>
                    {/* Under Group - Bank Account Section */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">
                            Under Group - Bank Account
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Account Display Name<span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.accountDisplayName}
                                    onChange={(e) => handleChange("accountDisplayName", e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter account display name"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Short / Alias Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.shortAliasName}
                                    onChange={(e) => handleChange("shortAliasName", e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter short/alias name"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={formData.emailAddress}
                                    onChange={(e) => handleChange("emailAddress", e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter email address"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone No
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phoneNo}
                                    onChange={(e) => handleChange("phoneNo", e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter phone number"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bank Details Section */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">
                            Bank Details
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Account Holder's Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.accountHolderName}
                                    onChange={(e) => handleChange("accountHolderName", e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter account holder's name"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Account Number<span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.accountNumber}
                                    onChange={(e) => handleChange("accountNumber", e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter account number"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    IFSC Code
                                </label>
                                <input
                                    type="text"
                                    value={formData.ifscCode}
                                    onChange={(e) => handleChange("ifscCode", e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter IFSC code"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bank Name<span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.bankName}
                                    onChange={(e) => handleChange("bankName", e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter bank name"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Opening Balance Section */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">
                            Opening Balance
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Opening Balance
                                </label>
                                <input
                                    type="number"
                                    value={formData.openingBalance}
                                    onChange={(e) => handleChange("openingBalance", e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter opening balance"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type
                                </label>
                                <select
                                    value={formData.openingBalanceType}
                                    onChange={(e) => handleChange("openingBalanceType", e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="Credit">Credit</option>
                                    <option value="Debit">Debit</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Status Section */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">
                            Status
                        </h4>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="status"
                                    value="Active"
                                    checked={formData.status === "Active"}
                                    onChange={(e) => handleChange("status", e.target.value)}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Active</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="status"
                                    value="Inactive"
                                    checked={formData.status === "Inactive"}
                                    onChange={(e) => handleChange("status", e.target.value)}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Inactive</span>
                            </label>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg sticky bottom-0">
                    {isEditMode ? (
                        <button
                            type="button"
                            onClick={() => onDelete && onDelete(editData.id)}
                            className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 transition-colors"
                        >
                            Delete
                        </button>
                    ) : (
                        <div></div>
                    )}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            {isEditMode ? "Update" : "Save"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * BankPage
 * - Frontend-only bank account management
 * - No backend/API calls, in-memory state only
 * - Excel-like table with row highlighting and cell selection
 */
export default function BankPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const { rows: bankAccounts = [], loading, error, reload, create, update, remove } =
        useBank({ useLocalFallback: true });

    const [selectedCell, setSelectedCell] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);

    useEffect(() => {
        if (location?.state?.savedBank || location?.state?.deletedBankId) {
            reload();
            window.history.replaceState({}, document.title);
        }
    }, [location?.state, reload]);

    const handleOpenCreate = () => {
        setEditingAccount(null);
        setIsModalOpen(true);
    };

    const handleEditAccount = (account) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAccount(null);
    };

    const handleSaveAccount = async (accountData, isEdit) => {
        try {
            if (isEdit) {
                await update(accountData.id, {
                    accountDisplayName: accountData.accountDisplayName,
                    shortAliasName: accountData.shortAliasName,
                    emailAddress: accountData.emailAddress,
                    phoneNo: accountData.phoneNo,
                    accountHolderName: accountData.accountHolderName,
                    accountNumber: accountData.accountNumber,
                    ifscCode: accountData.ifscCode,
                    bankName: accountData.bankName,
                    openingBalance: accountData.openingBalance,
                    openingBalanceType: accountData.openingBalanceType,
                    status: accountData.status,
                });
            } else {
                await create({
                    accountDisplayName: accountData.accountDisplayName,
                    shortAliasName: accountData.shortAliasName,
                    emailAddress: accountData.emailAddress,
                    phoneNo: accountData.phoneNo,
                    accountHolderName: accountData.accountHolderName,
                    accountNumber: accountData.accountNumber,
                    ifscCode: accountData.ifscCode,
                    bankName: accountData.bankName,
                    openingBalance: accountData.openingBalance,
                    openingBalanceType: accountData.openingBalanceType,
                    status: accountData.status,
                });
            }
            // refresh the list from backend (keeps ordering/ids consistent)
            await reload();
            setIsModalOpen(false);
            setEditingAccount(null);
        } catch (err) {
            console.error("Failed to save account:", err);
            alert(err?.message || "Failed to save bank account");
        }
    };


    const handleDeleteAccount = async (id) => {
        if (!window.confirm("Are you sure you want to delete this bank account?")) return;
        try {
            await remove(id);
            await reload();
            setIsModalOpen(false);
            setEditingAccount(null);
        } catch (err) {
            console.error("Failed to delete account:", err);
            alert(err?.message || "Failed to delete bank account");
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

    const emptyRowsCount = Math.max(0, visibleRows - bankAccounts.length);
    const emptyRows = Array.from({ length: emptyRowsCount }, (_, i) => i);

    const totalRecords = bankAccounts.length;
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

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header Row */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">Bank Account</h2>
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
                    Create Bank Account
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
                                <th className="w-[20%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Account Name</span>
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                        </svg>
                                    </div>
                                </th>
                                <th className="w-[15%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Bank Name</span>
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                        </svg>
                                    </div>
                                </th>
                                <th className="w-[15%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Account Number</span>
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                        </svg>
                                    </div>
                                </th>
                                <th className="w-[12%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>IFSC Code</span>
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                        </svg>
                                    </div>
                                </th>
                                <th className="w-[13%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Opening Balance</span>
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                        </svg>
                                    </div>
                                </th>
                                <th className="w-[10%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Status</span>
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                        </svg>
                                    </div>
                                </th>
                                <th className="w-[15%] h-9 px-4 text-left text-sm font-medium text-gray-700">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Data rows */}
                            {bankAccounts.map((account, rowIndex) => (
                                <tr
                                    key={account.id || account._id || rowIndex}
                                    className={`border-b border-gray-400 hover:bg-blue-100 transition-colors ${rowIndex % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'}`}
                                >
                                    <td
                                        className={getCellClasses(rowIndex, 0) + " text-left text-blue-600"}
                                        onClick={() => handleCellClick(rowIndex, 0)}
                                    >
                                        {account.accountDisplayName}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 1) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 1)}
                                    >
                                        {account.bankName}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 2) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 2)}
                                    >
                                        {account.accountNumber}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 3) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 3)}
                                    >
                                        {account.ifscCode}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 4) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 4)}
                                    >
                                        {account.openingBalance ? `₹${account.openingBalance} (${account.openingBalanceType})` : "-"}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 5) + " text-left"}
                                        onClick={() => handleCellClick(rowIndex, 5)}
                                    >
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${account.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {account.status}
                                        </span>
                                    </td>
                                    <td className="h-8 px-4 text-left">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEditAccount(account)}
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
                                const rowIndex = bankAccounts.length + idx;
                                return (
                                    <tr
                                        key={`empty-${idx}`}
                                        className={`border-b border-gray-400 hover:bg-blue-100 transition-colors ${rowIndex % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'}`}
                                    >
                                        <td
                                            className={getCellClasses(rowIndex, 0)}
                                            onClick={() => handleCellClick(rowIndex, 0)}
                                        ></td>
                                        <td
                                            className={getCellClasses(rowIndex, 1)}
                                            onClick={() => handleCellClick(rowIndex, 1)}
                                        ></td>
                                        <td
                                            className={getCellClasses(rowIndex, 2)}
                                            onClick={() => handleCellClick(rowIndex, 2)}
                                        ></td>
                                        <td
                                            className={getCellClasses(rowIndex, 3)}
                                            onClick={() => handleCellClick(rowIndex, 3)}
                                        ></td>
                                        <td
                                            className={getCellClasses(rowIndex, 4)}
                                            onClick={() => handleCellClick(rowIndex, 4)}
                                        ></td>
                                        <td
                                            className={getCellClasses(rowIndex, 5)}
                                            onClick={() => handleCellClick(rowIndex, 5)}
                                        ></td>
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

            {/* Bank Modal */}
            <BankModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveAccount}
                onDelete={handleDeleteAccount}
                editData={editingAccount}
            />
        </div>
    );
}
