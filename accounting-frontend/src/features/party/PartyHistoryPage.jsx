// PartyHistoryPage.jsx - Shows detailed history for a customer or vendor
import React, { useState, useEffect, useContext, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { CompanyContext } from "src/App";
import { authFetch, API_BASE_URL } from "src/services/apiClient";
import { getCurrentCompany } from "src/services/companyContextAccessor";
import PdfPreviewModal from "src/components/PdfPreviewModal";
import MiniChatOverlay from "src/components/chat/MiniChatOverlay";
import saleApi from "src/features/transactions/sales/api/sale.api";
import purchaseApi from "src/features/transactions/purchase/api/purchase.api";
import receiptApi from "src/features/transactions/receipt/api/receipt.api";
import paymentApi from "src/features/transactions/payment/api/payment.api";

const API_BASE = API_BASE_URL;

async function parseJsonSafe(res) {
    const body = await res.json().catch(() => null);
    if (!body) return null;
    if (typeof body === "object" && Object.prototype.hasOwnProperty.call(body, "data")) return body.data;
    return body;
}

export default function PartyHistoryPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const context = useContext(CompanyContext);
    const selectedCompany = context?.selectedCompany || "";

    // Determine type from current path
    const isCustomer = location.pathname.includes('/customer/');

    const [party, setParty] = useState(null);
    const [sales, setSales] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [receipts, setReceipts] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");

    // PDF Preview state
    const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
    const [selectedTxnForPdf, setSelectedTxnForPdf] = useState(null);

    // Mini Chat state
    const [isChatOpen, setIsChatOpen] = useState(false);

    const partyLabel = isCustomer ? "Customer" : "Vendor";

    // Fetch party details and transaction history
    useEffect(() => {
        if (!selectedCompany || !id) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const companyId = getCurrentCompany();
                const endpoint = isCustomer ? "customers" : "vendors";

                // Fetch party details
                const partyRes = await authFetch(`${API_BASE}/api/${endpoint}/${id}?accountCompanyName=${companyId}`);
                if (partyRes && partyRes.ok) {
                    const partyData = await parseJsonSafe(partyRes);
                    setParty(partyData);
                }

            } catch (err) {
                console.error("Failed to fetch party history:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedCompany, id, isCustomer]);

    // Re-fetch transactions when party data loads
    useEffect(() => {
        if (!party || !selectedCompany) return;

        const fetchTransactions = async () => {
            try {
                const companyId = getCurrentCompany();
                const partyName = party.customerName || party.vendorName || party.name || "";

                const [salesRes, purchasesRes, receiptsRes, paymentsRes] = await Promise.allSettled([
                    authFetch(`${API_BASE}/api/sales?accountCompanyName=${companyId}`),
                    authFetch(`${API_BASE}/api/purchases?accountCompanyName=${companyId}`),
                    authFetch(`${API_BASE}/api/receipts?accountCompanyName=${companyId}`),
                    authFetch(`${API_BASE}/api/payments?accountCompanyName=${companyId}`),
                ]);

                const parseSettled = async (s) => {
                    if (s.status !== "fulfilled") return [];
                    const r = s.value;
                    if (!r || !r.ok) return [];
                    const data = await parseJsonSafe(r);
                    return Array.isArray(data) ? data : data ? [data] : [];
                };

                const allSales = await parseSettled(salesRes);
                const allPurchases = await parseSettled(purchasesRes);
                const allReceipts = await parseSettled(receiptsRes);
                const allPayments = await parseSettled(paymentsRes);

                // Filter by party ID or name
                const filterByParty = (items, partyField = "party") => {
                    return items.filter(item => {
                        const itemPartyId = item.partyId || item.customerId || item.vendorId;
                        const itemPartyName = item[partyField] || item.customerName || item.vendorName || item.customer || item.supplier;
                        return itemPartyId === id ||
                            (partyName && itemPartyName?.toLowerCase() === partyName.toLowerCase());
                    });
                };

                setSales(filterByParty(allSales, "customer"));
                setPurchases(filterByParty(allPurchases, "supplier"));
                setReceipts(filterByParty(allReceipts, "party"));
                setPayments(filterByParty(allPayments, "party"));
            } catch (err) {
                console.error("Failed to fetch transactions:", err);
            }
        };

        fetchTransactions();
    }, [party, selectedCompany, id]);

    // Calculate totals
    const totals = useMemo(() => {
        const totalSales = sales.reduce((sum, s) => sum + (parseFloat(s.totalAmount) || parseFloat(s.grandTotal) || 0), 0);
        const totalPurchases = purchases.reduce((sum, p) => sum + (parseFloat(p.totalAmount) || parseFloat(p.grandTotal) || 0), 0);
        const totalReceipts = receipts.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
        const totalPayments = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

        const balance = isCustomer
            ? (totalSales - totalReceipts)
            : (totalPurchases - totalPayments);

        return { totalSales, totalPurchases, totalReceipts, totalPayments, balance };
    }, [sales, purchases, receipts, payments, isCustomer]);

    // Combined transactions for "All" tab
    const allTransactions = useMemo(() => {
        const combined = [
            ...sales.map(s => ({ ...s, _type: 'sale', _date: s.date || s.invoiceDate })),
            ...purchases.map(p => ({ ...p, _type: 'purchase', _date: p.date || p.invoiceDate })),
            ...receipts.map(r => ({ ...r, _type: 'receipt', _date: r.date })),
            ...payments.map(p => ({ ...p, _type: 'payment', _date: p.date })),
        ];
        return combined.sort((a, b) => new Date(b._date) - new Date(a._date));
    }, [sales, purchases, receipts, payments]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return "-";
        return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    // PDF Preview handler - opens modal with preview
    const handlePreviewPdf = (txn) => {
        setSelectedTxnForPdf(txn);
        setIsPdfPreviewOpen(true);
    };

    const handleClosePdfPreview = () => {
        setIsPdfPreviewOpen(false);
        setSelectedTxnForPdf(null);
    };

    // Get PDF blob based on transaction type
    const getPdfBlob = async () => {
        if (!selectedTxnForPdf) return null;
        const txnId = selectedTxnForPdf._id || selectedTxnForPdf.id;

        switch (selectedTxnForPdf._type) {
            case 'sale':
                return saleApi.getPdfBlob(txnId);
            case 'purchase':
                return purchaseApi.getPdfBlob(txnId);
            case 'receipt':
                return receiptApi.getPdfBlob(txnId);
            case 'payment':
                return paymentApi.getPdfBlob(txnId);
            default:
                throw new Error('Unknown transaction type');
        }
    };

    // Get filename for PDF download
    const getPdfFilename = () => {
        if (!selectedTxnForPdf) return 'document.pdf';
        const txn = selectedTxnForPdf;
        const ref = txn.invoiceNumber || txn.referenceNumber || txn.billNumber || txn._id;

        switch (txn._type) {
            case 'sale':
                return `SalesInvoice_${ref}.pdf`;
            case 'purchase':
                return `PurchaseInvoice_${ref}.pdf`;
            case 'receipt':
                return `Receipt_${ref}.pdf`;
            case 'payment':
                return `Payment_${ref}.pdf`;
            default:
                return `Transaction_${ref}.pdf`;
        }
    };

    // Get modal title for PDF preview
    const getPdfTitle = () => {
        if (!selectedTxnForPdf) return 'PDF Preview';

        switch (selectedTxnForPdf._type) {
            case 'sale':
                return 'Sales Invoice Preview';
            case 'purchase':
                return 'Purchase Invoice Preview';
            case 'receipt':
                return 'Receipt Preview';
            case 'payment':
                return 'Payment Voucher Preview';
            default:
                return 'Transaction Preview';
        }
    };

    // Helper to get invoice/reference number for display
    const getInvoiceReference = (txn) => {
        // For sales: invoiceNumber with prefix/suffix
        if (txn._type === 'sale') {
            if (txn.invoiceNumber) {
                const prefix = txn.invoicePrefix || '';
                const suffix = txn.invoiceSuffix || '';
                return `${prefix}${txn.invoiceNumber}${suffix}`;
            }
            return txn.billNumber || '-';
        }
        // For purchases: billNumber or invoiceNumber
        if (txn._type === 'purchase') {
            return txn.billNumber || txn.invoiceNumber || '-';
        }
        // For receipts/payments: referenceNumber or auto-generated
        if (txn._type === 'receipt' || txn._type === 'payment') {
            if (txn.referenceNumber) return txn.referenceNumber;
            // Auto-generate reference based on date and ID
            const dateStr = txn.date ? new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '') : '';
            return `${txn._type === 'receipt' ? 'REC' : 'PAY'}-${dateStr || (txn._id || txn.id || '').slice(-6).toUpperCase()}`;
        }
        return '-';
    };

    // Helper to get "Against Invoice" label
    const getAgainstInvoice = (txn) => {
        // For receipts: show linked invoice or advance with linked sales
        if (txn._type === 'receipt') {
            // If directly linked to an invoice
            if (txn.invoiceLabel) {
                return txn.invoiceLabel;
            }
            // If it's an advance payment with linked sales
            if (txn.linkedSales && txn.linkedSales.length > 0) {
                const invoiceLabels = txn.linkedSales.map(ls => ls.invoiceLabel).filter(Boolean);
                if (invoiceLabels.length > 0) {
                    return `Advance → ${invoiceLabels.join(', ')}`;
                }
                return 'Advance (Used)';
            }
            // Check remaining amount to determine if it's an advance
            if (!txn.invoiceId) {
                const remaining = txn.remainingAmount ?? (txn.amount - (txn.usedAmount || 0));
                if (remaining > 0) {
                    return `Advance (₹${remaining.toFixed(0)} available)`;
                }
                return 'Advance';
            }
            return 'Direct Payment';
        }
        // For payments: show linked purchase invoice
        if (txn._type === 'payment') {
            if (txn.invoiceLabel) {
                return txn.invoiceLabel;
            }
            if (txn.linkedPurchases && txn.linkedPurchases.length > 0) {
                const invoiceLabels = txn.linkedPurchases.map(lp => lp.invoiceLabel).filter(Boolean);
                if (invoiceLabels.length > 0) {
                    return `Advance → ${invoiceLabels.join(', ')}`;
                }
                return 'Advance (Used)';
            }
            if (!txn.invoiceId) {
                return 'Advance';
            }
            return 'Direct Payment';
        }
        // For sales: show if advance was used
        if (txn._type === 'sale') {
            if (txn.advanceAmountUsed && txn.advanceAmountUsed > 0) {
                return `Advance Used: ₹${txn.advanceAmountUsed}`;
            }
            return '-';
        }
        // For purchases: similar logic
        if (txn._type === 'purchase') {
            if (txn.advanceAmountUsed && txn.advanceAmountUsed > 0) {
                return `Advance Used: ₹${txn.advanceAmountUsed}`;
            }
            return '-';
        }
        return '-';
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!party) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <p className="text-lg">{partyLabel} not found</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const partyName = party.customerName || party.vendorName || party.name || "Unknown";

    // Check if party has a linked chat user
    const hasChatUser = Boolean(party.chatUserId);

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">{partyName}</h1>
                            <p className="text-sm text-gray-500">{partyLabel} History</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {party.mobileNumber && (
                            <span className="text-sm text-gray-600">
                                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {party.mobileNumber}
                            </span>
                        )}
                        {party.companyName && (
                            <span className="text-sm text-gray-600">
                                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {party.companyName}
                            </span>
                        )}
                        
                        {/* Start Chat Button */}
                        {hasChatUser ? (
                            <button
                                onClick={() => setIsChatOpen(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                                title={`Start chat with ${partyName}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Start Chat
                            </button>
                        ) : (
                            <button
                                disabled
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed"
                                title="This user is not registered on the chat platform"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                User Not Registered
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Mini Chat Overlay */}
            <MiniChatOverlay
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                partnerId={party.chatUserId}
                partnerName={partyName}
                partnerAvatar={null}
                conversationId={party.chatConversationId}
            />

            {/* Summary Cards */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-5 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">{isCustomer ? "Total Sales" : "Total Purchases"}</p>
                        <p className="text-xl font-semibold text-green-600">
                            {formatCurrency(isCustomer ? totals.totalSales : totals.totalPurchases)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {isCustomer ? sales.length : purchases.length} transactions
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">{isCustomer ? "Total Receipts" : "Total Payments"}</p>
                        <p className="text-xl font-semibold text-blue-600">
                            {formatCurrency(isCustomer ? totals.totalReceipts : totals.totalPayments)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {isCustomer ? receipts.length : payments.length} transactions
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Balance {totals.balance >= 0 ? "Due" : "Advance"}</p>
                        <p className={`text-xl font-semibold ${totals.balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(Math.abs(totals.balance))}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {totals.balance >= 0 ? (isCustomer ? "Receivable" : "Payable") : "Advance paid"}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Opening Balance</p>
                        <p className="text-xl font-semibold text-gray-700">
                            {party.openingBalanceAmount ? `₹${party.openingBalanceAmount}` : '-'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {party.openingBalanceType || '-'}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">GST Type</p>
                        <p className="text-xl font-semibold text-gray-700">
                            {party.gstType || 'Unregistered'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {party.billingState || party.billingDistrict || '-'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-gray-200">
                <div className="flex gap-1">
                    {[
                        { key: 'all', label: 'All Transactions', count: allTransactions.length },
                        { key: 'sales', label: 'Sales', count: sales.length },
                        { key: 'purchases', label: 'Purchases', count: purchases.length },
                        { key: 'receipts', label: 'Receipts', count: receipts.length },
                        { key: 'payments', label: 'Payments', count: payments.length },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                                    ? 'text-blue-600 border-blue-600'
                                    : 'text-gray-500 border-transparent hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Transaction Table */}
            <div className="flex-1 overflow-auto px-6 py-4">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Invoice/Reference</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Against Invoice</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Description</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Amount</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {(activeTab === 'all' ? allTransactions :
                                activeTab === 'sales' ? sales.map(s => ({ ...s, _type: 'sale', _date: s.date || s.invoiceDate })) :
                                    activeTab === 'purchases' ? purchases.map(p => ({ ...p, _type: 'purchase', _date: p.date || p.invoiceDate })) :
                                        activeTab === 'receipts' ? receipts.map(r => ({ ...r, _type: 'receipt', _date: r.date })) :
                                            payments.map(p => ({ ...p, _type: 'payment', _date: p.date }))
                            ).map((txn, idx) => {
                                // Determine status based on transaction type and payment info
                                const getStatus = () => {
                                    if (txn._type === 'receipt' || txn._type === 'payment') {
                                        return 'Completed';
                                    }
                                    // For sales/purchases, check payment status
                                    if (txn.paymentStatus) return txn.paymentStatus;
                                    if (txn.status) return txn.status;
                                    const total = parseFloat(txn.totalAmount || txn.grandTotal || 0);
                                    const paid = parseFloat(txn.paidAmount || txn.amountPaid || txn.receivedAmount || 0);
                                    if (paid >= total && total > 0) return 'Paid';
                                    if (paid > 0 && paid < total) return 'Partial';
                                    return 'Unpaid';
                                };
                                const status = getStatus();
                                const statusStyle =
                                    status === 'Paid' || status === 'Completed' || status === 'paid' || status === 'completed'
                                        ? 'bg-green-50 text-green-700'
                                        : status === 'Partial' || status === 'partial'
                                            ? 'bg-yellow-50 text-yellow-700'
                                            : 'bg-red-50 text-red-700';

                                return (
                                    <tr key={txn._id || txn.id || idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {formatDate(txn._date || txn.date || txn.invoiceDate)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${txn._type === 'sale' ? 'bg-green-100 text-green-800' :
                                                    txn._type === 'purchase' ? 'bg-orange-100 text-orange-800' :
                                                        txn._type === 'receipt' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-red-100 text-red-800'
                                                }`}>
                                                {txn._type === 'sale' ? 'Sale' :
                                                    txn._type === 'purchase' ? 'Purchase' :
                                                        txn._type === 'receipt' ? 'Receipt' : 'Payment'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                            {getInvoiceReference(txn)}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {getAgainstInvoice(txn) !== '-' ? (
                                                <span className="text-blue-600 font-medium">{getAgainstInvoice(txn)}</span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                                            {txn.description || txn.notes ||
                                                (txn.items?.length ? `${txn.items.length} item(s)` : '-')}
                                        </td>
                                        <td className={`px-4 py-3 text-sm font-medium text-right ${txn._type === 'sale' || txn._type === 'receipt' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {formatCurrency(txn.totalAmount || txn.grandTotal || txn.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs capitalize ${statusStyle}`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handlePreviewPdf(txn)}
                                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                                title="Preview PDF"
                                            >
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3v5a1 1 0 001 1h5" />
                                                </svg>
                                                PDF
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {(activeTab === 'all' ? allTransactions :
                                activeTab === 'sales' ? sales :
                                    activeTab === 'purchases' ? purchases :
                                        activeTab === 'receipts' ? receipts : payments
                            ).length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                            No {activeTab === 'all' ? 'transactions' : activeTab} found for this {partyLabel.toLowerCase()}
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PDF Preview Modal */}
            {selectedTxnForPdf && (
                <PdfPreviewModal
                    isOpen={isPdfPreviewOpen}
                    onClose={handleClosePdfPreview}
                    fetchPdfBlob={getPdfBlob}
                    title={getPdfTitle()}
                    filename={getPdfFilename()}
                />
            )}
        </div>
    );
}
