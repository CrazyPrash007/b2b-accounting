// CustomerPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useCustomer from "./hooks/useCustomer";
import { exportTableToExcel } from "../../../utils/excelExport";
import { authFetch, API_BASE_URL } from "../../../services/apiClient";
import { getCurrentCompany } from "../../../services/companyContextAccessor";
import CustomerModal from "./components/CustomerModal";

// Fullstack API URL for chat invitees
const FULLSTACK_API_URL = import.meta.env.VITE_CHAT_API_URL;

/**
 * Helper function to add party as invitee in fullstack chat
 */
async function addPartyAsInvitee(partyData) {
    const phone = partyData.mobileNumber?.trim();
    if (!phone) return; // No phone number, skip

    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Extract userId from token
        const match = token.match(/proto-token:([0-9a-fA-F]{24})$/);
        if (!match) return;

        const response = await fetch(`${FULLSTACK_API_URL}/manual-contacts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
                'X-User-Id': match[1],
                'user-id': match[1],
            },
            body: JSON.stringify({
                name: partyData.customerName || partyData.vendorName || partyData.name,
                companyName: partyData.companyName || '',
                phoneNumbers: [phone],
            }),
        });

        if (response.ok) {
            console.log('Added party as invitee in chat:');
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.warn('[CustomerPage] Failed to add invitee:', errorData.message || response.statusText);
        }
    } catch (err) {
        // Silently fail - this is a non-critical feature
        console.warn('[CustomerPage] Error adding party as invitee:', err.message);
    }
}

/**
 * CustomerPage - Customer management with Excel-like table
 */
export default function CustomerPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const { rows: customers = [], meta = {}, loading, error, reload, create, update, remove } =
        useCustomer({ useLocalFallback: true });

    const [selectedCell, setSelectedCell] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all"); // all, withDue, withoutDue
    const [registeredUserConflict, setRegisteredUserConflict] = useState(null);

    const totalPending = meta.totalPending || 0;

    // Filter customers based on search and filter type
    const filteredCustomers = customers.filter(customer => {
        // Search filter - includes name, mobile, company, billing location
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm ||
            (customer.customerName?.toLowerCase().includes(searchLower)) ||
            (customer.companyName?.toLowerCase().includes(searchLower)) ||
            (customer.mobileNumber?.includes(searchTerm)) ||
            (customer.billingAddress?.toLowerCase().includes(searchLower)) ||
            (customer.billingPinCode?.includes(searchTerm)) ||
            (customer.billingVillage?.toLowerCase().includes(searchLower)) ||
            (customer.billingTehsil?.toLowerCase().includes(searchLower)) ||
            (customer.billingDistrict?.toLowerCase().includes(searchLower)) ||
            (customer.billingState?.toLowerCase().includes(searchLower)) ||
            (customer.billingCountry?.toLowerCase().includes(searchLower));

        // Type filter
        const pending = customer.pendingAmount || 0;
        const matchesType =
            filterType === "all" ||
            (filterType === "withDue" && pending !== 0) ||
            (filterType === "withoutDue" && pending === 0);

        return matchesSearch && matchesType;
    });

    useEffect(() => {
        if (location.state?.savedCustomer || location.state?.deletedCustomerId) {
            // server is source of truth now — reload list
            reload();
            // Clear the navigation state
            window.history.replaceState({}, document.title);
        }
    }, [location.state, reload]);



    const handleOpenCreate = () => {
        setEditingCustomer(null);
        setIsModalOpen(true);
    };

    const handleEditCustomer = (customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
        setRegisteredUserConflict(null);
    };

    const handleSaveCustomer = async (customerData, isEdit) => {
        try {
            if (isEdit) {
                // Single customer update
                await update(customerData.id, {
                    customerName: customerData.customerName,
                    mobileNumber: customerData.mobileNumber || "",
                    emailAddress: customerData.emailAddress || "",
                    websiteLink: customerData.websiteLink || "",
                    companyName: customerData.companyName || "",
                    gstType: customerData.gstType || "Unregistered",
                    gstNumber: customerData.gstType === "Unregistered" ? "" : (customerData.gstNumber || ""),
                    billingAddress: customerData.billingAddress || "",
                    billingPinCode: customerData.billingPinCode || "",
                    billingVillage: customerData.billingVillage || "",
                    billingTehsil: customerData.billingTehsil || "",
                    billingDistrict: customerData.billingDistrict || "",
                    billingState: customerData.billingState || "",
                    billingCountry: customerData.billingCountry || "India",
                    sameAsBilling: customerData.sameAsBilling ?? true,
                    shippingAddress: customerData.shippingAddress || "",
                    shippingPinCode: customerData.shippingPinCode || "",
                    shippingVillage: customerData.shippingVillage || "",
                    shippingTehsil: customerData.shippingTehsil || "",
                    shippingDistrict: customerData.shippingDistrict || "",
                    shippingState: customerData.shippingState || "",
                    shippingCountry: customerData.shippingCountry || "India",
                    openingBalanceType: customerData.openingBalanceType || "Credit",
                    openingBalanceAmount: customerData.openingBalanceAmount || 0,
                });
            } else if (Array.isArray(customerData)) {
                // Batch creation - call backend batch API
                const companyId = getCurrentCompany();
                const res = await authFetch(`${API_BASE_URL}/api/customers/batch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customers: customerData.map(c => ({
                            customerName: c.customerName,
                            mobileNumber: c.mobileNumber || "",
                            emailAddress: c.emailAddress || "",
                            websiteLink: c.websiteLink || "",
                            companyName: c.companyName || "",
                            gstType: c.gstType || "Unregistered",
                            gstNumber: c.gstType === "Unregistered" ? "" : (c.gstNumber || ""),
                            billingAddress: c.billingAddress || "",
                            billingPinCode: c.billingPinCode || "",
                            billingVillage: c.billingVillage || "",
                            billingTehsil: c.billingTehsil || "",
                            billingDistrict: c.billingDistrict || "",
                            billingState: c.billingState || "",
                            billingCountry: c.billingCountry || "India",
                            sameAsBilling: c.sameAsBilling ?? true,
                            shippingAddress: c.shippingAddress || "",
                            shippingPinCode: c.shippingPinCode || "",
                            shippingVillage: c.shippingVillage || "",
                            shippingTehsil: c.shippingTehsil || "",
                            shippingDistrict: c.shippingDistrict || "",
                            shippingState: c.shippingState || "",
                            shippingCountry: c.shippingCountry || "India",
                            openingBalanceType: c.openingBalanceType || "Credit",
                            openingBalanceAmount: c.openingBalanceAmount || 0,
                            // Registered user linkage
                            registeredUserId: c.registeredUserId || undefined,
                            registeredCompanyId: c.registeredCompanyId || undefined,
                            isFromRegistered: c.isFromRegistered || false,
                        })),
                        accountCompanyName: companyId
                    })
                });

                const result = await res.json();

                if (result.success) {
                    alert(`Successfully created ${result.summary.created} customer(s)${result.summary.failed > 0 ? `, ${result.summary.failed} failed` : ''}`);

                    // Add successful customers as invitees in fullstack chat
                    if (result.data && Array.isArray(result.data)) {
                        for (const item of result.data) {
                            if (item.success && item.data?.mobileNumber) {
                                addPartyAsInvitee(item.data);
                            }
                        }
                    }
                } else {
                    throw new Error(result.error?.message || 'Batch creation failed');
                }
            } else {
                // Single customer creation
                await create({
                    customerName: customerData.customerName,
                    name: customerData.name || customerData.customerName,
                    mobileNumber: customerData.mobileNumber || "",
                    emailAddress: customerData.emailAddress || "",
                    websiteLink: customerData.websiteLink || "",
                    companyName: customerData.companyName || "",
                    gstType: customerData.gstType || "Unregistered",
                    gstNumber: customerData.gstType === "Unregistered" ? "" : (customerData.gstNumber || ""),
                    billingAddress: customerData.billingAddress || "",
                    billingPinCode: customerData.billingPinCode || "",
                    billingVillage: customerData.billingVillage || "",
                    billingTehsil: customerData.billingTehsil || "",
                    billingDistrict: customerData.billingDistrict || "",
                    billingState: customerData.billingState || "",
                    billingCountry: customerData.billingCountry || "India",
                    sameAsBilling: customerData.sameAsBilling ?? true,
                    shippingAddress: customerData.shippingAddress || "",
                    shippingPinCode: customerData.shippingPinCode || "",
                    shippingVillage: customerData.shippingVillage || "",
                    shippingTehsil: customerData.shippingTehsil || "",
                    shippingDistrict: customerData.shippingDistrict || "",
                    shippingState: customerData.shippingState || "",
                    shippingCountry: customerData.shippingCountry || "India",
                    openingBalanceType: customerData.openingBalanceType || "Credit",
                    openingBalanceAmount: customerData.openingBalanceAmount || 0,
                    // Registered user linkage
                    registeredUserId: customerData.registeredUserId || undefined,
                    registeredCompanyId: customerData.registeredCompanyId || undefined,
                    isFromRegistered: customerData.isFromRegistered || false,
                });

                // Add customer as invitee in fullstack chat (only for new customers)
                if (customerData.mobileNumber) {
                    addPartyAsInvitee(customerData);
                }
            }
            setIsModalOpen(false);
            setEditingCustomer(null);
            setRegisteredUserConflict(null);
            reload(); // Reload the list to show new customers
        } catch (err) {
            console.error("Failed to save customer:", err);
            // Handle 409 REGISTERED_USER_EXISTS — show registered users in modal
            const errData = err?.response?.data;
            if (errData?.code === 'REGISTERED_USER_EXISTS' && errData?.registeredUsers) {
                // Normalize field names: backend uses userId/userName/userPhone, frontend expects registeredUserId/name/phone
                const normalized = errData.registeredUsers.map(u => ({
                    name: u.userName || u.name || '',
                    phone: u.userPhone || u.phone || '',
                    email: u.userEmail || u.email || '',
                    registeredUserId: u.userId || u.registeredUserId || u._id,
                    companies: (u.companies || []).map(c => ({
                        ...c,
                        registeredCompanyId: c.companyId || c.registeredCompanyId || c._id,
                    })),
                }));
                setRegisteredUserConflict(normalized);
                return; // Keep modal open
            }
            throw new Error(err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || "Failed to save customer. Please check required fields and try again.");
        }
    };

    const handleDeleteCustomer = async (id) => {
        if (!window.confirm("Are you sure you want to delete this customer?")) return;
        try {
            await remove(id);
            setIsModalOpen(false);
            setEditingCustomer(null);
        } catch (err) {
            console.error("Failed to delete customer:", err);
            throw new Error(err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || "Failed to delete customer");
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
            { header: 'Customer Name', key: 'customerName' },
            { header: 'Mobile', key: 'mobileNumber' },
            { header: 'Email', key: 'emailAddress' },
            { header: 'Company', key: 'companyName' },
            { header: 'GST Type', key: 'gstType' },
            { header: 'Billing Address', key: 'billingAddress' },
            { header: 'District', key: 'billingDistrict' },
            { header: 'State', key: 'billingState' },
            { header: 'Opening Balance', key: 'openingBalance' },
        ];

        const exportData = customers.map(customer => ({
            customerName: customer.customerName || '-',
            mobileNumber: customer.mobileNumber || '-',
            emailAddress: customer.emailAddress || '-',
            companyName: customer.companyName || '-',
            gstType: customer.gstType || '-',
            billingAddress: customer.billingAddress || '-',
            billingDistrict: customer.billingDistrict || '-',
            billingState: customer.billingState || '-',
            openingBalance: customer.openingBalanceAmount ? `₹${customer.openingBalanceAmount} (${customer.openingBalanceType})` : '-',
        }));

        exportTableToExcel(exportData, columns, 'Customers_Report', 'Customers');
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

    const emptyRowsCount = Math.max(0, visibleRows - filteredCustomers.length);
    const emptyRows = Array.from({ length: emptyRowsCount }, (_, i) => i);

    const totalRecords = filteredCustomers.length;
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
                    <h2 className="text-lg font-semibold text-gray-900">Customer Master</h2>
                    <button className="text-gray-400 hover:text-yellow-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </button>
                    {totalPending !== 0 && (
                        <div className={`px-3 py-1 rounded-md text-sm font-semibold ${totalPending >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            Total Pending: ₹{Math.abs(totalPending).toFixed(2)} {totalPending >= 0 ? '(Receivable)' : '(Payable)'}
                        </div>
                    )}
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Customer
                </button>
            </div>

            {/* Toolbar - Filter and Search Controls */}
            <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search name, company, mobile, city..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm w-72 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Filter by due amount */}
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="all">All Customers</option>
                        <option value="withDue">With Pending Amount</option>
                        <option value="withoutDue">No Pending Amount</option>
                    </select>

                    {/* Results count */}
                    <span className="text-sm text-gray-600">
                        {filteredCustomers.length} of {customers.length} customers
                    </span>
                </div>

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
            </div>
            {/*
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
            </div>
            */}

            {/* Table Container - Scrollable with horizontal scroll */}
            <div
                ref={tableContainerRef}
                className="flex-1 overflow-auto px-4 pb-1"
                onClick={handleTableContainerClick}
            >
                <div className="border border-gray-400 rounded overflow-hidden h-full">
                    <div className="overflow-x-auto h-full">
                        <table className="min-w-[1800px] w-full border-collapse text-sm" style={{ borderSpacing: 0 }}>
                            <thead className="sticky top-0 z-10 bg-white">
                                <tr className="border-b border-gray-400">
                                    <th className="min-w-[160px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                            <span>Customer Name</span>
                                        </div>
                                    </th>
                                    <th className="min-w-[120px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                            <span>Mobile</span>
                                        </div>
                                    </th>
                                    <th className="min-w-[150px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                            <span>Company</span>
                                        </div>
                                    </th>
                                    <th className="min-w-[140px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                            <span>Pending Amount</span>
                                        </div>
                                    </th>
                                    <th className="min-w-[140px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                            <span>Opening Balance</span>
                                        </div>
                                    </th>
                                    <th className="min-w-[180px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                            <span>Email</span>
                                        </div>
                                    </th>
                                    <th className="min-w-[110px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                            <span>GST Type</span>
                                        </div>
                                    </th>
                                    <th className="min-w-[200px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                            <span>Billing Address</span>
                                        </div>
                                    </th>
                                    <th className="min-w-[120px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                            <span>District</span>
                                        </div>
                                    </th>
                                    <th className="min-w-[120px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                            <span>State</span>
                                        </div>
                                    </th>
                                    <th className="min-w-[100px] h-9 px-4 text-left text-sm font-medium text-gray-700 sticky right-0 z-20 bg-gray-100 border-l border-gray-400" style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.15)' }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Data rows */}
                                {filteredCustomers.map((customer, rowIndex) => (
                                    <tr
                                        key={customer.id || customer._id || rowIndex}
                                        className={`border-b border-gray-400 hover:bg-blue-100 transition-colors cursor-pointer ${rowIndex % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'}`}
                                        onClick={() => navigate(`/customer/${customer.id || customer._id}`)}
                                    >
                                        <td
                                            className={getCellClasses(rowIndex, 0) + " text-left text-blue-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 0); navigate(`/customer/${customer.id || customer._id}`); }}
                                        >
                                            {customer.customerName}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 1) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 1); navigate(`/customer/${customer.id || customer._id}`); }}
                                        >
                                            {customer.mobileNumber || "-"}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 2) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 2); navigate(`/customer/${customer.id || customer._id}`); }}
                                        >
                                            {customer.companyName || "-"}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 3) + ` text-left font-semibold ${customer.pendingAmount >= 0 ? 'text-green-700' : 'text-red-700'}`}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 3); navigate(`/customer/${customer.id || customer._id}`); }}
                                        >
                                            {customer.pendingAmount != null ? `₹${Math.abs(customer.pendingAmount).toFixed(2)}` : '-'}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 4) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 4); navigate(`/customer/${customer.id || customer._id}`); }}
                                        >
                                            {customer.openingBalanceAmount ? `₹${customer.openingBalanceAmount} (${customer.openingBalanceType})` : '-'}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 5) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 5); navigate(`/customer/${customer.id || customer._id}`); }}
                                        >
                                            {customer.emailAddress || "-"}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 6) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 6); navigate(`/customer/${customer.id || customer._id}`); }}
                                        >
                                            {customer.gstType || "-"}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 7) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 7); navigate(`/customer/${customer.id || customer._id}`); }}
                                        >
                                            {customer.billingAddress || "-"}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 8) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 8); navigate(`/customer/${customer.id || customer._id}`); }}
                                        >
                                            {customer.billingDistrict || "-"}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 9) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 9); navigate(`/customer/${customer.id || customer._id}`); }}
                                        >
                                            {customer.billingState || "-"}
                                        </td>
                                        <td className={`h-8 px-4 text-left sticky right-0 z-10 border-l border-gray-400 ${rowIndex % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`} style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.1)' }} onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEditCustomer(customer); }}
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
                                {/* Empty rows */}
                                {emptyRows.map((_, idx) => {
                                    const rowIndex = customers.length + idx;
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
                                            <td className={getCellClasses(rowIndex, 8)} onClick={() => handleCellClick(rowIndex, 8)}></td>
                                            <td className={getCellClasses(rowIndex, 9)} onClick={() => handleCellClick(rowIndex, 9)}></td>
                                            <td className={`h-8 px-4 sticky right-0 z-10 border-l border-gray-400 ${rowIndex % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`} style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.1)' }}></td>
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

            {/* Customer Modal */}
            <CustomerModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveCustomer}
                onDelete={handleDeleteCustomer}
                editData={editingCustomer}
                registeredUserConflict={registeredUserConflict}
                onClearConflict={() => setRegisteredUserConflict(null)}
            />
        </div>
    );
}
