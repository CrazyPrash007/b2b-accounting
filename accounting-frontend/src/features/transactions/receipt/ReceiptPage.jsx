// ReceiptPage.jsx - Payment In
import React, { useState, useEffect, useRef } from "react";
import InvoicePreviewModal from "./components/InvoicePreviewModal";

/**
 * ReceiptModal - Modal for creating/editing receipt (payment in) entries
 */
function ReceiptModal({ isOpen, onClose, onSave, onDelete, editData }) {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        party: "",
        partyId: "",
        amount: "",
        paymentMethod: "Cash",
        invoice: "",
        invoiceId: "",
        referenceNumber: "",
        description: "",
    });
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});

    const isEditMode = !!editData;

    // Mock parties data - in real app, this would come from API (customers)
    const [parties] = useState([
        { id: "1", name: "ABC Corporation" },
        { id: "2", name: "XYZ Enterprises" },
        { id: "3", name: "Global Trading Corporation" },
        { id: "4", name: "Tech Innovations Ltd" },
        { id: "5", name: "Premier Solutions Inc" },
    ]);

    // Mock invoices data - would be filtered based on selected party
    const [invoices] = useState([
        { id: "INV-001", number: "INV-001", amount: 25000, dueAmount: 25000 },
        { id: "INV-002", number: "INV-002", amount: 45000, dueAmount: 20000 },
        { id: "INV-003", number: "INV-003", amount: 12500, dueAmount: 12500 },
    ]);

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
                    party: editData.party || "",
                    partyId: editData.partyId || "",
                    amount: editData.amount || "",
                    paymentMethod: editData.paymentMethod || "Cash",
                    invoice: editData.invoice || "",
                    invoiceId: editData.invoiceId || "",
                    referenceNumber: editData.referenceNumber || "",
                    description: editData.description || "",
                });
            } else {
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    party: "",
                    partyId: "",
                    amount: "",
                    paymentMethod: "Cash",
                    invoice: "",
                    invoiceId: "",
                    referenceNumber: "",
                    description: "",
                });
            }
            setError("");
            setFieldErrors({});
        }
    }, [editData, isOpen]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (error) setError("");
        if (fieldErrors[field]) {
            setFieldErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const handlePartyChange = (partyId) => {
        const selectedParty = parties.find(p => p.id === partyId);
        setFormData((prev) => ({
            ...prev,
            partyId,
            party: selectedParty?.name || "",
            invoice: "",
            invoiceId: "",
        }));
        if (fieldErrors.party) {
            setFieldErrors((prev) => ({ ...prev, party: "" }));
        }
    };

    const handleInvoiceChange = (invoiceId) => {
        const selectedInvoice = invoices.find(i => i.id === invoiceId);
        setFormData((prev) => ({
            ...prev,
            invoiceId,
            invoice: selectedInvoice?.number || "",
            amount: selectedInvoice?.dueAmount?.toString() || prev.amount,
        }));
    };

    const handleSave = () => {
        const errors = {};
        
        if (!formData.partyId) {
            errors.party = "Party is required";
        }
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            errors.amount = "Valid amount is required";
        }
        if (!formData.paymentMethod) {
            errors.paymentMethod = "Payment method is required";
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        const receiptData = {
            id: isEditMode ? editData.id : String(Date.now()),
            ...formData,
            amount: parseFloat(formData.amount),
            description: formData.description.trim(),
            referenceNumber: formData.referenceNumber.trim(),
        };

        onSave(receiptData, isEditMode);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Handle Enter key to move to next input
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const form = e.target.closest('form') || e.target.closest('[data-form-container]');
            if (!form) return;
            
            const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
            const currentIndex = inputs.indexOf(e.target);
            
            if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
                inputs[currentIndex + 1].focus();
            }
        }
    };

    if (!isOpen) return null;

    const baseInput = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-3 rounded-t-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <h3 className="text-base font-semibold text-white">
                        {isEditMode ? "Edit Payment In" : "New Payment In"}
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

                {/* Modal Body - Scrollable */}
                <div className="px-5 py-4 overflow-y-auto flex-1" data-form-container>
                    {/* Payment Details Section */}
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2 pb-1 border-b border-gray-200">Payment Details</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date<span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => handleChange("date", e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className={baseInput}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Party<span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.partyId}
                                    onChange={(e) => handlePartyChange(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className={`${baseInput} bg-white ${fieldErrors.party ? "border-red-500" : ""}`}
                                >
                                    <option value="">Search and select party...</option>
                                    {parties.map((party) => (
                                        <option key={party.id} value={party.id}>{party.name}</option>
                                    ))}
                                </select>
                                {fieldErrors.party && <p className="mt-1 text-xs text-red-500">{fieldErrors.party}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount<span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => handleChange("amount", e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter amount"
                                    className={`${baseInput} ${fieldErrors.amount ? "border-red-500" : ""}`}
                                />
                                {fieldErrors.amount && <p className="mt-1 text-xs text-red-500">{fieldErrors.amount}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Method<span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.paymentMethod}
                                    onChange={(e) => handleChange("paymentMethod", e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className={`${baseInput} bg-white`}
                                >
                                    {paymentMethods.map((method) => (
                                        <option key={method} value={method}>{method}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Invoice & Reference Section */}
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2 pb-1 border-b border-gray-200">Additional Details</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Invoice (Optional)
                                </label>
                                <select
                                    value={formData.invoiceId}
                                    onChange={(e) => handleInvoiceChange(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={!formData.partyId}
                                    className={`${baseInput} bg-white disabled:bg-gray-100 disabled:cursor-not-allowed`}
                                >
                                    <option value="">Select a party first to see their invoices...</option>
                                    {formData.partyId && invoices.map((invoice) => (
                                        <option key={invoice.id} value={invoice.id}>
                                            {invoice.number} - Due: ₹{invoice.dueAmount.toLocaleString('en-IN')}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-gray-500">Select an invoice to automatically fill the amount with the due amount</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Reference Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.referenceNumber}
                                    onChange={(e) => handleChange("referenceNumber", e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter reference number (optional)"
                                    className={baseInput}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => handleChange("description", e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Payment description (optional)"
                                    className={baseInput}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
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
 * ReceiptPage - Payment In Management
 * - Frontend-only receipt management
 * - Excel-like table with row highlighting and cell selection
 * - PDF Invoice export functionality
 */
export default function ReceiptPage() {
    const [receipts, setReceipts] = useState([]);
    const [selectedCell, setSelectedCell] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReceipt, setEditingReceipt] = useState(null);
    const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
    const [selectedReceiptForInvoice, setSelectedReceiptForInvoice] = useState(null);

    // Sample company data - in production, this would come from organization settings/API
    const companyData = {
        name: "Your Company Name",
        gstin: "00XXXXX0000X0ZX",
        addressLine1: "Plot No XX, Ward No XX",
        addressLine2: "Main Road",
        city: "City",
        state: "State",
        pincode: "000000",
        phone: "+91 9999999999",
        email: "contact@company.com",
        website: "https://www.company.com",
        logoUrl: "", // Wire from organization settings
    };

    // Convert receipt to invoice format for PDF export
    const convertReceiptToInvoice = (receipt) => {
        if (!receipt) return null;

        // Find party details - in real app, fetch from customer API
        const customerData = {
            name: receipt.party || "Customer Name",
            partyName: receipt.party,
            phone: "",
            billingAddressLine1: "Customer Address Line 1",
            billingAddressLine2: "",
            city: "City",
            state: "State",
            pincode: "000000",
            gstin: "",
        };

        return {
            company: companyData,
            customer: customerData,
            meta: {
                invoiceNumber: receipt.invoice || `RCP-${receipt.id}`,
                invoiceDate: receipt.date,
                dueDate: receipt.date,
                placeOfSupply: customerData.state,
            },
            items: [
                {
                    id: 1,
                    srNo: 1,
                    description: receipt.description || `Payment Receipt - ${receipt.paymentMethod}`,
                    hsnSac: "",
                    taxPercent: 0,
                    quantity: 1,
                    unit: "",
                    rate: receipt.amount,
                    amount: receipt.amount,
                },
            ],
            summary: {
                totalQuantity: 1,
                deliveryCharges: 0,
                taxableAmount: receipt.amount,
                grandTotal: receipt.amount,
                amountInWords: numberToWords(receipt.amount),
            },
            bankDetails: {
                bankName: "Bank Name",
                accountNumber: "0000000000",
                ifscCode: "BANK0000000",
                branch: "Branch Name",
            },
            // TODO: wire UPI QR code URL from backend
            paymentDetails: {
                upiQrUrl: "",
            },
            // TODO: wire signatory name and signature image from backend
            signatory: {
                name: "Authorized Signatory",
                signatureImageUrl: "",
            },
        };
    };

    // Convert number to words for amount in words
    const numberToWords = (num) => {
        if (num === 0) return "Zero Rupees Only";

        const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
            "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
        const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

        const convertLessThanThousand = (n) => {
            if (n === 0) return "";
            if (n < 20) return ones[n];
            if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
            return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "");
        };

        const numInt = Math.floor(num);
        const paisa = Math.round((num - numInt) * 100);

        let result = "";
        
        if (numInt >= 10000000) {
            result += convertLessThanThousand(Math.floor(numInt / 10000000)) + " Crore ";
        }
        if (numInt >= 100000) {
            result += convertLessThanThousand(Math.floor((numInt % 10000000) / 100000)) + " Lakh ";
        }
        if (numInt >= 1000) {
            result += convertLessThanThousand(Math.floor((numInt % 100000) / 1000)) + " Thousand ";
        }
        if (numInt >= 100) {
            result += convertLessThanThousand(Math.floor((numInt % 1000) / 100)) + " Hundred ";
        }
        if (numInt % 100 !== 0) {
            result += convertLessThanThousand(numInt % 100);
        }

        result = result.trim() + " Rupees";
        
        if (paisa > 0) {
            result += " and " + convertLessThanThousand(paisa) + " Paise";
        }

        return "INR " + result + " Only";
    };

    // Invoice config - can be wired from settings
    // TODO: wire footer text / watermark from configurable settings
    // TODO: replace with real terms from backend or settings
    const invoiceConfig = {
        footerText: "This is a computer generated receipt",
        watermarkText: "",
        termsAndConditions: "",
        poweredByText: "",
        poweredByLogoUrl: "",
    };

    const handleOpenInvoicePreview = (receipt) => {
        setSelectedReceiptForInvoice(receipt);
        setIsInvoicePreviewOpen(true);
    };

    const handleCloseInvoicePreview = () => {
        setIsInvoicePreviewOpen(false);
        setSelectedReceiptForInvoice(null);
    };

    const handleOpenCreate = () => {
        setEditingReceipt(null);
        setIsModalOpen(true);
    };

    const handleEditReceipt = (receipt) => {
        setEditingReceipt(receipt);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingReceipt(null);
    };

    const handleSaveReceipt = (receiptData, isEdit) => {
        if (isEdit) {
            setReceipts((prev) =>
                prev.map((rec) =>
                    rec.id === receiptData.id ? receiptData : rec
                )
            );
        } else {
            setReceipts((prev) => [...prev, receiptData]);
        }
        setIsModalOpen(false);
        setEditingReceipt(null);
    };

    const handleDeleteReceipt = (id) => {
        if (window.confirm("Are you sure you want to delete this receipt?")) {
            setReceipts((prev) => prev.filter((rec) => rec.id !== id));
            setIsModalOpen(false);
            setEditingReceipt(null);
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

    const emptyRowsCount = Math.max(0, visibleRows - receipts.length);
    const emptyRows = Array.from({ length: emptyRowsCount }, (_, i) => i);

    const totalRecords = receipts.length;
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
                    <h2 className="text-lg font-semibold text-gray-900">Payment In</h2>
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
                    Add Payment In
                </button>
            </div>

            {/* Toolbar - Icons commented out as per requirement */}
            <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-gray-100">
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
                                <th className="min-w-[160px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Party</span>
                                    </div>
                                </th>
                                <th className="min-w-[130px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Amount</span>
                                    </div>
                                </th>
                                <th className="min-w-[140px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Payment Method</span>
                                    </div>
                                </th>
                                <th className="min-w-[120px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Invoice</span>
                                    </div>
                                </th>
                                <th className="min-w-[130px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Reference</span>
                                    </div>
                                </th>
                                <th className="min-w-[100px] h-9 px-4 text-left text-sm font-medium text-gray-700 sticky right-0 z-20 bg-gray-100 border-l border-gray-400" style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.15)' }}>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Data rows */}
                            {receipts.map((receipt, rowIndex) => (
                                <tr
                                    key={receipt.id}
                                    className={`border-b border-gray-400 hover:bg-blue-100 transition-colors ${rowIndex % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'}`}
                                >
                                    <td
                                        className={getCellClasses(rowIndex, 0) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 0)}
                                    >
                                        {formatDate(receipt.date)}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 1) + " text-left text-blue-600"}
                                        onClick={() => handleCellClick(rowIndex, 1)}
                                    >
                                        {receipt.party}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 2) + " text-left text-green-600 font-medium"}
                                        onClick={() => handleCellClick(rowIndex, 2)}
                                    >
                                        {formatCurrency(receipt.amount)}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 3) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 3)}
                                    >
                                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                                            {receipt.paymentMethod}
                                        </span>
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 4) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 4)}
                                    >
                                        {receipt.invoice || "-"}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 5) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 5)}
                                    >
                                        {receipt.referenceNumber || "-"}
                                    </td>
                                    <td className={`h-8 px-4 text-left sticky right-0 z-10 border-l border-gray-400 ${rowIndex % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`} style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.1)' }}>
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenInvoicePreview(receipt)}
                                                className="text-purple-600 hover:underline text-sm"
                                                title="Export as PDF"
                                            >
                                                PDF
                                            </button>
                                            <button
                                                onClick={() => handleEditReceipt(receipt)}
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
                                const rowIndex = receipts.length + idx;
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

            {/* Receipt Modal */}
            <ReceiptModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveReceipt}
                onDelete={handleDeleteReceipt}
                editData={editingReceipt}
            />

            {/* Invoice Preview Modal with PDF Export */}
            {selectedReceiptForInvoice && (
                <InvoicePreviewModal
                    isOpen={isInvoicePreviewOpen}
                    onClose={handleCloseInvoicePreview}
                    invoice={convertReceiptToInvoice(selectedReceiptForInvoice)}
                    config={invoiceConfig}
                />
            )}
        </div>
    );
}
