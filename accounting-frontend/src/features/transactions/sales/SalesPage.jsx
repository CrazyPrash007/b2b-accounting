// SalesPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useSale from "./hooks/useSale";
import saleApi from "./api/sale.api";
import PdfPreviewModal from "../../../components/PdfPreviewModal";
import { getCurrentCompany } from "../../../services/companyContextAccessor";
import { exportTableToExcel } from "../../../utils/excelExport";
import { authFetch } from "../../../services/apiClient";
import { useModal } from "../../../hooks/useModal";
import CustomerModal from "../../party/customer/components/CustomerModal";
import ItemModal from "../../items/items/components/ItemModal";

// SalesInvoiceModal - replaces the existing modal in SalesPage.jsx
function SalesInvoiceModal({ isOpen, onClose, onSave, onDelete, editData, withGst = true, bankAccounts: bankAccountsProp = [], gstRates: gstRatesProp = [] }) {
    const navigate = useNavigate();
    const { openModal, closeModal } = useModal();
    const API_BASE = "http://localhost:4000";
    
    // Get next invoice counter from localStorage or start at 1
    const getNextInvoiceCounter = () => {
        const saved = localStorage.getItem('salesInvoiceCounter');
        return saved ? parseInt(saved, 10) : 1;
    };

    const [formData, setFormData] = useState({
        customer: "",
        invoicePrefix: "INV",
        invoiceNumber: String(getNextInvoiceCounter()).padStart(6, '0'),
        invoiceSuffix: "",
        invoiceDate: new Date().toISOString().split('T')[0],
        // <-- make sure new items have both goodsService and name
        items: [{ id: 1, goodsService: "", name: "", qty: "1", rate: "", gstPercent: "", gstType: "Included", actualAmount: "", finalAmount: "" }],
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

    // Advance payment state
    const [availableAdvances, setAvailableAdvances] = useState([]);
    const [selectedAdvance, setSelectedAdvance] = useState(null);
    const [applyAdvance, setApplyAdvance] = useState(false);
    const [advanceAmount, setAdvanceAmount] = useState("");

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

    const isEditMode = !!editData;

    // Lists from backend / cached
    const [customersList, setCustomersList] = useState([]); // array of customer display strings (or objects)
    const [itemsList, setItemsList] = useState([]); // array of item objects
    const [gstList, setGstList] = useState([]); // array of rate strings
    const [bankAccounts, setBankAccounts] = useState(bankAccountsProp || []);

    const [listsLoading, setListsLoading] = useState(false);
    const [listsError, setListsError] = useState(null);

    // Autocomplete dropdown state
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [customerSearchTerm, setCustomerSearchTerm] = useState("");

    // Default GST options if no rates provided from props/api
    const defaultGstOptions = ["0", "5", "12", "18", "28"];

    // Default payment modes + bank accounts from bank table
    const defaultPaymentModes = ["Cash", "UPI", "Credit Card", "Debit Card", "Cheque"];

    useEffect(() => {
        // If parent supplied bank accounts or gstRates, seed them
        if (Array.isArray(bankAccountsProp) && bankAccountsProp.length && !bankAccounts.length) {
            setBankAccounts(bankAccountsProp);
        }
        if (Array.isArray(gstRatesProp) && gstRatesProp.length && (!gstList.length)) {
            const mapped = gstRatesProp.map(g => (g && g.rate != null) ? String(g.rate) : (typeof g === "string" ? g : null)).filter(Boolean);
            setGstList(Array.from(new Set(mapped)));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bankAccountsProp, gstRatesProp]);

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setFormData({
                    customer: editData.customer || "",
                    invoicePrefix: editData.invoicePrefix || "INV",
                    invoiceNumber: editData.invoiceNumber || String(getNextInvoiceCounter()).padStart(6, '0'),
                    invoiceSuffix: editData.invoiceSuffix || "",
                    invoiceDate: editData.invoiceDate || new Date().toISOString().split('T')[0],
                    // map backend items so frontend always has goodsService populated
                    items: (editData.items && Array.isArray(editData.items) && editData.items.length) ? editData.items.map((it, i) => ({
                        id: it.id ?? (i + 1),
                        // prefer goodsService (if some older docs had it), otherwise fallback to 'name'
                        goodsService: (it.goodsService ?? it.name ?? "").toString(),
                        name: (it.name ?? it.goodsService ?? "").toString(),
                        qty: it.qty ?? it.quantity ?? "",
                        // keep compatibility with backend fields (sellPrice / rate)
                        rate: it.rate ?? it.sellPrice ?? it.price ?? "",
                        gstPercent: it.gstPercent ?? it.gstRate ?? "",
                        gstType: it.gstType || "Included",
                        actualAmount: it.actualAmount ?? "",
                        finalAmount: it.finalAmount ?? "",
                        hsnNo: it.hsnNo || "",
                        unit: it.unit || "",
                        itemId: it.itemId || it._id || null
                    })) : [{ id: 1, goodsService: "", name: "", qty: "", rate: "", gstPercent: "", gstType: "Included", actualAmount: "", finalAmount: "" }],
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
                // existing else branch remains the same but ensure new row includes `name` as well:
                const nextCounter = getNextInvoiceCounter();
                setFormData({
                    customer: "",
                    invoicePrefix: "INV",
                    invoiceNumber: String(nextCounter).padStart(6, '0'),
                    invoiceSuffix: "",
                    invoiceDate: new Date().toISOString().split('T')[0],
                    items: [{ id: 1, goodsService: "", name: "", qty: "1", rate: "", gstPercent: "", gstType: "Included", actualAmount: "", finalAmount: "" }],
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
            // fetch suggestions when modal opens (unless already loaded)
            if (!customersList.length || !itemsList.length || !gstList.length || !bankAccounts.length) {
                fetchLists();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, editData]);

    async function parseJsonSafe(res) {
        const body = await res.json().catch(() => null);
        if (!body) return null;
        if (typeof body === "object" && Object.prototype.hasOwnProperty.call(body, "data")) return body.data;
        return body;
    }

    // fetch customers, vendors, items, gst, bank (bank optional)
    const fetchLists = async () => {
        setListsLoading(true);
        setListsError(null);
        try {
            const companyId = getCurrentCompany();
            // NOTE: added /api/vendors to fetch vendors and merge with customers
            const promises = await Promise.allSettled([
                authFetch(`${API_BASE}/api/customers?accountCompanyName=${companyId}`),
                authFetch(`${API_BASE}/api/vendors?accountCompanyName=${companyId}`),    // <-- added vendors
                authFetch(`${API_BASE}/api/items?accountCompanyName=${companyId}`),
                authFetch(`${API_BASE}/api/gst?accountCompanyName=${companyId}`),
                authFetch(`${API_BASE}/api/bank?accountCompanyName=${companyId}`)
            ]);

            const parseSettled = async (s) => {
                if (s.status !== "fulfilled") return [];
                const r = s.value;
                if (!r) return [];
                if (!r.ok) {
                    const txt = await r.text().catch(() => "");
                    console.warn("Non-OK response", r.status, txt);
                    return [];
                }
                const parsed = await parseJsonSafe(r);
                return Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
            };

            // parse in same order as promises
            const [customersData, vendorsData, itemsData, gstData, bankData] = await Promise.all(promises.map(p => parseSettled(p)));

            // normalize customers: prefer displayName, fullName, name, companyName
            const customersNormalized = (Array.isArray(customersData) ? customersData : [])
                .map(c => {
                    if (!c) return null;
                    if (typeof c === "string") return c;
                    return c.displayName || c.fullName || c.name || c.companyName || (c.email ? `${c.email}` : null);
                })
                .filter(Boolean);

            // normalize vendors: same normalization (we want to merge both into one list)
            const vendorsNormalized = (Array.isArray(vendorsData) ? vendorsData : [])
                .map(v => {
                    if (!v) return null;
                    if (typeof v === "string") return v;
                    return v.displayName || v.fullName || v.name || v.companyName || (v.email ? `${v.email}` : null);
                })
                .filter(Boolean);

            // final merged customers+vendors list (unique)
            const mergedCustomers = Array.from(new Set([...customersNormalized, ...vendorsNormalized]));

            // normalize items: keep whole object but ensure name property
            const itemsNormalized = (Array.isArray(itemsData) ? itemsData : [])
                .map(it => {
                    if (!it) return null;
                    const title = it.itemName || it.name || it.title || it.displayName || "";
                    return { ...it, _displayName: title, displayName: title };
                })
                .filter(Boolean);

            const gstNormalized = (Array.isArray(gstData) ? gstData : [])
                .map(g => {
                    if (!g) return null;
                    if (typeof g === "number") return String(g);
                    if (typeof g === "string") return g;
                    if (g.rate != null) return String(g.rate);
                    return null;
                })
                .filter(Boolean);

            const bankNormalized = (Array.isArray(bankData) ? bankData : [])
                .map(b => {
                    if (!b) return null;
                    const display = b.accountDisplayName || b.bankName || b.name || (b.accountNumber ? `Acct ${b.accountNumber}` : null);
                    return { ...b, accountDisplayName: display };
                })
                .filter(Boolean);

            setCustomersList(mergedCustomers);
            setItemsList(itemsNormalized);
            setGstList(gstNormalized.length ? Array.from(new Set(gstNormalized)) : defaultGstOptions);
            if (bankNormalized.length && !bankAccounts.length) setBankAccounts(bankNormalized);
        } catch (err) {
            console.error("Failed to fetch lists for sales modal", err);
            setListsError(err);
        } finally {
            setListsLoading(false);
        }
    };

    // 🎯 Add New Customer Modal (nested)
    const handleAddCustomer = () => {
        openModal(CustomerModal, {
            onClose: () => closeModal(),
            onSave: async (customerData) => {
                try {
                    const companyId = getCurrentCompany();
                    const response = await authFetch(`${API_BASE}/api/customers`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...customerData, accountCompanyName: companyId })
                    });
                    const saved = await response.json();
                    const newCustomer = saved.data || saved;
                    console.log('✅ Customer saved:', newCustomer);
                    
                    // Refresh lists and auto-select new customer
                    await fetchLists();
                    const customerName = newCustomer.customerName || newCustomer.name || newCustomer.displayName || customerData.customerName;
                    handleChange("customer", customerName);
                    closeModal();
                } catch (err) {
                    console.error('❌ Failed to save customer:', err);
                    alert('Failed to save customer. Please try again.');
                }
            }
        });
    };

    // 🎯 Add New Item Modal (nested)
    const handleAddItem = (rowIndex) => {
        openModal(ItemModal, {
            onClose: () => closeModal(),
            onSave: async (itemData) => {
                try {
                    const companyId = getCurrentCompany();
                    const response = await authFetch(`${API_BASE}/api/items`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...itemData, accountCompanyName: companyId })
                    });
                    const saved = await response.json();
                    const newItem = saved.data || saved;
                    console.log('✅ Item saved:', newItem);
                    
                    // Refresh lists and auto-select new item in the row
                    await fetchLists();
                    const itemName = newItem.itemName || newItem.name || itemData.itemName;
                    handleItemChange(rowIndex, "goodsService", itemName);
                    closeModal();
                } catch (err) {
                    console.error('❌ Failed to save item:', err);
                    alert('Failed to save item. Please try again.');
                }
            }
        });
    };

    const tryAutoFillRate = (value) => {
        if (!value) return "";
        const match = itemsList.find(i => {
            const name = (i._displayName || i.itemName || i.name || "").toString().trim().toLowerCase();
            return name && name === value.toString().trim().toLowerCase();
        });
        if (!match) return "";
        // prefer sellPrice, then rate, price, buyPrice
        const rateVal = match.sellPrice ?? match.rate ?? match.price ?? match.buyPrice ?? "";
        return rateVal != null ? String(rateVal) : "";
    };

    // Fetch advance payments for the selected customer
    const fetchAdvancePayments = async (customerName) => {
        if (!customerName || !customerName.trim()) {
            setAvailableAdvances([]);
            setSelectedAdvance(null);
            setApplyAdvance(false);
            setAdvanceAmount("");
            return;
        }

        try {
            const companyId = getCurrentCompany();
            const res = await authFetch(`${API_BASE}/api/receipts?search=${encodeURIComponent(customerName)}&accountCompanyName=${companyId}`);
            if (!res.ok) {
                setAvailableAdvances([]);
                return;
            }
            const body = await parseJsonSafe(res);
            const receipts = Array.isArray(body) ? body : [];

            // Filter for advance payments with remaining balance
            const normalizedCustomer = customerName.toString().trim().toLowerCase();
            const advances = receipts.filter(r => {
                const matchesCustomer = (r.party || "").toString().trim().toLowerCase() === normalizedCustomer;
                // Check if has remaining amount (for new receipts, remainingAmount might not be set, so fallback to amount - usedAmount)
                const remaining = r.remainingAmount !== undefined ? Number(r.remainingAmount) : (Number(r.amount || 0) - Number(r.usedAmount || 0));
                const hasBalance = remaining > 0;
                return matchesCustomer && hasBalance;
            });

            // Add calculated remaining amount to each advance for display
            const advancesWithBalance = advances.map(adv => ({
                ...adv,
                _remainingAmount: adv.remainingAmount !== undefined ? Number(adv.remainingAmount) : (Number(adv.amount || 0) - Number(adv.usedAmount || 0))
            }));

            setAvailableAdvances(advancesWithBalance);
        } catch (err) {
            console.error("Failed to fetch advance payments", err);
            setAvailableAdvances([]);
        }
    };


    // existing helpers (handleItemChange, addRow, etc.) reused with a tweak to auto-fill rate when goodsService set
    const handleChange = (field, value) => {
        setFormData((prev) => {
            const updated = { ...prev, [field]: value };
            
            // If Pay Full checkbox is checked, auto-fill payment amount with total amount or due amount
            if (field === "payFull" && value === true) {
                // In edit mode with partial payments, use due amount
                if (editData && editData.dueAmount != null && editData.dueAmount > 0) {
                    updated.paymentAmount = String(editData.dueAmount);
                } else {
                    // Calculate total based on current state
                    let taxableAmt = 0;
                    let totalGst = 0;
                    let totalFinalAmt = 0;

                    updated.items.forEach(item => {
                        const actualAmount = parseFloat(item.actualAmount) || 0;
                        const finalAmount = parseFloat(item.finalAmount) || 0;
                        taxableAmt += actualAmount;
                        totalFinalAmt += finalAmount;
                        totalGst += (finalAmount - actualAmount);
                    });

                    let subTotal = totalFinalAmt;
                    const discountAmount = parseFloat(updated.discount) || 0;
                    let total = subTotal - discountAmount;

                    additionalCharges.forEach(c => {
                        total += parseFloat(c.amount) || 0;
                    });

                    if (updated.autoRoundOff) {
                        total = Math.round(total);
                    }

                    updated.paymentAmount = String(total);
                }
            }

            // When customer changes, fetch advance payments
            if (field === "customer" && value && value.trim()) {
                setTimeout(() => fetchAdvancePayments(value), 300);
            }
            
            return updated;
        });
        if (error) setError("");
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };

        // If goodsService changed, try to autofill rate and GST synchronously
        if (field === "goodsService") {
            // set the canonical name too so payload and later editing remain consistent
            newItems[index].name = value;
            const match = itemsList.find(i => {
                const name = (i._displayName || i.itemName || i.name || "").toString().trim().toLowerCase();
                return name && name === value.toString().trim().toLowerCase();
            });
            if (match) {
                // Auto-fill rate
                const autoRate = match.sellPrice ?? match.rate ?? match.price ?? match.buyPrice ?? "";
                if (autoRate !== "") {
                    newItems[index].rate = autoRate;
                }
                // Auto-fill and lock GST
                if (match.gstRate != null) {
                    newItems[index].gstPercent = String(match.gstRate);
                    newItems[index].gstLocked = true; // Mark GST as locked
                }
            }
        }

        const qty = parseFloat(newItems[index].qty) || 0;
        const rate = parseFloat(newItems[index].rate) || 0;
        const gstPercent = parseFloat(newItems[index].gstPercent) || 0;
        const gstType = newItems[index].gstType || "Included";

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
        setFormData((prev) => ({ ...prev, items: newItems }));
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

    const isCurrentRowComplete = (index) => {
        if (index < 0 || index >= formData.items.length) return false;
        return isRowComplete(formData.items[index]);
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
        setFormData((prev) => ({
            ...prev,
            items: [...prev.items, { id: newId, goodsService: "", name: "", qty: "", rate: "", gstPercent: "", gstType: "Included", actualAmount: "", finalAmount: "" }]
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
        if (!formData.customer.trim()) {
            setError("Customer is required");
            return;
        }

        // Validate advance application if selected
        if (applyAdvance) {
            if (!selectedAdvance) {
                setError("Please select an advance payment to apply");
                return;
            }
            if (!advanceAmount || Number(advanceAmount) <= 0) {
                setError("Please enter a valid advance amount");
                return;
            }
            const maxAdvance = Number(selectedAdvance._remainingAmount || 0);
            if (Number(advanceAmount) > maxAdvance) {
                setError(`Advance amount cannot exceed available balance of ₹${maxAdvance.toFixed(2)}`);
                return;
            }
            if (Number(advanceAmount) > totals.total) {
                setError("Advance amount cannot exceed invoice total");
                return;
            }
        }

        const salesData = {
            id: isEditMode ? editData.id : String(Date.now()),
            ...formData,
            items: (formData.items || []).map(it => ({ ...it, name: (it.name || it.goodsService || "").toString() })),
            withGst,
            totalAmount: totals.total,
            taxableAmount: totals.taxableAmt,
            gstAmount: totals.totalGst,
            additionalCharges,
            payments,
        };

        // Add advance payment information if applicable
        if (applyAdvance && selectedAdvance && advanceAmount) {
            salesData.advancePayment = {
                receiptId: selectedAdvance._id,
                amount: Number(advanceAmount)
            };
        }

        if (!isEditMode) {
            const currentCounter = getNextInvoiceCounter();
            localStorage.setItem('salesInvoiceCounter', String(currentCounter + 1));
        }

        onSave(salesData, isEditMode);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // UI helpers
    const paymentModes = [...defaultPaymentModes, ...(bankAccounts.map(b => b.accountDisplayName || b.bankName || ""))];
    const depositOptions = ["Cash-in-Hand", ...bankAccounts.map(b => b.accountDisplayName || b.bankName || ""), "Petty Cash"];
    const gstOptions = gstList.length ? gstList.map(g => String(g)) : defaultGstOptions;

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="px-6 py-3 text-white rounded-t-lg shrink-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <h3 className="text-lg font-semibold">
                        Create New Sales Invoice {withGst ? "" : "(Without GST)"}
                    </h3>
                </div>

                {/* Modal Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col overflow-y-auto" data-form-container onKeyDown={handleFormKeyDown}>
                    {/* Top Section - Customer & Invoice Details */}
                    <div className="grid grid-cols-2 gap-4 shrink-0">
                        {/* Customer Selection */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Customer <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.customer}
                                onChange={(e) => {
                                    handleChange("customer", e.target.value);
                                    setCustomerSearchTerm(e.target.value);
                                    setShowCustomerDropdown(true);
                                }}
                                onFocus={() => setShowCustomerDropdown(true)}
                                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                                placeholder="Type to search customer or vendor..."
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            {showCustomerDropdown && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {customersList
                                        .filter(c => c.toLowerCase().includes((formData.customer || "").toLowerCase()))
                                        .map((c, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    handleChange("customer", c);
                                                    setShowCustomerDropdown(false);
                                                }}
                                                className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
                                            >
                                                {c}
                                            </div>
                                        ))}
                                    <div
                                        onClick={() => handleAddCustomer()}
                                        className="px-3 py-2 text-sm text-blue-600 font-semibold hover:bg-blue-50 cursor-pointer border-t border-gray-200"
                                    >
                                        + Add New Customer
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Invoice Number & Date */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6">
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

                    {/* Items Table */}
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
                                            <select
                                                value={item.goodsService}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === "__ADD_NEW_ITEM__") {
                                                        handleAddItem(index);
                                                    } else {
                                                        handleItemChange(index, "goodsService", value);
                                                    }
                                                }}
                                                onKeyDown={(e) => handleItemInputKeyDown(e, index, 0)}
                                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            >
                                                <option value="">-- Select Item --</option>
                                                {itemsList.map((it, idx) => (
                                                    <option key={idx} value={it._displayName || it.displayName || it.itemName || it.name}>
                                                        {it._displayName || it.displayName || it.itemName || it.name}
                                                    </option>
                                                ))}
                                                <option value="__ADD_NEW_ITEM__" className="text-blue-600 font-semibold">+ Add New Item</option>
                                            </select>
                                        </td>
                                        <td className="px-1 py-1">
                                            <input
                                                type="number"
                                                value={item.qty}
                                                onChange={(e) => handleItemChange(index, "qty", e.target.value)}
                                                onKeyDown={(e) => handleItemInputKeyDown(e, index, 1)}
                                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                min="0"
                                                step="1"
                                            />
                                        </td>
                                        <td className="px-1 py-1">
                                            <input
                                                type="number"
                                                value={item.sellPrice || item.rate}
                                                onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                                                onKeyDown={(e) => handleItemInputKeyDown(e, index, 2, !withGst)}
                                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                min="0"
                                                step="0.01"
                                            />
                                        </td>
                                        {withGst && (
                                            <>
                                                <td className="px-1 py-1">
                                                    {item.gstLocked ? (
                                                        <input
                                                            type="text"
                                                            value={item.gstPercent ? `${item.gstPercent}%` : ''}
                                                            readOnly
                                                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                                                        />
                                                    ) : (
                                                        <select
                                                            value={item.gstPercent}
                                                            onChange={(e) => handleItemChange(index, "gstPercent", e.target.value)}
                                                            onKeyDown={(e) => handleItemInputKeyDown(e, index, 3)}
                                                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        >
                                                            <option value="">GST</option>
                                                            {gstOptions.map(g => <option key={g} value={g}>{g}%</option>)}
                                                        </select>
                                                    )}
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
                                    checked={formData.isPaymentReceived}
                                    onChange={(e) => handleChange("isPaymentReceived", e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-blue-600">Is Payment Received?</span>
                            </label>

                            {formData.isPaymentReceived && (
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
                                            <label className="block text-xs text-gray-600 mb-0.5">Deposit to</label>
                                            <select
                                                value={formData.depositTo}
                                                onChange={(e) => handleChange("depositTo", e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            >
                                                {depositOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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

                            {/* Advance Payment Section */}
                            {availableAdvances.length > 0 && !isEditMode && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-blue-900 mb-2">
                                                    Advance Payment Available
                                                </p>
                                                <p className="text-xs text-blue-700 mb-2">
                                                    This customer has {availableAdvances.length} advance payment{availableAdvances.length > 1 ? 's' : ''} with total available balance of ₹{availableAdvances.reduce((sum, adv) => sum + Number(adv._remainingAmount || 0), 0).toFixed(2)}
                                                </p>
                                                <label className="flex items-center gap-2 mb-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={applyAdvance}
                                                        onChange={(e) => {
                                                            setApplyAdvance(e.target.checked);
                                                            if (!e.target.checked) {
                                                                setSelectedAdvance(null);
                                                                setAdvanceAmount("");
                                                            }
                                                        }}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm font-medium text-blue-900">Apply advance to this sale</span>
                                                </label>

                                                {applyAdvance && (
                                                    <div className="space-y-2 pl-6">
                                                        <div>
                                                            <label className="block text-xs text-blue-700 mb-1">Select Advance</label>
                                                            <select
                                                                value={selectedAdvance?._id || ""}
                                                                onChange={(e) => {
                                                                    const adv = availableAdvances.find(a => a._id === e.target.value);
                                                                    setSelectedAdvance(adv || null);
                                                                    if (adv) {
                                                                        setAdvanceAmount(String(adv._remainingAmount));
                                                                    } else {
                                                                        setAdvanceAmount("");
                                                                    }
                                                                }}
                                                                className="w-full border border-blue-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            >
                                                                <option value="">Select an advance payment...</option>
                                                                {availableAdvances.map(adv => (
                                                                    <option key={adv._id} value={adv._id}>
                                                                        {new Date(adv.date).toLocaleDateString()} - Available: ₹{Number(adv._remainingAmount || 0).toFixed(2)} ({adv.paymentMethod})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        {selectedAdvance && (
                                                            <div>
                                                                <label className="block text-xs text-blue-700 mb-1">
                                                                    Amount to apply (max: ₹{Number(selectedAdvance._remainingAmount).toFixed(2)})
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    value={advanceAmount}
                                                                    onChange={(e) => {
                                                                        const val = Number(e.target.value);
                                                                        const max = Number(selectedAdvance._remainingAmount);
                                                                        if (val <= max && val >= 0) {
                                                                            setAdvanceAmount(e.target.value);
                                                                        }
                                                                    }}
                                                                    max={selectedAdvance._remainingAmount}
                                                                    min="0"
                                                                    step="0.01"
                                                                    className="w-full border border-blue-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Summary Section - unchanged */}
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
 * SalesPage - server-backed invoices, no localStorage usage
 */
export default function SalesPage() {
    // Server-backed invoices and CRUD helpers (match ItemsPage pattern)
    const { rows: invoices = [], loading: invoicesLoading, error: invoicesError, reload, create, update, remove } = useSale({ useLocalFallback: false });

    const [selectedCell, setSelectedCell] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState(null);
    const [invoiceType, setInvoiceType] = useState("withGst"); // "withGst" or "withoutGst"
    const [activeTab, setActiveTab] = useState("all"); // "all", "withGst", "withoutGst"

    // PDF Preview state
    const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
    const [selectedInvoiceForPdf, setSelectedInvoiceForPdf] = useState(null);

    // bank/accounts and gst fetched from server (no localStorage)
    const [bankAccounts, setBankAccounts] = useState([]);
    const [gstRates, setGstRates] = useState([]);

    // loading / saving / error states
    const [loadingBanks, setLoadingBanks] = useState(false);
    const [loadingGst, setLoadingGst] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Table sizing
    const TOTAL_ROWS = 15;
    const tableContainerRef = useRef(null);
    const [visibleRows, setVisibleRows] = useState(TOTAL_ROWS);

    // Fetch bank accounts and GST rates from backend instead of localStorage
    useEffect(() => {
        let mounted = true;

        async function fetchBanks() {
            setLoadingBanks(true);
            try {
                const res = await fetch('/api/bank');
                if (!res.ok) {
                    console.warn('Failed to fetch banks', res.status);
                    return;
                }
                const body = await res.json().catch(() => null);
                const data = body && body.data ? body.data : (Array.isArray(body) ? body : []);
                if (!mounted) return;
                setBankAccounts(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error fetching banks:', err);
            } finally {
                if (mounted) setLoadingBanks(false);
            }
        }

        async function fetchGst() {
            setLoadingGst(true);
            try {
                const res = await fetch('/api/gst');
                if (!res.ok) {
                    console.warn('Failed to fetch gst rates', res.status);
                    return;
                }
                const body = await res.json().catch(() => null);
                const data = body && body.data ? body.data : (Array.isArray(body) ? body : []);
                if (!mounted) return;
                setGstRates(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error fetching gst rates:', err);
            } finally {
                if (mounted) setLoadingGst(false);
            }
        }

        fetchBanks();
        fetchGst();

        // ensure invoices are loaded (if useSale doesn't auto-load)
        if (typeof reload === 'function') {
            reload().catch(e => console.warn('reload failed', e));
        }

        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // table visible rows calculation
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

    // UI actions
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

    const handleTableContainerClick = (e) => {
        if (e.target === e.currentTarget) {
            setSelectedCell(null);
        }
    };

    const handleExportToExcel = () => {
        const columns = [
            { header: 'Date', key: 'date' },
            { header: 'Invoice No', key: 'invoiceNo' },
            { header: 'Customer', key: 'customer' },
            { header: 'Amount', key: 'amount' },
            { header: 'GST', key: 'gst' },
            { header: 'Type', key: 'type' },
            { header: 'Status', key: 'status' },
            { header: 'Due Amount', key: 'dueAmount' },
        ];
        
        const exportData = filteredInvoices.map(invoice => ({
            date: formatDate(invoice.invoiceDate),
            invoiceNo: `${invoice.invoicePrefix || ''}${invoice.invoiceNumber || ''}${invoice.invoiceSuffix || ''}`,
            customer: invoice.customerName || '-',
            amount: invoice.totalAmount || 0,
            gst: invoice.gstType || '-',
            type: invoice.invoiceType || '-',
            status: invoice.paymentStatus || '-',
            dueAmount: invoice.dueAmount || 0,
        }));
        
        exportTableToExcel(exportData, columns, 'Sales_Invoices_Report', 'Sales');
    };

    const handleCellClick = (rowIndex, colIndex) => {
        setSelectedCell({ rowIndex, colIndex });
    };

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

    // Filter invoices based on active tab (invoices is server rows)
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

    // ---------- Server interactions ----------
    // Normalize payload helper (does not compute totals — server will)
    function normalizeInvoicePayload(payload) {
        const p = { ...payload };

        // remove client-only id
        if (p.id) delete p.id;

        // ensure invoiceDate ISO
        if (p.invoiceDate) p.invoiceDate = new Date(p.invoiceDate).toISOString();

        // booleans
        p.withGst = p.withGst !== undefined ? Boolean(p.withGst) : true;
        p.autoRoundOff = p.autoRoundOff !== undefined ? Boolean(p.autoRoundOff) : true;
        p.isPaymentReceived = p.isPaymentReceived !== undefined ? Boolean(p.isPaymentReceived) : true;
        p.payFull = p.payFull !== undefined ? Boolean(p.payFull) : false;

        // numeric coercions
        p.discount = p.discount === "" || p.discount == null ? 0 : Number(p.discount);
        p.paymentAmount = p.paymentAmount === "" || p.paymentAmount == null ? 0 : Number(p.paymentAmount);

        p.items = Array.isArray(p.items) ? p.items.map(it => ({
            itemId: it.itemId || null,
            name: (it.goodsService || it.name || "").toString(),
            description: it.description || "",
            qty: it.qty === "" || it.qty == null ? 0 : Number(it.qty),
            rate: it.rate === "" || it.rate == null ? 0 : Number(it.rate),
            sellPrice: it.sellPrice === "" || it.sellPrice == null ? null : Number(it.sellPrice),
            gstPercent: (it.gstPercent === "" || it.gstPercent == null) ? null : Number(it.gstPercent),
            gstType: it.gstType || "Included",
            actualAmount: (it.actualAmount === "" || it.actualAmount == null) ? null : Number(it.actualAmount),
            finalAmount: (it.finalAmount === "" || it.finalAmount == null) ? null : Number(it.finalAmount),
            hsnNo: it.hsnNo || "",
            unit: it.unit || ""
        })) : [];

        p.additionalCharges = Array.isArray(p.additionalCharges)
            ? p.additionalCharges.map(c => ({ name: c.name, amount: Number(c.amount || 0) }))
            : [];

        p.payments = Array.isArray(p.payments)
            ? p.payments.map(pmt => ({ mode: pmt.mode, amount: Number(pmt.amount || 0), refNo: pmt.refNo || '', depositTo: pmt.depositTo || '' }))
            : [];

        // ensure customer exists
        p.customer = (p.customer || "").toString().trim();

        return p;
    }

    const handleSaveInvoice = async (invoiceData, isEdit) => {
        setSaving(true);
        setError(null);

        try {
            // basic client-side validation
            if (!invoiceData.customer || !invoiceData.customer.toString().trim()) {
                alert("Customer is required.");
                return;
            }
            if (!Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
                alert("At least one item is required.");
                return;
            }

            const payload = normalizeInvoicePayload(invoiceData);

            if (isEdit) {
                const id = invoiceData._id || invoiceData.id || (editingInvoice && (editingInvoice._id || editingInvoice.id));
                if (!id) throw new Error("Missing invoice id for update");

                await update(id, payload);
                // server is source of truth — reload list
                if (typeof reload === 'function') await reload();
            } else {
                await create(payload);
                if (typeof reload === 'function') await reload();
            }

            // success UX
            setIsModalOpen(false);
            setEditingInvoice(null);
        } catch (err) {
            console.error("Failed to save invoice:", err);
            const serverMsg =
                err?.response?.data?.error?.message ||
                err?.response?.data?.message ||
                err?.message ||
                "Failed to save invoice";
            setError(serverMsg);
            alert(`Save failed: ${serverMsg}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteInvoice = async (invoiceOrId) => {
        const id = (invoiceOrId && (invoiceOrId._id || invoiceOrId.id)) || invoiceOrId;
        if (!id) return;

        if (!window.confirm("Are you sure you want to delete this invoice?")) return;

        try {
            setSaving(true);
            setError(null);
            await remove(id);
            if (typeof reload === 'function') await reload();

            setIsModalOpen(false);
            setEditingInvoice(null);
        } catch (err) {
            console.error("Failed to delete invoice:", err);
            const msg = err?.response?.data?.error?.message || err?.message || "Failed to delete invoice";
            setError(msg);
            alert(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadPDF = async (invoice) => {
        const id = invoice._id || invoice.id;
        if (!id) return;

        setSelectedInvoiceForPdf(invoice);
        setIsPdfPreviewOpen(true);
    };

    const handleClosePdfPreview = () => {
        setIsPdfPreviewOpen(false);
        setSelectedInvoiceForPdf(null);
    };

    // ---------- render ----------
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
                                            <span>Customer</span>
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
                                    {/* Payment column removed as requested */}
                                    <th className="min-w-[120px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                            <span>Status</span>
                                        </div>
                                    </th>
                                    <th className="min-w-[130px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                            <span>Due Amount</span>
                                        </div>
                                    </th>
                                    <th className="min-w-[100px] h-9 px-4 text-left text-sm font-medium text-gray-700 sticky right-0 z-20 bg-gray-100 border-l border-gray-400" style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.15)' }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Data rows */}
                                {filteredInvoices.map((invoice, rowIndex) => (
                                    <tr
                                        key={invoice._id || invoice.id || rowIndex}
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
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${invoice.withGst ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {invoice.withGst ? "With GST" : "Without GST"}
                                            </span>
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 6) + " text-left"}
                                            onClick={() => handleCellClick(rowIndex, 6)}
                                        >
                                            {(() => {
                                                const status = invoice.paymentStatus || 'unpaid';
                                                const hasAdvance = invoice.advanceReceiptId || invoice.advanceAmountUsed > 0;
                                                const badges = {
                                                    'paid': { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
                                                    'partial': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Partial' },
                                                    'unpaid': { bg: 'bg-red-100', text: 'text-red-700', label: 'Unpaid' },
                                                };
                                                const badge = badges[status] || badges['unpaid'];
                                                return (
                                                    <div className="flex items-center gap-1">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded ${badge.bg} ${badge.text} text-xs font-medium`}>
                                                            {badge.label}
                                                        </span>
                                                        {hasAdvance && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-medium" title={`Advance: ₹${Number(invoice.advanceAmountUsed || 0).toFixed(2)}`}>
                                                                ADV
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 7) + " text-left text-gray-600 font-medium"}
                                            onClick={() => handleCellClick(rowIndex, 7)}
                                        >
                                            {invoice.dueAmount != null && invoice.dueAmount > 0 ? formatCurrency(invoice.dueAmount) : "-"}
                                        </td>
                                        <td className={`h-8 px-4 text-left sticky right-0 z-10 border-l border-gray-400 ${rowIndex % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`} style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.1)' }}>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleDownloadPDF(invoice)}
                                                    className="text-green-600 hover:underline text-sm"
                                                    title="Download PDF"
                                                >
                                                    PDF
                                                </button>
                                                <button
                                                    onClick={() => handleEditInvoice(invoice)}
                                                    className="text-blue-600 hover:underline text-sm"
                                                >
                                                    Edit
                                                </button>
                                                <button className="text-gray-400 hover:text-gray-600" onClick={() => handleDeleteInvoice(invoice)}>
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
                                            <td className={getCellClasses(rowIndex, 7)} onClick={() => handleCellClick(rowIndex, 7)}></td>
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

            {/* Sales Invoice Modal */}
            <SalesInvoiceModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveInvoice}
                onDelete={handleDeleteInvoice}
                editData={editingInvoice}
                withGst={invoiceType === "withGst"}
                bankAccounts={bankAccounts}
                gstRates={gstRates}
            />

            {/* PDF Preview Modal */}
            {selectedInvoiceForPdf && (
                <PdfPreviewModal
                    isOpen={isPdfPreviewOpen}
                    onClose={handleClosePdfPreview}
                    fetchPdfBlob={() => saleApi.getPdfBlob(selectedInvoiceForPdf._id || selectedInvoiceForPdf.id)}
                    title="Sales Invoice Preview"
                    filename={`SalesInvoice_${selectedInvoiceForPdf.invoicePrefix}${selectedInvoiceForPdf.invoiceNumber}${selectedInvoiceForPdf.invoiceSuffix}.pdf`}
                />
            )}

            {/* show simple errors */}
            {(error || invoicesError) && <div className="p-3 text-red-600 text-sm">{error || (invoicesError && String(invoicesError))}</div>}
        </div>
    );
}
