// PaymentPage.jsx - Payment Out
import React, { useState, useEffect, useRef } from "react";
import InvoicePreviewModal from "../receipt/components/InvoicePreviewModal";
import PdfPreviewModal from "../../../components/PdfPreviewModal";
import paymentApi from "./api/payment.api";
import usePayment from "./hooks/usePayment";
import { getCurrentCompany } from "../../../services/companyContextAccessor";
import { exportTableToExcel } from "../../../utils/excelExport";

/**
 * PaymentModal - Modal for creating/editing payment out entries
 */
function PaymentModal({ isOpen, onClose, onSave, onDelete, editData }) {
    const API_BASE = "http://localhost:4000"; // adjust if your API lives elsewhere

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
    const [payFull, setPayFull] = useState(false);
    const [selectedInvoiceData, setSelectedInvoiceData] = useState(null);

    const [parties, setParties] = useState([]); // array of { id?, name } (we'll use name as display)
    const [invoices, setInvoices] = useState([]); // array of { id, invoiceLabel, due, dateIso, totalAmount, paymentAmount }
    const [invoicesLoading, setInvoicesLoading] = useState(false);

    const isEditMode = !!editData;

    const paymentMethods = [
        "Cash",
        "Bank Transfer",
        "Credit Card",
        "Debit Card",
        "UPI",
        "Cheque",
        "Other"
    ];

    async function parseJsonSafe(res) {
        const body = await res.json().catch(() => null);
        if (!body) return null;
        if (typeof body === "object" && Object.prototype.hasOwnProperty.call(body, "data")) return body.data;
        return body;
    }

    // fetch customers + vendors and merge to a display list
    const fetchParties = async () => {
        try {
            const companyId = getCurrentCompany();
            const [cRes, vRes] = await Promise.allSettled([
                fetch(`${API_BASE}/api/customers?accountCompanyName=${companyId}`),
                fetch(`${API_BASE}/api/vendors?accountCompanyName=${companyId}`)
            ]);

            const parseSettled = async (s) => {
                if (s.status !== "fulfilled") return [];
                const r = s.value;
                if (!r || !r.ok) return [];
                const data = await parseJsonSafe(r);
                return Array.isArray(data) ? data : (data ? [data] : []);
            };

            const [customersData, vendorsData] = await Promise.all([parseSettled(cRes), parseSettled(vRes)]);

            const normalize = (arr) => (Array.isArray(arr) ? arr.map(item => {
                if (!item) return null;
                if (typeof item === "string") return { id: null, name: item };
                const name = item.displayName || item.fullName || item.name || item.companyName || (item.email ? `${item.email}` : "");
                return { id: item._id || item.id || null, name: name || "" };
            }).filter(Boolean) : []);

            const custNorm = normalize(customersData);
            const vendNorm = normalize(vendorsData);

            // merged, unique by name (case-insensitive)
            const map = new Map();
            [...custNorm, ...vendNorm].forEach(p => {
                const key = (p.name || "").toString().trim().toLowerCase();
                if (key) map.set(key, p);
            });

            setParties(Array.from(map.values()));
        } catch (err) {
            console.error("Failed to fetch parties for PaymentModal", err);
            setParties([]);
        }
    };

    // call when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchParties();

            if (editData) {
                // If editing existing payment, prefill
                setFormData({
                    date: editData.date || new Date().toISOString().split('T')[0],
                    party: editData.party || "",
                    partyId: editData.partyId || "",
                    amount: (editData.amount != null) ? String(editData.amount) : "",
                    paymentMethod: editData.paymentMethod || "Cash",
                    invoice: editData.invoice || "",
                    invoiceId: editData.invoiceId || "",
                    referenceNumber: editData.referenceNumber || "",
                    description: editData.description || "",
                });

                // if payment references an invoice, try to load invoices for that party so dropdown shows the invoice
                if (editData.party) {
                    handlePartySelected(editData.party, true).catch(() => { });
                }
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
                    paymentStatus: "",
                    dueAmount: 0,
                });
                setInvoices([]);
                setSelectedInvoiceData(null);
                setPayFull(false);
            }
            setError("");
            setFieldErrors({});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, editData]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (error) setError("");
        if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: "" }));
    };

    // Called when a party is selected. `partyNameOrId` can be id or name depending on how you populate select.
    // second arg `keepSelectedInvoice` used when loading for edit mode to preserve invoice selection.
    const handlePartySelected = async (partyNameOrId, keepSelectedInvoice = false) => {
        // partyNameOrId might be id (if your parties list had ids) or the name string. We'll resolve a name.
        let selectedName = "";

        if (!partyNameOrId) {
            // clear invoices + invoice selection
            setFormData(prev => ({ ...prev, partyId: "", party: "", invoice: "", invoiceId: "" }));
            setInvoices([]);
            return;
        }

        // If we have parties by id, try to find; otherwise treat the argument as the name
        const found = parties.find(p => (p.id && p.id.toString() === partyNameOrId.toString()) || (p.name && p.name.toString() === partyNameOrId.toString()));
        if (found) {
            selectedName = found.name;
        } else {
            // fallback: maybe user pasted name string directly
            selectedName = partyNameOrId.toString();
        }

        // update form party fields (partyId will be the id if we had one, otherwise empty)
        setFormData(prev => ({
            ...prev,
            partyId: found?.id || "",
            party: selectedName,
            // if not keeping invoice selection (normal flow), clear invoice selections
            invoice: keepSelectedInvoice ? prev.invoice : "",
            invoiceId: keepSelectedInvoice ? prev.invoiceId : "",
        }));

        // Now fetch invoices from /api/purchases?search=<selectedName> and filter exact match on supplier name (case-insensitive)
        if (!selectedName || !selectedName.trim()) {
            setInvoices([]);
            return;
        }

        setInvoicesLoading(true);
        try {
            const companyId = getCurrentCompany();
            const res = await fetch(`${API_BASE}/api/purchases?search=${encodeURIComponent(selectedName)}&accountCompanyName=${companyId}`);
            if (!res.ok) {
                setInvoices([]);
                setInvoicesLoading(false);
                return;
            }
            const body = await parseJsonSafe(res);
            const purchases = Array.isArray(body) ? body : (body ? (Array.isArray(body) ? body : [body]) : []);
            // filter exact name match (case-insensitive)
            const normalizedWanted = selectedName.toString().trim().toLowerCase();
            const matches = (purchases || []).filter(p => (p.supplier || "").toString().trim().toLowerCase() === normalizedWanted);

            // map to invoice options
            const mapped = matches.map(p => {
                const invLabel = `${p.invoicePrefix || ''}${p.invoiceNumber || ''}${p.invoiceSuffix || ''}`.trim();
                const total = Number(p.totalAmount || 0);
                const paid = Number(p.paidAmount || 0);
                const due = Number(p.dueAmount !== undefined ? p.dueAmount : (total - paid));
                const dateIso = p.invoiceDate ? new Date(p.invoiceDate).toISOString() : null;
                return {
                    id: p._id,
                    invoiceLabel: invLabel || (p.invoiceNumber || p._id),
                    due,
                    totalAmount: total,
                    paidAmount: paid,
                    dateIso,
                };
            });

            // sort by date desc (recent first)
            mapped.sort((a, b) => {
                if (!a.dateIso && !b.dateIso) return 0;
                if (!a.dateIso) return 1;
                if (!b.dateIso) return -1;
                return new Date(b.dateIso) - new Date(a.dateIso);
            });

            // Filter out fully paid invoices (due amount is 0)
            const unpaidInvoices = mapped.filter(inv => inv.due > 0);

            setInvoices(unpaidInvoices);
        } catch (err) {
            console.error("Failed to fetch purchases for party", selectedName, err);
            setInvoices([]);
        } finally {
            setInvoicesLoading(false);
        }
    };

    const handlePartyChange = (partyIdOrName) => {
        // Update selected party in form and fetch invoices
        handlePartySelected(partyIdOrName).catch(() => { });
    };

    // when user selects an invoice, set invoice + autofill amount with due
    const handleInvoiceChange = (invoiceId) => {
        const selected = invoices.find(inv => inv.id === invoiceId);
        setSelectedInvoiceData(selected || null);
        
        if (selected) {
            setFormData(prev => ({
                ...prev,
                invoiceId: invoiceId || "",
                invoice: selected.invoiceLabel,
                amount: payFull ? String(selected.due) : prev.amount,
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                invoiceId: "",
                invoice: "",
            }));
        }
    };

    // Handle Pay Full checkbox
    const handlePayFullChange = (checked) => {
        setPayFull(checked);
        if (checked && selectedInvoiceData) {
            setFormData(prev => ({
                ...prev,
                amount: String(selectedInvoiceData.due),
            }));
        }
    };

    const handleSave = () => {
        const errors = {};

        if (!formData.party || !formData.party.trim()) {
            errors.party = "Party is required";
        }
        if (!formData.amount || Number(formData.amount) <= 0) {
            errors.amount = "Valid amount is required";
        }
        if (!formData.paymentMethod) {
            errors.paymentMethod = "Payment method is required";
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        const paymentData = {
            id: isEditMode ? editData.id : String(Date.now()),
            ...formData,
            amount: Number(parseFloat(formData.amount)),
            description: (formData.description || "").trim(),
            referenceNumber: (formData.referenceNumber || "").trim(),
        };

        // Call parent save handler
        onSave(paymentData, isEditMode);
        
        // Refresh invoices after payment to reflect updated due amounts
        if (formData.party && formData.invoiceId) {
            setTimeout(() => {
                handlePartySelected(formData.party, false).catch(() => { });
            }, 500);
        }
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
                        {isEditMode ? "Edit Payment Out" : "New Payment Out"}
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

                                {/* Party select shows combined customers + vendors */}
                                <select
                                    value={formData.partyId || formData.party}
                                    onChange={(e) => {
                                        // we try to pass id if matching option had an id, otherwise pass the name
                                        const val = e.target.value;
                                        // find option by value
                                        const found = parties.find(p => (p.id && p.id.toString() === val.toString()) || (p.name && p.name === val));
                                        if (found && found.id) {
                                            handlePartyChange(found.id);
                                        } else {
                                            handlePartyChange(val);
                                        }
                                    }}
                                    onKeyDown={handleKeyDown}
                                    className={`${baseInput} bg-white ${fieldErrors.party ? "border-red-500" : ""}`}
                                >
                                    <option value="">Search and select party...</option>
                                    {parties.map((party) => (
                                        // use party.id if present otherwise use party.name as value
                                        <option key={(party.id || party.name)} value={party.id || party.name}>
                                            {party.name}
                                        </option>
                                    ))}
                                </select>
                                {fieldErrors.party && <p className="mt-1 text-xs text-red-500">{fieldErrors.party}</p>}
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Invoice (Optional)
                                </label>

                                <select
                                    value={formData.invoiceId}
                                    onChange={(e) => handleInvoiceChange(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={!formData.party || invoicesLoading}
                                    className={`${baseInput} bg-white disabled:bg-gray-100 disabled:cursor-not-allowed`}
                                >
                                    <option value="">{formData.party ? (invoicesLoading ? "Loading invoices..." : "Select an invoice or leave empty for advance payment...") : "Select a party first to see their invoices..."}</option>

                                    {(!invoicesLoading && formData.party && invoices.length === 0) && (
                                        <option value="" disabled>No invoices - Payment will be marked as advance</option>
                                    )}

                                    {invoices.map(inv => {
                                        // format date for display
                                        const dateText = inv.dateIso ? new Date(inv.dateIso).toLocaleDateString('en-GB') : "";
                                        const dueText = typeof inv.due === 'number' ? inv.due.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : inv.due;
                                        return (
                                            <option key={inv.id} value={inv.id}>
                                                {inv.invoiceLabel} — Due: ₹{dueText}{dateText ? ` — ${dateText}` : ""}
                                            </option>
                                        );
                                    })}
                                </select>
                                {formData.invoiceId && selectedInvoiceData && (
                                    <div className="mt-2 flex items-center">
                                        <input
                                            type="checkbox"
                                            id="payFull"
                                            checked={payFull}
                                            onChange={(e) => handlePayFullChange(e.target.checked)}
                                            className="mr-2"
                                        />
                                        <label htmlFor="payFull" className="text-sm text-gray-700 cursor-pointer">
                                            Pay Full Amount (₹{selectedInvoiceData.due.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                        </label>
                                    </div>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    {!formData.party ? "Select a party first" : !formData.invoiceId ? "Leave empty for advance payment" : "Select to link payment to invoice"}
                                </p>
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
 * PaymentPage - Payment Out Management
 * - Frontend-only payment management
 * - Excel-like table with row highlighting and cell selection
 * - PDF Invoice export functionality
 */
export default function PaymentPage() {
    const { rows: payments = [], loading: paymentsLoading, error: paymentsError, reload, create, update, remove } = usePayment({ useLocalFallback: false });

    const [selectedCell, setSelectedCell] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
    const [selectedPaymentForInvoice, setSelectedPaymentForInvoice] = useState(null);
    const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
    const [selectedPaymentForPdf, setSelectedPaymentForPdf] = useState(null);

    // Company/formatter helpers (kept as you had them)
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
        logoUrl: "",
    };

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
        if (numInt >= 10000000) result += convertLessThanThousand(Math.floor(numInt / 10000000)) + " Crore ";
        if (numInt >= 100000) result += convertLessThanThousand(Math.floor((numInt % 10000000) / 100000)) + " Lakh ";
        if (numInt >= 1000) result += convertLessThanThousand(Math.floor((numInt % 100000) / 1000)) + " Thousand ";
        if (numInt >= 100) result += convertLessThanThousand(Math.floor((numInt % 1000) / 100)) + " Hundred ";
        if (numInt % 100 !== 0) result += convertLessThanThousand(numInt % 100);
        result = result.trim() + " Rupees";
        if (paisa > 0) result += " and " + convertLessThanThousand(paisa) + " Paise";
        return "INR " + result + " Only";
    };

    const convertPaymentToInvoice = (payment) => {
        if (!payment) return null;
        const supplierData = {
            name: payment.party || "Supplier Name",
            partyName: payment.party,
            phone: "",
            billingAddressLine1: "Supplier Address Line 1",
            billingAddressLine2: "",
            city: "City",
            state: "State",
            pincode: "000000",
            gstin: "",
        };
        return {
            company: companyData,
            customer: supplierData,
            meta: {
                invoiceNumber: payment.invoice || `PAY-${payment.id || payment._id}`,
                invoiceDate: payment.date,
                dueDate: payment.date,
                placeOfSupply: supplierData.state,
            },
            items: [
                {
                    id: 1,
                    srNo: 1,
                    description: payment.description || `Payment Voucher - ${payment.paymentMethod}`,
                    hsnSac: "",
                    taxPercent: 0,
                    quantity: 1,
                    unit: "",
                    rate: payment.amount,
                    amount: payment.amount,
                },
            ],
            summary: {
                totalQuantity: 1,
                deliveryCharges: 0,
                taxableAmount: payment.amount,
                grandTotal: payment.amount,
                amountInWords: numberToWords(payment.amount),
            },
            bankDetails: {
                bankName: "Bank Name",
                accountNumber: "0000000000",
                ifscCode: "BANK0000000",
                branch: "Branch Name",
            },
            paymentDetails: { upiQrUrl: "" },
            signatory: { name: "Authorized Signatory", signatureImageUrl: "" },
        };
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

    // table sizing (same as ReceiptPage)
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

    // Load payments on mount (server is source of truth)
    useEffect(() => {
        if (typeof reload === 'function') {
            reload().catch(e => console.warn('reload failed', e));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const emptyRowsCount = Math.max(0, visibleRows - payments.length);
    const emptyRows = Array.from({ length: emptyRowsCount }, (_, i) => i);

    const totalRecords = payments.length;
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

    // UI actions
    const handleOpenCreate = () => {
        setEditingPayment(null);
        setIsModalOpen(true);
    };

    const handleEditPayment = (payment) => {
        setEditingPayment(payment);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPayment(null);
    };

    const handleOpenInvoicePreview = (payment) => {
        setSelectedPaymentForInvoice(payment);
        setIsInvoicePreviewOpen(true);
    };

    const handleCloseInvoicePreview = () => {
        setIsInvoicePreviewOpen(false);
        setSelectedPaymentForInvoice(null);
    };

    const handleDownloadPDF = (payment) => {
        setSelectedPaymentForPdf(payment);
        setIsPdfPreviewOpen(true);
    };

    const handleClosePdfPreview = () => {
        setIsPdfPreviewOpen(false);
        setSelectedPaymentForPdf(null);
    };

    // Normalize payment payload before sending to server (mirror receipt normalization style)
    function normalizePaymentPayload(payload) {
        const p = { ...payload };

        // remove client-only id
        if (p.id) delete p.id;

        // date to ISO if present
        if (p.date) p.date = new Date(p.date).toISOString();

        // strings
        p.party = (p.party || "").toString().trim();
        p.partyId = p.partyId || null;
        p.invoice = p.invoice || "";
        p.invoiceId = p.invoiceId || null;
        p.paymentMethod = p.paymentMethod || "Cash";
        p.referenceNumber = (p.referenceNumber || "").toString().trim();
        p.description = (p.description || "").toString().trim();

        // numeric coercion
        p.amount = (p.amount === "" || p.amount == null) ? 0 : Number(p.amount);

        return p;
    }

    // Save handler (create or update)
    const handleSavePayment = async (paymentData, isEdit) => {
        try {
            // basic client-side validation
            if (!paymentData.party || !paymentData.party.toString().trim()) {
                alert("Party is required.");
                return;
            }
            if (!paymentData.amount || Number(paymentData.amount) <= 0) {
                alert("Amount is required and should be > 0.");
                return;
            }

            const payload = normalizePaymentPayload(paymentData);

            if (isEdit) {
                const id = paymentData._id || paymentData.id || (editingPayment && (editingPayment._id || editingPayment.id));
                if (!id) throw new Error("Missing payment id for update");
                // try update(id, payload) signature used by your resourceFactory
                await update(id, payload);
                if (typeof reload === 'function') await reload();
            } else {
                await create(payload);
                if (typeof reload === 'function') await reload();
            }

            setIsModalOpen(false);
            setEditingPayment(null);
        } catch (err) {
            console.error("Failed to save payment:", err);
            const msg = err?.response?.data?.error?.message || err?.message || "Failed to save payment";
            alert(msg);
        }
    };

    // Delete handler
    const handleDeletePayment = async (paymentOrId) => {
        const id = (paymentOrId && (paymentOrId._id || paymentOrId.id)) || paymentOrId;
        if (!id) return;
        if (!window.confirm("Are you sure you want to delete this payment?")) return;

        try {
            await remove(id);
            if (typeof reload === 'function') await reload();
            setIsModalOpen(false);
            setEditingPayment(null);
        } catch (err) {
            console.error("Failed to delete payment:", err);
            const msg = err?.response?.data?.error?.message || err?.message || "Failed to delete payment";
            alert(msg);
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
            { header: 'Party', key: 'party' },
            { header: 'Amount', key: 'amount' },
            { header: 'Payment Method', key: 'paymentMethod' },
            { header: 'Invoice', key: 'invoice' },
            { header: 'Reference Number', key: 'referenceNumber' },
            { header: 'Description', key: 'description' },
        ];
        
        const exportData = payments.map(payment => ({
            date: formatDate(payment.date),
            party: payment.party || '-',
            amount: payment.amount || 0,
            paymentMethod: payment.paymentMethod || '-',
            invoice: payment.invoice || '-',
            referenceNumber: payment.referenceNumber || '-',
            description: payment.description || '-',
        }));
        
        exportTableToExcel(exportData, columns, 'Payments_Report', 'Payments');
    };

    const getStatusBadge = (payment) => {
        // Determine status: if invoice is linked, get status from invoice, otherwise show 'advance'
        let status = 'advance';
        let label = 'Advance';
        
        if (payment.invoiceId && payment.invoiceStatus) {
            // Use invoice payment status
            const invStatus = payment.invoiceStatus;
            if (invStatus === 'paid') {
                status = 'paid';
                label = 'Paid';
            } else if (invStatus === 'partial') {
                status = 'partial';
                label = 'Partial';
            } else {
                status = 'unpaid';
                label = 'Due';
            }
        }

        const badges = {
            'paid': { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
            'partial': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Partial' },
            'unpaid': { bg: 'bg-red-100', text: 'text-red-700', label: 'Due' },
            'advance': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Advance' },
        };
        const badge = badges[status] || badges['advance'];
        badge.label = label;
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded ${badge.bg} ${badge.text} text-xs font-medium`}>
                {badge.label}
            </span>
        );
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header Row */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">Payment Out</h2>
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
                    Add Payment Out
                </button>
            </div>

            {/* Toolbar (kept minimal like ReceiptPage) */}
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

            {/* Table Container */}
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
                                <th className="min-w-[100px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Status</span>
                                    </div>
                                </th>
                                <th className="min-w-[100px] h-9 px-4 text-left text-sm font-medium text-gray-700 sticky right-0 z-20 bg-gray-100 border-l border-gray-400" style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.15)' }}>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment, rowIndex) => (
                                <tr
                                    key={payment.id || payment._id || rowIndex}
                                    className={`border-b border-gray-400 hover:bg-blue-100 transition-colors ${rowIndex % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'}`}
                                >
                                    <td className={getCellClasses(rowIndex, 0) + " text-left text-gray-600"} onClick={() => handleCellClick(rowIndex, 0)}>
                                        {formatDate(payment.date)}
                                    </td>
                                    <td className={getCellClasses(rowIndex, 1) + " text-left text-blue-600"} onClick={() => handleCellClick(rowIndex, 1)}>
                                        {payment.party}
                                    </td>
                                    <td className={getCellClasses(rowIndex, 2) + " text-left text-red-600 font-medium"} onClick={() => handleCellClick(rowIndex, 2)}>
                                        {formatCurrency(payment.amount)}
                                    </td>
                                    <td className={getCellClasses(rowIndex, 3) + " text-left text-gray-600"} onClick={() => handleCellClick(rowIndex, 3)}>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                                            {payment.paymentMethod}
                                        </span>
                                    </td>
                                    <td className={getCellClasses(rowIndex, 4) + " text-left text-gray-600"} onClick={() => handleCellClick(rowIndex, 4)}>
                                        {payment.invoice || "-"}
                                    </td>
                                    <td className={getCellClasses(rowIndex, 5) + " text-left text-gray-600"} onClick={() => handleCellClick(rowIndex, 5)}>
                                        {payment.referenceNumber || "-"}
                                    </td>
                                    <td className={getCellClasses(rowIndex, 6) + " text-left text-gray-600"} onClick={() => handleCellClick(rowIndex, 6)}>
                                        {getStatusBadge(payment)}
                                    </td>
                                    <td className={`h-8 px-4 text-left sticky right-0 z-10 border-l border-gray-400 ${rowIndex % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`} style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.1)' }}>
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleDownloadPDF(payment)} className="text-purple-600 hover:underline text-sm" title="Export as PDF">PDF</button>
                                            <button onClick={() => handleEditPayment(payment)} className="text-blue-600 hover:underline text-sm">Edit</button>
                                            <button onClick={() => handleDeletePayment(payment)} className="text-gray-400 hover:text-gray-600" title="Delete">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {/* Empty rows */}
                            {emptyRows.map((_, idx) => {
                                const rowIndex = payments.length + idx;
                                return (
                                    <tr key={`empty-${idx}`} className={`border-b border-gray-400 hover:bg-blue-100 transition-colors ${rowIndex % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'}`}>
                                        <td className={getCellClasses(rowIndex, 0)}></td>
                                        <td className={getCellClasses(rowIndex, 1)}></td>
                                        <td className={getCellClasses(rowIndex, 2)}></td>
                                        <td className={getCellClasses(rowIndex, 3)}></td>
                                        <td className={getCellClasses(rowIndex, 4)}></td>
                                        <td className={getCellClasses(rowIndex, 5)}></td>
                                        <td className={getCellClasses(rowIndex, 6)}></td>
                                        <td className={`h-8 px-4 sticky right-0 z-10 border-l border-gray-400 ${rowIndex % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}></td>
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

            {/* Payment Modal */}
            <PaymentModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSavePayment}
                onDelete={handleDeletePayment}
                editData={editingPayment}
            />

            {/* Invoice Preview Modal */}
            {selectedPaymentForInvoice && (
                <InvoicePreviewModal
                    isOpen={isInvoicePreviewOpen}
                    onClose={handleCloseInvoicePreview}
                    invoice={convertPaymentToInvoice(selectedPaymentForInvoice)}
                    config={{ footerText: "This is a computer generated payment voucher" }}
                />
            )}

            {/* PDF Preview Modal */}
            {selectedPaymentForPdf && (
                <PdfPreviewModal
                    isOpen={isPdfPreviewOpen}
                    onClose={handleClosePdfPreview}
                    fetchPdfBlob={() => paymentApi.getPdfBlob(selectedPaymentForPdf._id || selectedPaymentForPdf.id)}
                    title="Payment Voucher Preview"
                    filename={`PaymentVoucher_${selectedPaymentForPdf.id || selectedPaymentForPdf._id}.pdf`}
                />
            )}

            {/* show simple errors */}
            {(paymentsError) && <div className="p-3 text-red-600 text-sm">{String(paymentsError)}</div>}
        </div>
    );
}
