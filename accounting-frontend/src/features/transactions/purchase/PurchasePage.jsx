// PurchasePage.jsx
import React, { useState, useEffect, useRef } from "react";

/**
 * PurchaseInvoiceModal - Modal for creating/editing purchase invoices
 * Supports both With GST and Without GST modes
 */
function PurchaseInvoiceModal({ isOpen, onClose, onSave, onDelete, editData, withGst = true, bankAccounts = [], gstRates = [] }) {
    // Additional charges state
    const [additionalCharges, setAdditionalCharges] = useState([]);
    const [showAddCharge, setShowAddCharge] = useState(false);
    const [chargeName, setChargeName] = useState("");
    const [chargeAmount, setChargeAmount] = useState("");

    // Payment splits state
    const [payments, setPayments] = useState([]);
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [paymentMode, setPaymentMode] = useState("");
    const [paymentAmount, setPaymentAmount] = useState("");

    // Get next invoice counter from localStorage or start at 1
    const getNextInvoiceCounter = () => {
        const saved = localStorage.getItem('purchaseInvoiceCounter');
        return saved ? parseInt(saved, 10) : 1;
    };

    const [formData, setFormData] = useState({
        supplier: "",
        invoicePrefix: "PUR",
        invoiceNumber: String(getNextInvoiceCounter()).padStart(6, '0'), // 6-digit auto-increment
        invoiceSuffix: "",
        invoiceDate: new Date().toISOString().split('T')[0],
        supplierInvoiceNumber: "",
        supplierInvoiceDate: "",
        items: [{ id: 1, goodsService: "", qty: "", rate: "", gstPercent: "", gstType: "Excluded", actualAmount: "", finalAmount: "" }],
        isPaymentMade: true,
        paymentMode: "Cash",
        refNo: "",
        paidFrom: "Cash-in-Hand",
        paymentAmount: "0",
        payFull: false,
        discount: "",
        autoRoundOff: true,
        description: "",
    });
    const [error, setError] = useState("");

    const isEditMode = !!editData;

    // Default GST options if no rates provided from GST table
    const defaultGstOptions = ["0", "5", "12", "18", "28"];
    const gstOptions = gstRates.length > 0 ? gstRates.map(g => String(g.rate)) : defaultGstOptions;
    
    // Default payment modes + bank accounts from bank table
    const defaultPaymentModes = ["Cash", "UPI", "Credit Card", "Debit Card", "Cheque"];
    const bankAccountOptions = bankAccounts.map(acc => acc.accountDisplayName || acc.bankName);
    const paymentModes = [...defaultPaymentModes, ...bankAccountOptions];
    
    const paidFromOptions = ["Cash-in-Hand", ...bankAccountOptions, "Petty Cash"];

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setFormData({
                    supplier: editData.supplier || "",
                    invoicePrefix: editData.invoicePrefix || "PUR",
                    invoiceNumber: editData.invoiceNumber || String(getNextInvoiceCounter()).padStart(6, '0'),
                    invoiceSuffix: editData.invoiceSuffix || "",
                    invoiceDate: editData.invoiceDate || new Date().toISOString().split('T')[0],
                    supplierInvoiceNumber: editData.supplierInvoiceNumber || "",
                    supplierInvoiceDate: editData.supplierInvoiceDate || "",
                    items: editData.items || [{ id: 1, goodsService: "", qty: "", rate: "", gstPercent: "", gstType: "Excluded", actualAmount: "", finalAmount: "" }],
                    isPaymentMade: editData.isPaymentMade ?? true,
                    paymentMode: editData.paymentMode || "Cash",
                    refNo: editData.refNo || "",
                    paidFrom: editData.paidFrom || "Cash-in-Hand",
                    paymentAmount: editData.paymentAmount || "0",
                    payFull: editData.payFull || false,
                    discount: editData.discount || "",
                    autoRoundOff: editData.autoRoundOff ?? true,
                    description: editData.description || "",
                });
                setAdditionalCharges(editData.additionalCharges || []);
                setPayments(editData.payments || []);
            } else {
                const nextCounter = getNextInvoiceCounter();
                setFormData({
                    supplier: "",
                    invoicePrefix: "PUR",
                    invoiceNumber: String(nextCounter).padStart(6, '0'),
                    invoiceSuffix: "",
                    invoiceDate: new Date().toISOString().split('T')[0],
                    supplierInvoiceNumber: "",
                    supplierInvoiceDate: "",
                    items: [{ id: 1, goodsService: "", qty: "", rate: "", gstPercent: "", gstType: "Excluded", actualAmount: "", finalAmount: "" }],
                    isPaymentMade: true,
                    paymentMode: "Cash",
                    refNo: "",
                    paidFrom: "Cash-in-Hand",
                    paymentAmount: "0",
                    payFull: false,
                    discount: "",
                    autoRoundOff: true,
                    description: "",
                });
                setAdditionalCharges([]);
                setPayments([]);
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
        
        // Calculate amounts if qty and rate are available
        const qty = parseFloat(newItems[index].qty) || 0;
        const rate = parseFloat(newItems[index].rate) || 0;
        const gstPercent = parseFloat(newItems[index].gstPercent) || 0;
        const gstType = newItems[index].gstType || "Excluded";
        
        let actualAmount = 0; // Pre-tax amount
        let finalAmount = 0;  // Amount with tax
        
        if (withGst && gstPercent > 0) {
            if (gstType === "Excluded") {
                // Rate is pre-tax: actualAmount = qty * rate, finalAmount = actualAmount + tax
                actualAmount = qty * rate;
                finalAmount = actualAmount + (actualAmount * gstPercent / 100);
            } else {
                // GST Included: Rate includes tax, so we need to back-calculate
                // finalAmount = qty * rate (since rate includes tax)
                // actualAmount = finalAmount / (1 + gstPercent/100)
                finalAmount = qty * rate;
                actualAmount = finalAmount / (1 + gstPercent / 100);
            }
        } else {
            // No GST: both amounts are the same
            actualAmount = qty * rate;
            finalAmount = actualAmount;
        }
        
        newItems[index].actualAmount = actualAmount > 0 ? actualAmount.toFixed(2) : "";
        newItems[index].finalAmount = finalAmount > 0 ? finalAmount.toFixed(2) : "";
        setFormData((prev) => ({ ...prev, items: newItems }));
    };

    const handleAmountKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // If it's the last row, add a new row only if current row is complete
            if (index === formData.items.length - 1) {
                if (addRow()) {
                    setTimeout(() => {
                        const nextRow = document.querySelector(`tr[data-item-row="${index + 1}"]`);
                        if (nextRow) {
                            const firstInput = nextRow.querySelector('input');
                            if (firstInput) firstInput.focus();
                        }
                    }, 50);
                }
            } else {
                // Move to first input of next row
                const row = e.target.closest('tr');
                if (!row) return;
                const rows = Array.from(document.querySelectorAll('[data-items-table] tbody tr'));
                const currentRowIdx = rows.indexOf(row);
                if (currentRowIdx < rows.length - 1) {
                    const nextRow = rows[currentRowIdx + 1];
                    const firstInput = nextRow.querySelector('input');
                    if (firstInput) firstInput.focus();
                }
            }
        }
    };

    // Handle Enter key navigation within item rows
    const handleItemInputKeyDown = (e, index, fieldIndex, isLastField = false) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const row = e.target.closest('tr');
            if (!row) return;
            
            const inputs = Array.from(row.querySelectorAll('input, select'));
            const currentIdx = inputs.indexOf(e.target);
            
            if (isLastField || currentIdx >= inputs.length - 1) {
                // If it's the last row, add a new row only if current row is complete
                if (index === formData.items.length - 1) {
                    if (addRow()) {
                        setTimeout(() => {
                            const nextRow = document.querySelector(`tr[data-item-row="${index + 1}"]`);
                            if (nextRow) {
                                const firstInput = nextRow.querySelector('input');
                                if (firstInput) firstInput.focus();
                            }
                        }, 50);
                    }
                } else {
                    const rows = Array.from(document.querySelectorAll('[data-items-table] tbody tr'));
                    const currentRowIdx = rows.indexOf(row);
                    if (currentRowIdx < rows.length - 1) {
                        const nextRow = rows[currentRowIdx + 1];
                        const firstInput = nextRow.querySelector('input');
                        if (firstInput) firstInput.focus();
                    }
                }
            } else if (currentIdx !== -1 && currentIdx < inputs.length - 1) {
                inputs[currentIdx + 1].focus();
            }
        }
    };

    // Handle Enter key to move to next input across the form
    const handleFormKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            const target = e.target;
            if (target.closest('[data-items-table]')) return;
            
            e.preventDefault();
            const form = target.closest('[data-form-container]');
            if (!form) return;
            
            const inputs = Array.from(form.querySelectorAll('input:not([data-items-table] input), select:not([data-items-table] select), textarea:not([data-items-table] textarea)'));
            const currentIndex = inputs.indexOf(target);
            
            if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
                inputs[currentIndex + 1].focus();
            }
        }
    };

    // Check if a row is complete (all required fields filled)
    const isRowComplete = (item) => {
        const hasGoodsService = item.goodsService && item.goodsService.trim() !== "";
        const hasQty = item.qty && parseFloat(item.qty) > 0;
        const hasRate = item.rate && parseFloat(item.rate) > 0;
        
        if (withGst) {
            // GST percent can be 0, so we check for empty string or undefined
            const hasGstPercent = item.gstPercent !== "" && item.gstPercent !== undefined && item.gstPercent !== null;
            return hasGoodsService && hasQty && hasRate && hasGstPercent;
        }
        return hasGoodsService && hasQty && hasRate;
    };

    // Check if the current item at index is complete
    const isCurrentRowComplete = (index) => {
        if (index < 0 || index >= formData.items.length) return false;
        return isRowComplete(formData.items[index]);
    };

    // Check if the last row is complete before allowing new row addition
    const canAddNewRow = () => {
        if (formData.items.length === 0) return true;
        const lastItem = formData.items[formData.items.length - 1];
        return isRowComplete(lastItem);
    };

    const addRow = () => {
        if (!canAddNewRow()) {
            setError("Please complete the current row before adding a new one");
            return false;
        }
        const newId = formData.items.length + 1;
        setFormData((prev) => ({
            ...prev,
            items: [...prev.items, { id: newId, goodsService: "", qty: "", rate: "", gstPercent: "", gstType: "Excluded", actualAmount: "", finalAmount: "" }]
        }));
        if (error) setError("");
        return true;
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
        let totalFinalAmt = 0;
        
        formData.items.forEach(item => {
            const actualAmount = parseFloat(item.actualAmount) || 0;
            const finalAmount = parseFloat(item.finalAmount) || 0;
            
            taxableAmt += actualAmount;
            totalFinalAmt += finalAmount;
            totalGst += (finalAmount - actualAmount);
        });
        
        let subTotal = totalFinalAmt;
        const discountAmount = parseFloat(formData.discount) || 0;
        let total = subTotal - discountAmount;
        
        // Add additional charges
        additionalCharges.forEach(c => {
            total += parseFloat(c.amount) || 0;
        });
        
        if (formData.autoRoundOff) {
            total = Math.round(total);
        }
        
        return { taxableAmt, totalGst, subTotal, total };
    };

    const totals = calculateTotals();

    const handleSave = () => {
        if (!formData.supplier.trim()) {
            setError("Supplier is required");
            return;
        }

        const purchaseData = {
            id: isEditMode ? editData.id : String(Date.now()),
            ...formData,
            withGst,
            totalAmount: totals.total,
            taxableAmount: totals.taxableAmt,
            gstAmount: totals.totalGst,
            additionalCharges,
            payments,
        };

        // Increment invoice counter for new invoices
        if (!isEditMode) {
            const currentCounter = getNextInvoiceCounter();
            localStorage.setItem('purchaseInvoiceCounter', String(currentCounter + 1));
        }

        onSave(purchaseData, isEditMode);
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="px-6 py-3 rounded-t-lg shrink-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <h3 className="text-lg font-semibold text-white">
                        Create New Purchase Invoice {withGst ? "" : "(Without GST)"}
                    </h3>
                </div>

                {/* Modal Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col overflow-y-auto" data-form-container onKeyDown={handleFormKeyDown}>
                    {/* Top Section - Supplier & Invoice Details */}
                    <div className="grid grid-cols-2 gap-4 shrink-0">
                        {/* Supplier Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Supplier <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.supplier}
                                    onChange={(e) => handleChange("supplier", e.target.value)}
                                    placeholder="Search supplier or vendor"
                                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm whitespace-nowrap">
                                    + Add Supplier
                                </button>
                            </div>
                        </div>

                        {/* Invoice Number & Date */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Invoice Number <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-1 flex-wrap">
                                    <input
                                        type="text"
                                        value={formData.invoicePrefix}
                                        onChange={(e) => handleChange("invoicePrefix", e.target.value)}
                                        placeholder="Prefix"
                                        className="w-14 min-w-12 border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <input
                                        type="text"
                                        value={formData.invoiceNumber}
                                        readOnly
                                        title="Auto-generated invoice number (locked)"
                                        className="w-20 min-w-20 border border-gray-300 rounded px-2 py-2 text-sm bg-gray-100 text-gray-600 cursor-not-allowed focus:outline-none"
                                    />
                                    <input
                                        type="text"
                                        value={formData.invoiceSuffix}
                                        onChange={(e) => handleChange("invoiceSuffix", e.target.value)}
                                        placeholder="Suffix (optional)"
                                        className="flex-1 min-w-20 border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Supplier Invoice Details Row */}
                    <div className="grid grid-cols-2 gap-4 shrink-0">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Supplier Invoice Number
                            </label>
                            <input
                                type="text"
                                value={formData.supplierInvoiceNumber}
                                onChange={(e) => handleChange("supplierInvoiceNumber", e.target.value)}
                                placeholder="Enter supplier invoice number"
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Supplier Invoice Date
                            </label>
                            <input
                                type="date"
                                value={formData.supplierInvoiceDate}
                                onChange={(e) => handleChange("supplierInvoiceDate", e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="border border-gray-300 rounded-lg overflow-hidden shrink-0 max-h-[250px] overflow-y-auto" data-items-table>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-300 sticky top-0">
                                <tr>
                                    <th className="pl-2 pr-1 py-1.5 text-left font-medium text-gray-700" style={{width: '36px'}}>SR.</th>
                                    <th className="px-1 py-1.5 text-left font-medium text-gray-700">Goods/Service</th>
                                    <th className="px-1 py-1.5 text-left font-medium text-gray-700" style={{width: '70px'}}>Qty</th>
                                    <th className="px-1 py-1.5 text-left font-medium text-gray-700" style={{width: '90px'}}>Rate (₹)</th>
                                    {withGst && (
                                        <>
                                            <th className="px-1 py-1.5 text-left font-medium text-gray-700" style={{width: '90px'}}>GST (%)</th>
                                            <th className="px-1 py-1.5 text-left font-medium text-gray-700" style={{width: '90px'}}>GST Type</th>
                                        </>
                                    )}
                                    <th className="px-1 py-1.5 text-left font-medium text-gray-700" style={{width: '100px'}}>Actual Amt (₹)</th>
                                    <th className="px-1 py-1.5 text-left font-medium text-gray-700" style={{width: '100px'}}>Final Amt (₹)</th>
                                    <th className="px-1 pr-2 py-1.5 text-center font-medium text-gray-700" style={{width: '36px'}}>
                                        <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.items.map((item, index) => (
                                    <tr key={item.id} className="border-b border-gray-200" data-item-row={index}>
                                        <td className="pl-2 pr-1 py-1 text-gray-600 text-center">{index + 1}</td>
                                        <td className="px-1 py-1">
                                            <input
                                                type="text"
                                                value={item.goodsService}
                                                onChange={(e) => handleItemChange(index, "goodsService", e.target.value)}
                                                onKeyDown={(e) => handleItemInputKeyDown(e, index, 0)}
                                                placeholder="Search or select item"
                                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-1 py-1">
                                            <input
                                                type="number"
                                                value={item.qty}
                                                onChange={(e) => handleItemChange(index, "qty", e.target.value)}
                                                onKeyDown={(e) => handleItemInputKeyDown(e, index, 1)}
                                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-1 py-1">
                                            <input
                                                type="number"
                                                value={item.rate}
                                                onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                                                onKeyDown={(e) => handleItemInputKeyDown(e, index, 2, !withGst)}
                                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </td>
                                        {withGst && (
                                            <>
                                                <td className="px-1 py-1">
                                                    <select
                                                        value={item.gstPercent}
                                                        onChange={(e) => handleItemChange(index, "gstPercent", e.target.value)}
                                                        onKeyDown={(e) => handleItemInputKeyDown(e, index, 3)}
                                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        <option value="">GST</option>
                                                        {gstOptions.map(g => <option key={g} value={g}>{g}%</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-1 py-1">
                                                    <select
                                                        value={item.gstType}
                                                        onChange={(e) => handleItemChange(index, "gstType", e.target.value)}
                                                        onKeyDown={(e) => handleItemInputKeyDown(e, index, 4, true)}
                                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        <option value="Excluded">Excluded</option>
                                                        <option value="Included">Included</option>
                                                    </select>
                                                </td>
                                            </>
                                        )}
                                        <td className="px-1 py-1">
                                            <input
                                                type="number"
                                                value={item.actualAmount}
                                                readOnly
                                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-50 focus:outline-none"
                                            />
                                        </td>
                                        <td className="px-1 py-1">
                                            <input
                                                type="number"
                                                value={item.finalAmount}
                                                readOnly
                                                onKeyDown={(e) => handleAmountKeyDown(e, index)}
                                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-50 focus:outline-none"
                                            />
                                        </td>
                                        <td className="px-1 pr-2 py-1 text-center">
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

                    {/* Bottom Section - Payment & Summary */}
                    <div className="grid grid-cols-2 gap-6 shrink-0">
                        {/* Payment Section */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isPaymentMade}
                                    onChange={(e) => handleChange("isPaymentMade", e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-blue-600">Is Payment Made?</span>
                            </label>

                            {formData.isPaymentMade && (
                                <div className="space-y-2 pl-6">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-0.5">Payment Mode</label>
                                            <select
                                                value={formData.paymentMode}
                                                onChange={(e) => handleChange("paymentMode", e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            >
                                                {paymentModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-0.5">Ref. No.</label>
                                            <input
                                                type="text"
                                                value={formData.refNo}
                                                onChange={(e) => handleChange("refNo", e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-0.5">Paid From</label>
                                            <select
                                                value={formData.paidFrom}
                                                onChange={(e) => handleChange("paidFrom", e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            >
                                                {paidFromOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-0.5">Amount (₹)</label>
                                            <input
                                                type="number"
                                                value={formData.paymentAmount}
                                                onChange={(e) => handleChange("paymentAmount", e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                            <label className="flex items-center gap-1 mt-0.5">
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
                                    <button type="button" className="text-blue-600 hover:text-blue-800 text-sm font-medium" onClick={() => setShowAddPayment(true)}>
                                        + Add More Payment
                                    </button>
                                    {showAddPayment && (
                                        <div className="flex gap-2 mt-2">
                                            <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm">
                                                <option value="">Mode</option>
                                                {paymentModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                                            </select>
                                            <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="Amount" className="border border-gray-300 rounded px-2 py-1 text-sm w-24" />
                                            <button type="button" className="px-3 py-1 bg-blue-600 text-white rounded text-sm" onClick={() => {
                                                if (paymentMode && paymentAmount) {
                                                    setPayments([...payments, { mode: paymentMode, amount: paymentAmount }]);
                                                    setPaymentMode("");
                                                    setPaymentAmount("");
                                                    setShowAddPayment(false);
                                                }
                                            }}>Add</button>
                                            <button type="button" className="px-2 py-1 text-xs text-gray-500" onClick={() => setShowAddPayment(false)}>Cancel</button>
                                        </div>
                                    )}
                                    {payments.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {payments.map((p, i) => (
                                                <div key={i} className="flex justify-between text-xs text-gray-700">
                                                    <span>{p.mode}</span>
                                                    <span>₹{parseFloat(p.amount).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Summary Section */}
                        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                            <h4 className="font-medium text-gray-700 mb-2 text-sm">Summary</h4>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Taxable Amt. (Pre-Tax)</span>
                                <span>₹{totals.taxableAmt.toFixed(2)}</span>
                            </div>
                            {withGst && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Tax Amount (GST)</span>
                                    <span className="text-green-600">₹{totals.totalGst.toFixed(2)}</span>
                                </div>
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
                            <button type="button" className="text-blue-600 text-sm" onClick={() => setShowAddCharge(true)}>+ Add another charges</button>
                            {showAddCharge && (
                                <div className="flex gap-2 mt-2">
                                    <input type="text" value={chargeName} onChange={e => setChargeName(e.target.value)} placeholder="Charge Name" className="border border-gray-300 rounded px-2 py-1 text-sm" />
                                    <input type="number" value={chargeAmount} onChange={e => setChargeAmount(e.target.value)} placeholder="Amount" className="border border-gray-300 rounded px-2 py-1 text-sm w-24" />
                                    <button type="button" className="px-3 py-1 bg-blue-600 text-white rounded text-sm" onClick={() => {
                                        if (chargeName && chargeAmount) {
                                            setAdditionalCharges([...additionalCharges, { name: chargeName, amount: chargeAmount }]);
                                            setChargeName("");
                                            setChargeAmount("");
                                            setShowAddCharge(false);
                                        }
                                    }}>Add</button>
                                    <button type="button" className="px-2 py-1 text-xs text-gray-500" onClick={() => setShowAddCharge(false)}>Cancel</button>
                                </div>
                            )}
                            {additionalCharges.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {additionalCharges.map((c, i) => (
                                        <div key={i} className="flex justify-between text-xs text-gray-700">
                                            <span>{c.name}</span>
                                            <span>₹{parseFloat(c.amount).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
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
                            <div className="flex justify-between text-base font-semibold border-t pt-1.5 mt-1">
                                <span>Total Amount</span>
                                <span>₹{totals.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 shrink-0">{error}</p>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg shrink-0">
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
                            className="px-4 py-2 text-sm text-white rounded transition-colors flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
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
 * PurchasePage
 * - Frontend-only purchase invoice management
 * - Supports both With GST and Without GST invoices
 * - Excel-like table with row highlighting and cell selection
 */
export default function PurchasePage() {
    const [invoices, setInvoices] = useState([]);
    const [selectedCell, setSelectedCell] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState(null);
    const [invoiceType, setInvoiceType] = useState("withGst"); // "withGst" or "withoutGst"
    const [activeTab, setActiveTab] = useState("all"); // "all", "withGst", "withoutGst"
    const [bankAccounts, setBankAccounts] = useState([]);
    const [gstRates, setGstRates] = useState([]);

    // Load bank accounts and GST rates from localStorage (simulating fetch from tables)
    useEffect(() => {
        // Load bank accounts
        const savedBankAccounts = localStorage.getItem("bankAccounts");
        if (savedBankAccounts) {
            try {
                setBankAccounts(JSON.parse(savedBankAccounts));
            } catch (e) {
                console.error("Error loading bank accounts:", e);
            }
        }

        // Load GST rates
        const savedGstRates = localStorage.getItem("gstRates");
        if (savedGstRates) {
            try {
                setGstRates(JSON.parse(savedGstRates));
            } catch (e) {
                console.error("Error loading GST rates:", e);
            }
        }
    }, []);

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
                    <h2 className="text-lg font-semibold text-gray-900">Purchase</h2>
                    <button className="text-gray-400 hover:text-yellow-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleOpenCreate("withGst")}
                        className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
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
                    className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${activeTab === "withGst" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}
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
                    <table className="min-w-[1200px] w-full border-collapse text-sm" style={{ borderSpacing: 0 }}>
                        <thead className="sticky top-0 z-10 bg-white">
                            <tr className="border-b border-gray-400">
                                <th className="min-w-[110px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Date</span>
                                    </div>
                                </th>
                                <th className="min-w-[140px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Invoice No.</span>
                                    </div>
                                </th>
                                <th className="min-w-[180px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Supplier</span>
                                    </div>
                                </th>
                                <th className="min-w-[130px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Amount</span>
                                    </div>
                                </th>
                                <th className="min-w-[110px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>GST</span>
                                    </div>
                                </th>
                                <th className="min-w-[120px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Type</span>
                                    </div>
                                </th>
                                <th className="min-w-[110px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Payment</span>
                                    </div>
                                </th>
                                <th className="min-w-[100px] h-9 px-4 text-left text-sm font-medium text-gray-700 sticky right-0 z-10 bg-gray-100" style={{ boxShadow: '-2px 0 0 0 #000' }}>
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
                                        {invoice.supplier}
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
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${invoice.withGst ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {invoice.withGst ? "With GST" : "Without GST"}
                                        </span>
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 6) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 6)}
                                    >
                                        {invoice.isPaymentMade ? (
                                            <span className="text-green-600 text-xs">✓ Paid</span>
                                        ) : (
                                            <span className="text-yellow-600 text-xs">Pending</span>
                                        )}
                                    </td>
                                    <td className={`h-8 px-4 text-left sticky right-0 z-10 ${rowIndex % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`} style={{ boxShadow: '-2px 0 0 0 #000' }}>
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
                                        <td className={`h-8 px-4 sticky right-0 z-10 ${rowIndex % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`} style={{ boxShadow: '-2px 0 0 0 #000' }}></td>
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

            {/* Purchase Invoice Modal */}
            <PurchaseInvoiceModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveInvoice}
                onDelete={handleDeleteInvoice}
                editData={editingInvoice}
                withGst={invoiceType === "withGst"}
                bankAccounts={bankAccounts}
                gstRates={gstRates}
            />
        </div>
    );
}
