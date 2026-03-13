// VendorPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useVendor from "./hooks/useVendor";
import { exportTableToExcel } from "../../../utils/excelExport";
import { authFetch, API_BASE_URL } from "../../../services/apiClient";
import VendorModal from "./components/VendorModal";

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
                name: partyData.vendorName || partyData.customerName || partyData.name,
                companyName: partyData.companyName || '',
                phoneNumbers: [phone],
            }),
        });

        if (response.ok) {
            console.log('Added party as invitee in chat:');
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.warn('[VendorPage] Failed to add invitee:', errorData.message || response.statusText);
        }
    } catch (err) {
        // Silently fail - this is a non-critical feature
        console.warn('[VendorPage] Error adding party as invitee:', err.message);
    }
}

/**
 * VendorPage - Vendor management with Excel-like table
 */
export default function VendorPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const { rows: vendors = [], meta = {}, loading, error, reload, create, update, remove } =
        useVendor({ useLocalFallback: true });

    const [selectedCell, setSelectedCell] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all"); // all, withDue, withoutDue
    const [registeredUserConflict, setRegisteredUserConflict] = useState(null);

    const totalPayable = meta.totalPayable || 0;

    // Filter vendors based on search and filter type
    const filteredVendors = vendors.filter(vendor => {
        // Search filter - includes name, mobile, company, billing location
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm ||
            (vendor.vendorName?.toLowerCase().includes(searchLower)) ||
            (vendor.companyName?.toLowerCase().includes(searchLower)) ||
            (vendor.mobileNumber?.includes(searchTerm)) ||
            (vendor.billingAddress?.toLowerCase().includes(searchLower)) ||
            (vendor.billingPinCode?.includes(searchTerm)) ||
            (vendor.billingVillage?.toLowerCase().includes(searchLower)) ||
            (vendor.billingTehsil?.toLowerCase().includes(searchLower)) ||
            (vendor.billingDistrict?.toLowerCase().includes(searchLower)) ||
            (vendor.billingState?.toLowerCase().includes(searchLower)) ||
            (vendor.billingCountry?.toLowerCase().includes(searchLower));

        // Type filter
        const payable = vendor.payableAmount || 0;
        const matchesType =
            filterType === "all" ||
            (filterType === "withDue" && payable !== 0) ||
            (filterType === "withoutDue" && payable === 0);

        return matchesSearch && matchesType;
    });

    useEffect(() => {
        if (location.state?.savedVendor || location.state?.deletedVendorId) {
            // server is source of truth now — reload list
            reload();
            window.history.replaceState({}, document.title);
        }
    }, [location.state, reload]);


    const handleOpenCreate = () => {
        setEditingVendor(null);
        setIsModalOpen(true);
    };

    const handleEditVendor = (vendor) => {
        setEditingVendor(vendor);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingVendor(null);
        setRegisteredUserConflict(null);
    };

    const handleSaveVendor = async (vendorData, isEdit) => {
        try {
            // Check if vendorData is an array (batch mode)
            if (Array.isArray(vendorData)) {
                // Batch creation
                const response = await authFetch(`${API_BASE_URL}/api/vendors/batch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ vendors: vendorData }),
                });

                if (!response.ok) {
                    throw new Error('Batch creation failed');
                }

                const result = await response.json();
                const { created = 0, errors = [] } = result.data || result;

                if (errors.length > 0) {
                    alert(`Created ${created} vendor(s).\n\nErrors:\n${errors.map(e => `- ${e.vendorName}: ${e.error}`).join('\n')}`);
                } else {
                    alert(`Successfully created ${created} vendor(s)!`);
                }

                // Add all successful vendors as invitees
                const successfulVendors = vendorData.filter((_, idx) =>
                    !errors.some(e => e.vendorName === vendorData[idx].vendorName)
                );
                successfulVendors.forEach(vendor => {
                    if (vendor.mobileNumber) addPartyAsInvitee(vendor);
                });

                reload();
                setIsModalOpen(false);
                setEditingVendor(null);
                return;
            }

            // Single vendor mode (create or edit)
            // Debug: log incoming vendorData
            console.log('[VendorPage] vendorData received:', vendorData);
            console.log('[VendorPage] gstType:', vendorData.gstType, 'gstNumber:', vendorData.gstNumber);

            const payloadCommon = {
                vendorName: vendorData.vendorName,
                name: vendorData.name || vendorData.vendorName,
                mobileNumber: vendorData.mobileNumber || "",
                emailAddress: vendorData.emailAddress || "",
                websiteLink: vendorData.websiteLink || "",
                companyName: vendorData.companyName || "",
                gstType: vendorData.gstType || "Unregistered",
                gstNumber: vendorData.gstNumber || "",
                billingAddress: vendorData.billingAddress || "",
                billingPinCode: vendorData.billingPinCode || "",
                billingVillage: vendorData.billingVillage || "",
                billingTehsil: vendorData.billingTehsil || "",
                billingDistrict: vendorData.billingDistrict || "",
                billingState: vendorData.billingState || "",
                billingCountry: vendorData.billingCountry || "India",
                sameAsBilling: vendorData.sameAsBilling ?? true,
                shippingAddress: vendorData.shippingAddress || "",
                shippingPinCode: vendorData.shippingPinCode || "",
                shippingVillage: vendorData.shippingVillage || "",
                shippingTehsil: vendorData.shippingTehsil || "",
                shippingDistrict: vendorData.shippingDistrict || "",
                shippingState: vendorData.shippingState || "",
                shippingCountry: vendorData.shippingCountry || "India",
                openingBalanceType: vendorData.openingBalanceType || "Credit",
                openingBalanceAmount: vendorData.openingBalanceAmount || 0,
                // Registered user linkage
                registeredUserId: vendorData.registeredUserId || undefined,
                registeredCompanyId: vendorData.registeredCompanyId || undefined,
                isFromRegistered: vendorData.isFromRegistered || false,
            };

            if (isEdit) {
                await update(vendorData.id, payloadCommon);
            } else {
                await create(payloadCommon);

                // Add vendor as invitee in fullstack chat (only for new vendors)
                if (vendorData.mobileNumber) {
                    addPartyAsInvitee(vendorData);
                }
            }

            setIsModalOpen(false);
            setEditingVendor(null);
            setRegisteredUserConflict(null);
        } catch (err) {
            console.error("Failed to save vendor:", err);
            // Handle 409 REGISTERED_USER_EXISTS — show registered users in modal
            const errData = err?.response?.data;
            if (errData?.code === 'REGISTERED_USER_EXISTS' && errData?.registeredUsers) {
                // Normalize backend field names to frontend field names
                const normalized = (errData.registeredUsers || []).map(u => ({
                    registeredUserId: u.registeredUserId || u.userId || u._id,
                    name: u.name || u.userName || "",
                    phone: u.phone || u.userPhone || "",
                    email: u.email || u.userEmail || "",
                    companies: Array.isArray(u.companies)
                        ? u.companies.map(c => ({
                            ...c,
                            registeredCompanyId: c.registeredCompanyId || c.companyId || c._id,
                        }))
                        : [],
                }));
                setRegisteredUserConflict(normalized);
                return; // Keep modal open
            }
            throw new Error(err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || "Failed to save vendor. Please check required fields and try again.");
        }
    };


    const handleDeleteVendor = async (id) => {
        if (!window.confirm("Are you sure you want to delete this vendor?")) return;
        try {
            await remove(id);
            setIsModalOpen(false);
            setEditingVendor(null);
        } catch (err) {
            console.error("Failed to delete vendor:", err);
            throw new Error(err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || "Failed to delete vendor");
        }
    };


    const handleExportToExcel = () => {
        const columns = [
            { header: 'Sr No', key: 'srNo' },
            { header: 'Vendor Name', key: 'name' },
            { header: 'Contact Person', key: 'contactPerson' },
            { header: 'Phone', key: 'phone' },
            { header: 'Email', key: 'email' },
            { header: 'GSTIN', key: 'gstin' },
            { header: 'Address', key: 'address' },
            { header: 'Opening Balance', key: 'openingBalance' },
            { header: 'Balance Type', key: 'balanceType' },
        ];
        const exportData = vendors.map((vendor, idx) => ({
            srNo: idx + 1,
            name: vendor.name || '-',
            contactPerson: vendor.contactPerson || '-',
            phone: vendor.phone || '-',
            email: vendor.email || '-',
            gstin: vendor.gstin || '-',
            address: vendor.address || '-',
            openingBalance: vendor.openingBalance != null ? `₹${vendor.openingBalance}` : '-',
            balanceType: vendor.balanceType || '-',
        }));
        exportTableToExcel(exportData, columns, 'Vendors');
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

    const emptyRowsCount = Math.max(0, visibleRows - filteredVendors.length);
    const emptyRows = Array.from({ length: emptyRowsCount }, (_, i) => i);

    const totalRecords = filteredVendors.length;
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
                    <h2 className="text-lg font-semibold text-gray-900">Vendor Master</h2>
                    <button className="text-gray-400 hover:text-yellow-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </button>
                    {totalPayable !== 0 && (
                        <div className="px-3 py-1 rounded-md text-sm font-semibold bg-red-100 text-red-800">
                            Total Payable: ₹{Math.abs(totalPayable).toFixed(2)}
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
                    Add Vendor
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
                        <option value="all">All Vendors</option>
                        <option value="withDue">With Payable Amount</option>
                        <option value="withoutDue">No Payable Amount</option>
                    </select>

                    {/* Results count */}
                    <span className="text-sm text-gray-600">
                        {filteredVendors.length} of {vendors.length} vendors
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
                                            <span>Vendor Name</span>
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
                                            <span>Payable Amount</span>
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
                                {filteredVendors.map((vendor, rowIndex) => (
                                    <tr
                                        key={vendor.id || vendor._id || rowIndex}
                                        className={`border-b border-gray-400 hover:bg-blue-100 transition-colors cursor-pointer ${rowIndex % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'}`}
                                        onClick={() => navigate(`/vendor/${vendor.id || vendor._id}`)}
                                    >
                                        <td
                                            className={getCellClasses(rowIndex, 0) + " text-left text-blue-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 0); navigate(`/vendor/${vendor.id || vendor._id}`); }}
                                        >
                                            {vendor.vendorName}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 1) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 1); navigate(`/vendor/${vendor.id || vendor._id}`); }}
                                        >
                                            {vendor.mobileNumber || "-"}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 2) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 2); navigate(`/vendor/${vendor.id || vendor._id}`); }}
                                        >
                                            {vendor.companyName || "-"}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 3) + " text-left font-semibold text-red-700"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 3); navigate(`/vendor/${vendor.id || vendor._id}`); }}
                                        >
                                            {vendor.payableAmount != null ? `₹${Math.abs(vendor.payableAmount).toFixed(2)}` : '-'}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 4) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 4); navigate(`/vendor/${vendor.id || vendor._id}`); }}
                                        >
                                            {vendor.openingBalanceAmount ? `₹${vendor.openingBalanceAmount} (${vendor.openingBalanceType})` : '-'}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 5) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 5); navigate(`/vendor/${vendor.id || vendor._id}`); }}
                                        >
                                            {vendor.emailAddress || "-"}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 6) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 6); navigate(`/vendor/${vendor.id || vendor._id}`); }}
                                        >
                                            {vendor.gstType || "-"}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 7) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 7); navigate(`/vendor/${vendor.id || vendor._id}`); }}
                                        >
                                            {vendor.billingAddress || "-"}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 8) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 8); navigate(`/vendor/${vendor.id || vendor._id}`); }}
                                        >
                                            {vendor.billingDistrict || "-"}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 9) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 9); navigate(`/vendor/${vendor.id || vendor._id}`); }}
                                        >
                                            {vendor.billingState || "-"}
                                        </td>
                                        <td className={`h-8 px-4 text-left sticky right-0 z-10 border-l border-gray-400 ${rowIndex % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`} style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.1)' }} onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEditVendor(vendor); }}
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
                                    const rowIndex = vendors.length + idx;
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
                                            <td className={getCellClasses(rowIndex, 4)} onClick={() => handleCellClick(rowIndex, 4)}></td>
                                            <td className={getCellClasses(rowIndex, 5)} onClick={() => handleCellClick(rowIndex, 5)}></td>
                                            <td className={getCellClasses(rowIndex, 6)} onClick={() => handleCellClick(rowIndex, 6)}></td>
                                            <td className={getCellClasses(rowIndex, 7)} onClick={() => handleCellClick(rowIndex, 7)}></td>
                                            <td className={getCellClasses(rowIndex, 8)} onClick={() => handleCellClick(rowIndex, 8)}></td>
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

            {/* Vendor Modal */}
            <VendorModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveVendor}
                onDelete={handleDeleteVendor}
                editData={editingVendor}
                registeredUserConflict={registeredUserConflict}
                onClearConflict={() => setRegisteredUserConflict(null)}
            />
        </div>
    );
}
