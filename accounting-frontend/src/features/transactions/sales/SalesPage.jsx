// SalesPage.jsx
import React, { useState, useEffect, useRef } from "react";

/**
 * SalesInvoiceModal - Modal for creating/editing sales invoices
 * Supports both With GST and Without GST modes
 */
function SalesInvoiceModal({ isOpen, onClose, onSave, onDelete, editData, withGst = true }) {
    const [formData, setFormData] = useState({
        customer: "",
        supplierInvoiceNumber: "",
        invoicePrefix: "INV",
        invoiceNumber: "0001",
        invoiceSuffix: "",
        supplierDate: "",
        invoiceDate: new Date().toISOString().split('T')[0],
        items: [{ id: 1, goodsService: "", qty: "", rate: "", gstPercent: "", gstType: "Excluded", amount: "" }],
        isPaymentReceived: true,
        paymentMode: "Cash",
        refNo: "",
        depositTo: "Cash-in-Hand",
        paymentAmount: "0",
        payFull: false,
        discount: "",
        autoRoundOff: true,
        description: "",
    });
    const [error, setError] = useState("");

    const isEditMode = !!editData;

    const gstOptions = ["0", "5", "12", "18", "28"];
    const paymentModes = ["Cash", "Bank Transfer", "UPI", "Credit Card", "Debit Card", "Cheque"];
    const depositOptions = ["Cash-in-Hand", "Bank Account", "Petty Cash"];

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setFormData({
                    customer: editData.customer || "",
                    supplierInvoiceNumber: editData.supplierInvoiceNumber || "",
                    invoicePrefix: editData.invoicePrefix || "INV",
                    invoiceNumber: editData.invoiceNumber || "0001",
                    invoiceSuffix: editData.invoiceSuffix || "",
                    supplierDate: editData.supplierDate || "",
                    invoiceDate: editData.invoiceDate || new Date().toISOString().split('T')[0],
                    items: editData.items || [{ id: 1, goodsService: "", qty: "", rate: "", gstPercent: "", gstType: "Excluded", amount: "" }],
                    isPaymentReceived: editData.isPaymentReceived ?? true,
                    paymentMode: editData.paymentMode || "Cash",
                    refNo: editData.refNo || "",
                    depositTo: editData.depositTo || "Cash-in-Hand",
                    paymentAmount: editData.paymentAmount || "0",
                    payFull: editData.payFull || false,
                    discount: editData.discount || "",
                    autoRoundOff: editData.autoRoundOff ?? true,
                    description: editData.description || "",
                });
            } else {
                setFormData({
                    customer: "",
                    supplierInvoiceNumber: "",
                    invoicePrefix: "INV",
                    invoiceNumber: "0001",
                    invoiceSuffix: "",
                    supplierDate: "",
                    invoiceDate: new Date().toISOString().split('T')[0],
                    items: [{ id: 1, goodsService: "", qty: "", rate: "", gstPercent: "", gstType: "Excluded", amount: "" }],
                    isPaymentReceived: true,
                    paymentMode: "Cash",
                    refNo: "",
                    depositTo: "Cash-in-Hand",
                    paymentAmount: "0",
                    payFull: false,
                    discount: "",
                    autoRoundOff: true,
                    description: "",
                });
            }
            setError("");
        }
    }, [editData, isOpen]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (error) setError("");
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        
        // Calculate amount if qty and rate are available
        const qty = parseFloat(newItems[index].qty) || 0;
        const rate = parseFloat(newItems[index].rate) || 0;
        let amount = qty * rate;
        
        if (withGst && newItems[index].gstPercent && newItems[index].gstType === "Excluded") {
            const gstPercent = parseFloat(newItems[index].gstPercent) || 0;
            amount = amount + (amount * gstPercent / 100);
        }
        
        newItems[index].amount = amount > 0 ? amount.toFixed(2) : "";
        setFormData((prev) => ({ ...prev, items: newItems }));
    };

    const addRow = () => {
        const newId = formData.items.length + 1;
        setFormData((prev) => ({
            ...prev,
            items: [...prev.items, { id: newId, goodsService: "", qty: "", rate: "", gstPercent: "", gstType: "Excluded", amount: "" }]
        }));
    };

    const removeRow = (index) => {
        if (formData.items.length > 1) {
            setFormData((prev) => ({
                ...prev,
                items: prev.items.filter((_, i) => i !== index)
            }));
        }
    };

    const calculateTotals = () => {
        let taxableAmt = 0;
        let totalGst = 0;
        
        formData.items.forEach(item => {
            const qty = parseFloat(item.qty) || 0;
            const rate = parseFloat(item.rate) || 0;
            const baseAmount = qty * rate;
            taxableAmt += baseAmount;
            
            if (withGst && item.gstPercent) {
                const gstPercent = parseFloat(item.gstPercent) || 0;
                totalGst += baseAmount * gstPercent / 100;
            }
        });
        
        let subTotal = taxableAmt + totalGst;
        const discountAmount = parseFloat(formData.discount) || 0;
        let total = subTotal - discountAmount;
        
        if (formData.autoRoundOff) {
            total = Math.round(total);
        }
        
        return { taxableAmt, totalGst, subTotal, total };
    };

    const totals = calculateTotals();

    const handleSave = () => {
        if (!formData.customer.trim()) {
            setError("Customer is required");
            return;
        }
        if (!formData.supplierInvoiceNumber.trim()) {
            setError("Supplier Invoice Number is required");
            return;
        }

        const salesData = {
            id: isEditMode ? editData.id : String(Date.now()),
            ...formData,
            withGst,
            totalAmount: totals.total,
            taxableAmount: totals.taxableAmt,
            gstAmount: totals.totalGst,
        };

        onSave(salesData, isEditMode);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[95vh] overflow-y-auto">
                {/* Modal Header */}
                <div className={`px-6 py-4 ${withGst ? 'bg-gradient-to-r from-purple-600 to-purple-400' : 'bg-gradient-to-r from-gray-700 to-gray-500'} text-white rounded-t-lg`}>
                    <h3 className="text-lg font-semibold">
                        Create New Sales Invoice {withGst ? "" : "(Without GST)"}
                    </h3>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                    {/* Top Section - Customer & Invoice Details */}
                    <div className="grid grid-cols-3 gap-6">
                        {/* Customer Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Customer <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.customer}
                                    onChange={(e) => handleChange("customer", e.target.value)}
                                    placeholder="Search customer or vendor"
                                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                                <button className={`px-3 py-2 ${withGst ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'} text-white rounded text-sm`}>
                                    + End Customer
                                </button>
                            </div>
                        </div>

                        {/* Supplier Invoice Details */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Supplier Invoice Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.supplierInvoiceNumber}
                                    onChange={(e) => handleChange("supplierInvoiceNumber", e.target.value)}
                                    placeholder="Supplier Invoice Number"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Supplier Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.supplierDate}
                                    onChange={(e) => handleChange("supplierDate", e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                            </div>
                        </div>

                        {/* Invoice Number & Date */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Invoice Number <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-1">
                                    <input
                                        type="text"
                                        value={formData.invoicePrefix}
                                        onChange={(e) => handleChange("invoicePrefix", e.target.value)}
                                        className="w-16 border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                    <input
                                        type="text"
                                        value={formData.invoiceNumber}
                                        onChange={(e) => handleChange("invoiceNumber", e.target.value)}
                                        className="w-20 border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                    <input
                                        type="text"
                                        value={formData.invoiceSuffix}
                                        onChange={(e) => handleChange("invoiceSuffix", e.target.value)}
                                        placeholder="Suffix"
                                        className="flex-1 border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Invoice Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.invoiceDate}
                                    onChange={(e) => handleChange("invoiceDate", e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-300">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700 w-12">SR.NO.</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700 w-48">Goods/Service</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700 w-20">Qty</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700 w-28">Rate (₹)</th>
                                    {withGst && (
                                        <>
                                            <th className="px-3 py-2 text-left font-medium text-gray-700 w-24">GST (%)</th>
                                            <th className="px-3 py-2 text-left font-medium text-gray-700 w-24">GST Type</th>
                                        </>
                                    )}
                                    <th className="px-3 py-2 text-left font-medium text-gray-700 w-28">Amount (₹)</th>
                                    <th className="px-3 py-2 text-center font-medium text-gray-700 w-10">
                                        <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                        </svg>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.items.map((item, index) => (
                                    <tr key={item.id} className="border-b border-gray-200">
                                        <td className="px-3 py-2 text-gray-600">{index + 1}</td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={item.goodsService}
                                                onChange={(e) => handleItemChange(index, "goodsService", e.target.value)}
                                                placeholder="Search or select item"
                                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="number"
                                                value={item.qty}
                                                onChange={(e) => handleItemChange(index, "qty", e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="number"
                                                value={item.rate}
                                                onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            />
                                        </td>
                                        {withGst && (
                                            <>
                                                <td className="px-3 py-2">
                                                    <select
                                                        value={item.gstPercent}
                                                        onChange={(e) => handleItemChange(index, "gstPercent", e.target.value)}
                                                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                    >
                                                        <option value="">Select G</option>
                                                        {gstOptions.map(g => <option key={g} value={g}>{g}%</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <select
                                                        value={item.gstType}
                                                        onChange={(e) => handleItemChange(index, "gstType", e.target.value)}
                                                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                    >
                                                        <option value="Excluded">Excluded</option>
                                                        <option value="Included">Included</option>
                                                    </select>
                                                </td>
                                            </>
                                        )}
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={item.amount}
                                                readOnly
                                                className="w-full border border-gray-200 bg-gray-50 rounded px-2 py-1.5 text-sm"
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            {formData.items.length > 1 && (
                                                <button
                                                    onClick={() => removeRow(index)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Add Row Button */}
                    <button
                        onClick={addRow}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                    >
                        <span>+</span> Add Row
                    </button>

                    {/* Bottom Section - Payment & Summary */}
                    <div className="grid grid-cols-2 gap-8">
                        {/* Payment Section */}
                        <div className="space-y-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isPaymentReceived}
                                    onChange={(e) => handleChange("isPaymentReceived", e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-blue-600">Is Payment Received?</span>
                            </label>

                            {formData.isPaymentReceived && (
                                <div className="space-y-3 pl-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Payment Mode</label>
                                            <select
                                                value={formData.paymentMode}
                                                onChange={(e) => handleChange("paymentMode", e.target.value)}
                                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            >
                                                {paymentModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Ref. No.</label>
                                            <input
                                                type="text"
                                                value={formData.refNo}
                                                onChange={(e) => handleChange("refNo", e.target.value)}
                                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Deposit to</label>
                                            <select
                                                value={formData.depositTo}
                                                onChange={(e) => handleChange("depositTo", e.target.value)}
                                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            >
                                                {depositOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Amount (₹)</label>
                                            <input
                                                type="number"
                                                value={formData.paymentAmount}
                                                onChange={(e) => handleChange("paymentAmount", e.target.value)}
                                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            />
                                            <label className="flex items-center gap-2 mt-1">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.payFull}
                                                    onChange={(e) => handleChange("payFull", e.target.checked)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-xs text-gray-500">Pay full</span>
                                            </label>
                                        </div>
                                    </div>
                                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                        + Add More Payment
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Summary Section */}
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <h4 className="font-medium text-gray-700 mb-3">Summary</h4>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Taxable Amt.</span>
                                <span>₹{totals.taxableAmt.toFixed(2)}</span>
                            </div>
                            {withGst && (
                                <button className="text-blue-600 text-sm">+ Add service charge with tax</button>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Sub Total</span>
                                <span>₹{totals.subTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-gray-600">Discount</span>
                                <input
                                    type="number"
                                    value={formData.discount}
                                    onChange={(e) => handleChange("discount", e.target.value)}
                                    placeholder="0"
                                    className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right"
                                />
                            </div>
                            <button className="text-blue-600 text-sm">+ Add another charges</button>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.autoRoundOff}
                                    onChange={(e) => handleChange("autoRoundOff", e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">Auto Round Off</span>
                                <span className="ml-auto text-sm">₹0.00</span>
                            </label>
                            <div className="flex justify-between text-lg font-semibold border-t pt-2 mt-2">
                                <span>Total Amount</span>
                                <span>₹{totals.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
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
                            className={`px-4 py-2 text-sm text-white rounded transition-colors flex items-center gap-2 ${withGst ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Save Invoice
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * SalesPage
 * - Frontend-only sales invoice management
 * - Supports both With GST and Without GST invoices
 * - Excel-like table with row highlighting and cell selection
 */
export default function SalesPage() {
    const [invoices, setInvoices] = useState([]);
    const [selectedCell, setSelectedCell] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState(null);
    const [invoiceType, setInvoiceType] = useState("withGst"); // "withGst" or "withoutGst"
    const [activeTab, setActiveTab] = useState("all"); // "all", "withGst", "withoutGst"

    const handleOpenCreate = (type) => {
        setInvoiceType(type);
        setEditingInvoice(null);
        setIsModalOpen(true);
    };

    const handleEditInvoice = (invoice) => {
        setInvoiceType(invoice.withGst ? "withGst" : "withoutGst");
        setEditingInvoice(invoice);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingInvoice(null);
    };

    const handleSaveInvoice = (invoiceData, isEdit) => {
        if (isEdit) {
            setInvoices((prev) =>
                prev.map((inv) =>
                    inv.id === invoiceData.id ? invoiceData : inv
                )
            );
        } else {
            setInvoices((prev) => [...prev, invoiceData]);
        }
        setIsModalOpen(false);
        setEditingInvoice(null);
    };

    const handleDeleteInvoice = (id) => {
        if (window.confirm("Are you sure you want to delete this invoice?")) {
            setInvoices((prev) => prev.filter((inv) => inv.id !== id));
            setIsModalOpen(false);
            setEditingInvoice(null);
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

    // Filter invoices based on active tab
    const filteredInvoices = activeTab === "all" 
        ? invoices 
        : activeTab === "withGst" 
            ? invoices.filter(inv => inv.withGst) 
            : invoices.filter(inv => !inv.withGst);

    const emptyRowsCount = Math.max(0, visibleRows - filteredInvoices.length);
    const emptyRows = Array.from({ length: emptyRowsCount }, (_, i) => i);

    const totalRecords = filteredInvoices.length;
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
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(amount || 0);
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header Row */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">Sales</h2>
                    <button className="text-gray-400 hover:text-yellow-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleOpenCreate("withGst")}
                        className="flex items-center gap-1 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        With GST
                    </button>
                    <button
                        onClick={() => handleOpenCreate("withoutGst")}
                        className="flex items-center gap-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Without GST
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-100">
                <button
                    onClick={() => setActiveTab("all")}
                    className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${activeTab === "all" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}
                >
                    All Invoices
                </button>
                <button
                    onClick={() => setActiveTab("withGst")}
                    className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${activeTab === "withGst" ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-100"}`}
                >
                    With GST
                </button>
                <button
                    onClick={() => setActiveTab("withoutGst")}
                    className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${activeTab === "withoutGst" ? "bg-gray-200 text-gray-700" : "text-gray-600 hover:bg-gray-100"}`}
                >
                    Without GST
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
                                <th className="w-[10%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Date</span>
                                    </div>
                                </th>
                                <th className="w-[14%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Invoice No.</span>
                                    </div>
                                </th>
                                <th className="w-[18%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Customer</span>
                                    </div>
                                </th>
                                <th className="w-[12%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Amount</span>
                                    </div>
                                </th>
                                <th className="w-[10%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>GST</span>
                                    </div>
                                </th>
                                <th className="w-[12%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Type</span>
                                    </div>
                                </th>
                                <th className="w-[12%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Payment</span>
                                    </div>
                                </th>
                                <th className="w-[12%] h-9 px-4 text-left text-sm font-medium text-gray-700">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Data rows */}
                            {filteredInvoices.map((invoice, rowIndex) => (
                                <tr
                                    key={invoice.id}
                                    className={`border-b border-gray-400 hover:bg-blue-100 transition-colors ${rowIndex % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'}`}
                                >
                                    <td
                                        className={getCellClasses(rowIndex, 0) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 0)}
                                    >
                                        {formatDate(invoice.invoiceDate)}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 1) + " text-left text-blue-600"}
                                        onClick={() => handleCellClick(rowIndex, 1)}
                                    >
                                        {invoice.invoicePrefix}{invoice.invoiceNumber}{invoice.invoiceSuffix}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 2) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 2)}
                                    >
                                        {invoice.customer}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 3) + " text-left text-gray-600 font-medium"}
                                        onClick={() => handleCellClick(rowIndex, 3)}
                                    >
                                        {formatCurrency(invoice.totalAmount)}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 4) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 4)}
                                    >
                                        {invoice.withGst ? formatCurrency(invoice.gstAmount) : "-"}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 5) + " text-left"}
                                        onClick={() => handleCellClick(rowIndex, 5)}
                                    >
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${invoice.withGst ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {invoice.withGst ? "With GST" : "Without GST"}
                                        </span>
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 6) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 6)}
                                    >
                                        {invoice.isPaymentReceived ? (
                                            <span className="text-green-600 text-xs">✓ Received</span>
                                        ) : (
                                            <span className="text-orange-600 text-xs">Pending</span>
                                        )}
                                    </td>
                                    <td className="h-8 px-4 text-left">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEditInvoice(invoice)}
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
                                const rowIndex = filteredInvoices.length + idx;
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
                                        <td className={getCellClasses(rowIndex, 6)} onClick={() => handleCellClick(rowIndex, 6)}></td>
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

            {/* Sales Invoice Modal */}
            <SalesInvoiceModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveInvoice}
                onDelete={handleDeleteInvoice}
                editData={editingInvoice}
                withGst={invoiceType === "withGst"}
            />
        </div>
    );
}
