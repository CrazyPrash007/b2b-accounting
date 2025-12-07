import React, { useEffect, useState } from 'react';

/**
 * PurchaseInvoiceModal - Modal for creating/editing purchase invoices
 * Mirrors Sales modal behavior: suggestions from server, rate autofill from selected item,
 * no localStorage persistence for invoices (server is source of truth).
 *
 * Props:
 *  - isOpen, onClose, onSave(purchaseData, isEdit), onDelete(id), editData
 *  - withGst (bool), bankAccounts (array), gstRates (array)  <-- bankAccounts/gstRates are optional; modal will fetch if not provided
 */
export default function PurchaseInvoiceModal({
    isOpen,
    onClose,
    onSave,
    onDelete,
    editData,
    withGst = true,
    bankAccounts: bankAccountsProp = [],
    gstRates: gstRatesProp = []
}) {
    // lists loaded from server (or props)
    const [bankAccounts, setBankAccounts] = useState(Array.isArray(bankAccountsProp) ? bankAccountsProp : []);
    const [gstList, setGstList] = useState(Array.isArray(gstRatesProp) ? gstRatesProp.map(g => (g && g.rate != null) ? String(g.rate) : String(g)) : []);
    const [suppliersList, setSuppliersList] = useState([]); // merged customers + vendors (display strings)
    const [itemsList, setItemsList] = useState([]); // full item objects

    // form state
    const [formData, setFormData] = useState({
        supplier: "",
        invoicePrefix: "PUR",
        invoiceNumber: "", // server should ideally assign; allow manual if desired
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
        description: ""
    });

    const [additionalCharges, setAdditionalCharges] = useState([]);
    const [showAddCharge, setShowAddCharge] = useState(false);
    const [chargeName, setChargeName] = useState("");
    const [chargeAmount, setChargeAmount] = useState("");

    const [payments, setPayments] = useState([]);
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [paymentMode, setPaymentMode] = useState("");
    const [paymentAmount, setPaymentAmount] = useState("");

    const [error, setError] = useState("");
    const isEditMode = !!editData;

    // Default GST options if none available
    const defaultGstOptions = ["0", "5", "12", "18", "28"];

    // Default payment modes
    const defaultPaymentModes = ["Cash", "UPI", "Credit Card", "Debit Card", "Cheque"];

    // Fetch suggestion lists when modal opens (unless parent supplied them)
    useEffect(() => {
        let mounted = true;

        const parseJsonSafe = async (res) => {
            const body = await res.json().catch(() => null);
            if (!body) return null;
            if (typeof body === "object" && Object.prototype.hasOwnProperty.call(body, "data")) return body.data;
            return body;
        };

        async function fetchLists() {
            try {
                // if parent passed them, respect props (but still fetch missing ones)
                const toFetch = [
                    (!suppliersList.length) ? fetch('/api/customers') : null,
                    (!suppliersList.length) ? fetch('/api/vendors') : null,
                    (!itemsList.length) ? fetch('/api/items') : null,
                    (!gstList.length) ? fetch('/api/gst') : null,
                    (!bankAccounts.length) ? fetch('/api/bank') : null
                ].filter(Boolean);

                if (!toFetch.length) return;

                const promises = await Promise.allSettled(toFetch);

                const parseSettled = async (s) => {
                    if (s.status !== "fulfilled") return [];
                    const r = s.value;
                    if (!r || !r.ok) {
                        return [];
                    }
                    const parsed = await parseJsonSafe(r);
                    return Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
                };

                // Map in same request order (customers, vendors, items, gst, bank) depending on which were requested
                const results = await Promise.all(promises.map(p => parseSettled(p)));

                // Determine which results correspond to which endpoint by checking lengths and what we requested.
                // Simpler approach: re-fetch individually if we need fine control.
            } catch (err) {
                console.warn("Failed to bulk fetch lists for purchase modal", err);
            }
        }

        // Simpler robust fetch: fetch each required endpoint individually only if missing
        async function fetchIfMissing() {
            try {
                if (!suppliersList.length) {
                    const [cRes, vRes] = await Promise.allSettled([fetch('/api/customers'), fetch('/api/vendors')]);
                    const parse = async (r) => {
                        if (!r || r.status !== 200) return [];
                        const body = await r.json().catch(() => null);
                        return Array.isArray(body && body.data ? body.data : body) ? (body.data || body) : [];
                    };
                    const customers = cRes.status === 'fulfilled' ? await parse(cRes.value) : [];
                    const vendors = vRes.status === 'fulfilled' ? await parse(vRes.value) : [];
                    // normalize display strings
                    const normalize = arr => (Array.isArray(arr) ? arr.map(c => {
                        if (!c) return null;
                        if (typeof c === 'string') return c;
                        return c.displayName || c.fullName || c.name || c.companyName || (c.email ? `${c.email}` : null);
                    }).filter(Boolean) : []);
                    const merged = Array.from(new Set([...(normalize(customers)), ...(normalize(vendors))]));
                    if (mounted) setSuppliersList(merged);
                }

                if (!itemsList.length) {
                    const res = await fetch('/api/items');
                    if (res && res.ok) {
                        const body = await res.json().catch(() => null);
                        const data = body && body.data ? body.data : (Array.isArray(body) ? body : []);
                        // ensure display name for each item
                        const itemsNormalized = (Array.isArray(data) ? data : []).map(it => {
                            if (!it) return null;
                            const title = it.itemName || it.name || it.title || it.displayName || "";
                            return { ...it, _displayName: title, displayName: title };
                        }).filter(Boolean);
                        if (mounted) setItemsList(itemsNormalized);
                    }
                }

                if (!gstList.length) {
                    const res = await fetch('/api/gst');
                    if (res && res.ok) {
                        const body = await res.json().catch(() => null);
                        const data = body && body.data ? body.data : (Array.isArray(body) ? body : []);
                        const gstNormalized = (Array.isArray(data) ? data : [])
                            .map(g => {
                                if (!g) return null;
                                if (typeof g === "number") return String(g);
                                if (typeof g === "string") return g;
                                if (g.rate != null) return String(g.rate);
                                return null;
                            })
                            .filter(Boolean);
                        if (mounted) setGstList(gstNormalized.length ? Array.from(new Set(gstNormalized)) : defaultGstOptions);
                    } else {
                        if (mounted && !gstList.length) setGstList(defaultGstOptions);
                    }
                }

                if (!bankAccounts.length) {
                    const res = await fetch('/api/bank');
                    if (res && res.ok) {
                        const body = await res.json().catch(() => null);
                        const data = body && body.data ? body.data : (Array.isArray(body) ? body : []);
                        const bankNormalized = (Array.isArray(data) ? data : [])
                            .map(b => {
                                if (!b) return null;
                                const display = b.accountDisplayName || b.bankName || b.name || (b.accountNumber ? `Acct ${b.accountNumber}` : null);
                                return { ...b, accountDisplayName: display };
                            })
                            .filter(Boolean);
                        if (mounted) setBankAccounts(bankNormalized);
                    }
                }
            } catch (err) {
                console.error("Error fetching purchase modal lists:", err);
            }
        }

        if (isOpen) fetchIfMissing();

        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // When modal opens in edit mode, seed form and helper arrays
    useEffect(() => {
        if (!isOpen) return;

        if (editData) {
            setFormData({
                supplier: editData.supplier || "",
                invoicePrefix: editData.invoicePrefix || "PUR",
                invoiceNumber: editData.invoiceNumber || "",
                invoiceSuffix: editData.invoiceSuffix || "",
                invoiceDate: editData.invoiceDate ? new Date(editData.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                supplierInvoiceNumber: editData.supplierInvoiceNumber || "",
                supplierInvoiceDate: editData.supplierInvoiceDate || "",
                items: editData.items && Array.isArray(editData.items) && editData.items.length ? editData.items.map((it, i) => ({
                    id: it.id || i + 1,
                    goodsService: it.goodsService || it.name || "",
                    qty: it.qty ?? (it.quantity ?? ""),
                    rate: it.rate ?? it.sellPrice ?? it.price ?? it.buyPrice ?? "",
                    gstPercent: it.gstPercent ?? (it.gstRate ?? ""),
                    gstType: it.gstType || "Excluded",
                    actualAmount: it.actualAmount ?? it.actualAmount,
                    finalAmount: it.finalAmount ?? it.finalAmount,
                    itemId: it.itemId || it._id || null
                })) : [{ id: 1, goodsService: "", qty: "", rate: "", gstPercent: "", gstType: "Excluded", actualAmount: "", finalAmount: "" }],
                isPaymentMade: editData.isPaymentMade ?? true,
                paymentMode: editData.paymentMode || "Cash",
                refNo: editData.refNo || "",
                paidFrom: editData.paidFrom || "Cash-in-Hand",
                paymentAmount: editData.paymentAmount || "0",
                payFull: editData.payFull || false,
                discount: editData.discount || "",
                autoRoundOff: editData.autoRoundOff ?? true,
                description: editData.description || ""
            });
            setAdditionalCharges(editData.additionalCharges || []);
            setPayments(editData.payments || []);
            setError("");
        } else {
            // New invoice: reset (leave invoiceNumber blank for server-side numbering)
            setFormData({
                supplier: "",
                invoicePrefix: "PUR",
                invoiceNumber: "",
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
                description: ""
            });
            setAdditionalCharges([]);
            setPayments([]);
            setError("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, editData]);

    // Try to autofill rate from selected item name
    const tryAutoFillRate = (value) => {
        if (!value) return "";
        const match = itemsList.find(i => {
            const name = (i._displayName || i.itemName || i.name || "").toString().trim().toLowerCase();
            return name && name === value.toString().trim().toLowerCase();
        });
        if (!match) return "";
        const rateVal = match.sellPrice ?? match.rate ?? match.price ?? match.buyPrice ?? "";
        return rateVal != null ? String(rateVal) : "";
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (error) setError("");
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };

        // If goodsService changed, try autofill rate
        if (field === "goodsService") {
            const autoRate = tryAutoFillRate(value);
            if (autoRate !== "") newItems[index].rate = autoRate;
        }

        // Calculate amounts if qty and rate are available
        const qty = parseFloat(newItems[index].qty) || 0;
        const rate = parseFloat(newItems[index].rate) || 0;
        const gstPercent = parseFloat(newItems[index].gstPercent) || 0;
        const gstType = newItems[index].gstType || "Excluded";

        let actualAmount = 0;
        let finalAmount = 0;

        if (withGst && gstPercent > 0) {
            if (gstType === "Excluded") {
                actualAmount = qty * rate;
                finalAmount = actualAmount + (actualAmount * gstPercent / 100);
            } else {
                finalAmount = qty * rate;
                actualAmount = finalAmount / (1 + gstPercent / 100);
            }
        } else {
            actualAmount = qty * rate;
            finalAmount = actualAmount;
        }

        newItems[index].actualAmount = actualAmount > 0 ? actualAmount.toFixed(2) : "";
        newItems[index].finalAmount = finalAmount > 0 ? finalAmount.toFixed(2) : "";
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleAmountKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault();
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

    const handleItemInputKeyDown = (e, index, fieldIndex, isLastField = false) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const row = e.target.closest('tr');
            if (!row) return;
            const inputs = Array.from(row.querySelectorAll('input, select'));
            const currentIdx = inputs.indexOf(e.target);

            if (isLastField || currentIdx >= inputs.length - 1) {
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

    const isRowComplete = (item) => {
        const hasGoodsService = item.goodsService && item.goodsService.trim() !== "";
        const hasQty = item.qty && parseFloat(item.qty) > 0;
        const hasRate = item.rate && parseFloat(item.rate) > 0;

        if (withGst) {
            const hasGstPercent = item.gstPercent !== "" && item.gstPercent !== undefined && item.gstPercent !== null;
            return hasGoodsService && hasQty && hasRate && hasGstPercent;
        }
        return hasGoodsService && hasQty && hasRate;
    };

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
        setFormData(prev => ({ ...prev, items: [...prev.items, { id: newId, goodsService: "", qty: "", rate: "", gstPercent: "", gstType: "Excluded", actualAmount: "", finalAmount: "" }] }));
        if (error) setError("");
        return true;
    };

    const removeRow = (index) => {
        if (formData.items.length > 1) {
            setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
        }
    };

    // Totals (UI only)
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

        additionalCharges.forEach(c => {
            total += parseFloat(c.amount) || 0;
        });

        if (formData.autoRoundOff) {
            total = Math.round(total);
        }

        return { taxableAmt, totalGst, subTotal, total };
    };

    const totals = calculateTotals();

    // SAVE: normalize payload and call parent onSave
    const handleSave = () => {
        if (!formData.supplier || !formData.supplier.trim()) {
            setError("Supplier is required");
            return;
        }

        if (!Array.isArray(formData.items) || formData.items.length === 0) {
            setError("At least one item is required");
            return;
        }

        const payload = {
            // do not rely on client id; server will assign _id
            ...formData,
            withGst,
            totalAmount: totals.total,
            taxableAmount: totals.taxableAmt,
            gstAmount: totals.totalGst,
            additionalCharges,
            payments
        };

        // do not update invoice counter in localStorage — server should manage numbering
        onSave(payload, isEditMode);
        // modal will be closed by parent if parent follows Sales pattern; still close locally for safety
        setIsModalOpenLocalFalse();
    };

    // helper to closes modal locally (used after save to avoid stuck modal if parent doesn't close)
    function setIsModalOpenLocalFalse() {
        // attempt to close; parent may choose to reload and close
        try {
            onClose && onClose();
        } catch (e) {
            /* noop */
        }
    }

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // handle adding additional charge
    const addCharge = () => {
        if (!chargeName || !chargeAmount) return;
        setAdditionalCharges(prev => [...prev, { name: chargeName, amount: chargeAmount }]);
        setChargeName("");
        setChargeAmount("");
        setShowAddCharge(false);
    };

    // handle adding payment split
    const addPaymentSplit = () => {
        if (!paymentMode || !paymentAmount) return;
        setPayments(prev => [...prev, { mode: paymentMode, amount: paymentAmount }]);
        setPaymentMode("");
        setPaymentAmount("");
        setShowAddPayment(false);
    };

    // Delete handler calls parent onDelete with id (parent will call server)
    const handleDeleteClick = () => {
        if (!isEditMode) return;
        const id = editData?._id || editData?.id;
        if (!id) return;
        if (!window.confirm("Are you sure you want to delete this purchase invoice?")) return;
        onDelete && onDelete(id);
    };

    // If modal not open, nothing to render
    if (!isOpen) return null;

    // Payment mode and paidFrom options
    const bankAccountOptions = bankAccounts.map(acc => acc.accountDisplayName || acc.bankName).filter(Boolean);
    const paymentModes = [...defaultPaymentModes, ...bankAccountOptions];
    const paidFromOptions = ["Cash-in-Hand", ...bankAccountOptions, "Petty Cash"];
    const gstOptions = gstList.length ? gstList.map(g => String(g)) : defaultGstOptions;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleBackdropClick}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-3 rounded-t-lg shrink-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <h3 className="text-lg font-semibold text-white">
                        {isEditMode ? "Edit Purchase Invoice" : "Create New Purchase Invoice"} {withGst ? "" : "(Without GST)"}
                    </h3>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col overflow-y-auto" data-form-container onKeyDown={handleFormKeyDown}>
                    {/* Supplier & Invoice row */}
                    <div className="grid grid-cols-2 gap-4 shrink-0">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Supplier <span className="text-red-500">*</span></label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.supplier}
                                    onChange={(e) => handleChange('supplier', e.target.value)}
                                    placeholder="Search supplier or vendor"
                                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    list="suppliers-datalist"
                                />
                                <datalist id="suppliers-datalist">
                                    {suppliersList.map((s, idx) => <option key={idx} value={s} />)}
                                </datalist>
                                <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm whitespace-nowrap">+ Add Supplier</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number <span className="text-red-500">*</span></label>
                                <div className="flex gap-1 flex-wrap">
                                    <input type="text" value={formData.invoicePrefix} onChange={(e) => handleChange('invoicePrefix', e.target.value)} placeholder="Prefix" className="w-14 min-w-12 border border-gray-300 rounded px-2 py-2 text-sm" />
                                    <input type="text" value={formData.invoiceNumber} onChange={(e) => handleChange('invoiceNumber', e.target.value)} placeholder="Invoice #" className="w-20 min-w-20 border border-gray-300 rounded px-2 py-2 text-sm" />
                                    <input type="text" value={formData.invoiceSuffix} onChange={(e) => handleChange('invoiceSuffix', e.target.value)} placeholder="Suffix (optional)" className="flex-1 min-w-20 border border-gray-300 rounded px-2 py-2 text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date <span className="text-red-500">*</span></label>
                                <input type="date" value={formData.invoiceDate} onChange={(e) => handleChange('invoiceDate', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Supplier invoice row */}
                    <div className="grid grid-cols-2 gap-4 shrink-0">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Invoice Number</label>
                            <input type="text" value={formData.supplierInvoiceNumber} onChange={(e) => handleChange('supplierInvoiceNumber', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Invoice Date</label>
                            <input type="date" value={formData.supplierInvoiceDate} onChange={(e) => handleChange('supplierInvoiceDate', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                        </div>
                    </div>

                    {/* Items table (same layout as before) */}
                    <div className="border border-gray-300 rounded-lg overflow-hidden shrink-0 max-h-[250px] overflow-y-auto" data-items-table>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-300 sticky top-0">
                                <tr>
                                    <th className="pl-2 pr-1 py-1.5 text-left font-medium text-gray-700" style={{ width: '36px' }}>SR.</th>
                                    <th className="px-1 py-1.5 text-left font-medium text-gray-700">Goods/Service</th>
                                    <th className="px-1 py-1.5 text-left font-medium text-gray-700" style={{ width: '70px' }}>Qty</th>
                                    <th className="px-1 py-1.5 text-left font-medium text-gray-700" style={{ width: '90px' }}>Rate (₹)</th>
                                    {withGst && (
                                        <>
                                            <th className="px-1 py-1.5 text-left font-medium text-gray-700" style={{ width: '90px' }}>GST (%)</th>
                                            <th className="px-1 py-1.5 text-left font-medium text-gray-700" style={{ width: '90px' }}>GST Type</th>
                                        </>
                                    )}
                                    <th className="px-1 py-1.5 text-left font-medium text-gray-700" style={{ width: '100px' }}>Actual Amt (₹)</th>
                                    <th className="px-1 py-1.5 text-left font-medium text-gray-700" style={{ width: '100px' }}>Final Amt (₹)</th>
                                    <th className="px-1 pr-2 py-1.5 text-center font-medium text-gray-700" style={{ width: '36px' }}>
                                        <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
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
                                                list="purchase-items-datalist"
                                            />
                                            <datalist id="purchase-items-datalist">
                                                {itemsList.map((it, idx) => <option key={idx} value={it._displayName || it.displayName || it.itemName || it.name} />)}
                                            </datalist>
                                        </td>
                                        <td className="px-1 py-1">
                                            <input type="number" value={item.qty} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} onKeyDown={(e) => handleItemInputKeyDown(e, index, 1)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                                        </td>
                                        <td className="px-1 py-1">
                                            <input type="number" value={item.rate} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} onKeyDown={(e) => handleItemInputKeyDown(e, index, 2, !withGst)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                                        </td>
                                        {withGst && (
                                            <>
                                                <td className="px-1 py-1">
                                                    <select value={item.gstPercent} onChange={(e) => handleItemChange(index, 'gstPercent', e.target.value)} onKeyDown={(e) => handleItemInputKeyDown(e, index, 3)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm">
                                                        <option value="">GST</option>
                                                        {gstOptions.map(g => <option key={g} value={g}>{g}%</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-1 py-1">
                                                    <select value={item.gstType} onChange={(e) => handleItemChange(index, 'gstType', e.target.value)} onKeyDown={(e) => handleItemInputKeyDown(e, index, 4, true)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm">
                                                        <option value="Excluded">Excluded</option>
                                                        <option value="Included">Included</option>
                                                    </select>
                                                </td>
                                            </>
                                        )}
                                        <td className="px-1 py-1">
                                            <input type="number" value={item.actualAmount} readOnly className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-50" />
                                        </td>
                                        <td className="px-1 py-1">
                                            <input type="number" value={item.finalAmount} readOnly onKeyDown={(e) => handleAmountKeyDown(e, index)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-50" />
                                        </td>
                                        <td className="px-1 pr-2 py-1 text-center">
                                            {formData.items.length > 1 && (
                                                <button onClick={() => removeRow(index)} className="text-red-500 hover:text-red-700">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Payments & Summary */}
                    <div className="grid grid-cols-2 gap-6 shrink-0">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={formData.isPaymentMade} onChange={(e) => handleChange('isPaymentMade', e.target.checked)} className="rounded border-gray-300 text-blue-600" />
                                <span className="text-sm font-medium text-blue-600">Is Payment Made?</span>
                            </label>

                            {formData.isPaymentMade && (
                                <div className="space-y-2 pl-6">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-0.5">Payment Mode</label>
                                            <select value={formData.paymentMode} onChange={(e) => handleChange('paymentMode', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm">
                                                {paymentModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-0.5">Ref. No.</label>
                                            <input type="text" value={formData.refNo} onChange={(e) => handleChange('refNo', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-0.5">Paid From</label>
                                            <select value={formData.paidFrom} onChange={(e) => handleChange('paidFrom', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm">
                                                {paidFromOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-0.5">Amount (₹)</label>
                                            <input type="number" value={formData.paymentAmount} onChange={(e) => handleChange('paymentAmount', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                                            <label className="flex items-center gap-1 mt-0.5">
                                                <input type="checkbox" checked={formData.payFull} onChange={(e) => handleChange('payFull', e.target.checked)} className="rounded border-gray-300 text-blue-600" />
                                                <span className="text-xs text-gray-500">Pay full</span>
                                            </label>
                                        </div>
                                    </div>

                                    <button type="button" className="text-blue-600 text-sm" onClick={() => setShowAddPayment(true)}>+ Add More Payment</button>

                                    {showAddPayment && (
                                        <div className="flex gap-2 mt-2">
                                            <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm">
                                                <option value="">Mode</option>
                                                {paymentModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                                            </select>
                                            <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="Amount" className="border border-gray-300 rounded px-2 py-1 text-sm w-24" />
                                            <button type="button" className="px-3 py-1 bg-blue-600 text-white rounded text-sm" onClick={addPaymentSplit}>Add</button>
                                            <button type="button" className="px-2 py-1 text-xs text-gray-500" onClick={() => setShowAddPayment(false)}>Cancel</button>
                                        </div>
                                    )}

                                    {payments.length > 0 && (<div className="mt-2 space-y-1">{payments.map((p, i) => (<div key={i} className="flex justify-between text-xs text-gray-700"><span>{p.mode}</span><span>₹{parseFloat(p.amount).toFixed(2)}</span></div>))}</div>)}
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                            <h4 className="font-medium text-gray-700 mb-2 text-sm">Summary</h4>
                            <div className="flex justify-between text-sm"><span className="text-gray-600">Taxable Amt. (Pre-Tax)</span><span>₹{totals.taxableAmt.toFixed(2)}</span></div>
                            {withGst && (<div className="flex justify-between text-sm"><span className="text-gray-600">Tax Amount (GST)</span><span className="text-green-600">₹{totals.totalGst.toFixed(2)}</span></div>)}
                            <div className="flex justify-between text-sm"><span className="text-gray-600">Sub Total</span><span>₹{totals.subTotal.toFixed(2)}</span></div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-gray-600">Discount</span>
                                <input type="number" value={formData.discount} onChange={(e) => handleChange('discount', e.target.value)} placeholder="0" className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right" />
                            </div>

                            <button type="button" className="text-blue-600 text-sm" onClick={() => setShowAddCharge(true)}>+ Add another charges</button>
                            {showAddCharge && (
                                <div className="flex gap-2 mt-2">
                                    <input type="text" value={chargeName} onChange={e => setChargeName(e.target.value)} placeholder="Charge Name" className="border border-gray-300 rounded px-2 py-1 text-sm" />
                                    <input type="number" value={chargeAmount} onChange={e => setChargeAmount(e.target.value)} placeholder="Amount" className="border border-gray-300 rounded px-2 py-1 text-sm w-24" />
                                    <button type="button" className="px-3 py-1 bg-blue-600 text-white rounded text-sm" onClick={addCharge}>Add</button>
                                    <button type="button" className="px-2 py-1 text-xs text-gray-500" onClick={() => setShowAddCharge(false)}>Cancel</button>
                                </div>
                            )}

                            {additionalCharges.length > 0 && (<div className="mt-2 space-y-1">{additionalCharges.map((c, i) => (<div key={i} className="flex justify-between text-xs text-gray-700"><span>{c.name}</span><span>₹{parseFloat(c.amount).toFixed(2)}</span></div>))}</div>)}

                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={formData.autoRoundOff} onChange={(e) => handleChange('autoRoundOff', e.target.checked)} className="rounded border-gray-300 text-blue-600" />
                                <span className="text-sm text-gray-600">Auto Round Off</span>
                                <span className="ml-auto text-sm">₹0.00</span>
                            </label>

                            <div className="flex justify-between text-base font-semibold border-t pt-1.5 mt-1">
                                <span>Total Amount</span>
                                <span>₹{totals.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500 shrink-0">{error}</p>}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg shrink-0">
                    {isEditMode ? (
                        <button type="button" onClick={handleDeleteClick} className="px-4 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50">Delete</button>
                    ) : <div></div>}
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-100">Cancel</button>
                        <button type="button" onClick={handleSave} className="px-4 py-2 text-sm text-white rounded bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                            Save Invoice
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
