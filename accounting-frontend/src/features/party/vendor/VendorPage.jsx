// VendorPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useVendor from "./hooks/useVendor";
import { exportTableToExcel } from "../../../utils/excelExport";
/**
 * VendorModal - Modal for creating/editing vendors
 */
function VendorModal({ isOpen, onClose, onSave, onDelete, editData }) {
    // Basic Details
    const [vendorName, setVendorName] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");
    const [emailAddress, setEmailAddress] = useState("");
    const [websiteLink, setWebsiteLink] = useState("");

    // Company Details
    const [companyName, setCompanyName] = useState("");
    const [gstType, setGstType] = useState("Unregistered");

    // Billing Details
    const [billingAddress, setBillingAddress] = useState("");
    const [billingPinCode, setBillingPinCode] = useState("");
    const [billingVillage, setBillingVillage] = useState("");
    const [billingTehsil, setBillingTehsil] = useState("");
    const [billingDistrict, setBillingDistrict] = useState("");
    const [billingState, setBillingState] = useState("");
    const [billingCountry, setBillingCountry] = useState("India");

    // Shipping Details
    const [sameAsBilling, setSameAsBilling] = useState(true);
    const [shippingAddress, setShippingAddress] = useState("");
    const [shippingPinCode, setShippingPinCode] = useState("");
    const [shippingVillage, setShippingVillage] = useState("");
    const [shippingTehsil, setShippingTehsil] = useState("");
    const [shippingDistrict, setShippingDistrict] = useState("");
    const [shippingState, setShippingState] = useState("");
    const [shippingCountry, setShippingCountry] = useState("India");

    // Opening Balance
    const [openingBalanceType, setOpeningBalanceType] = useState("Credit");
    const [openingBalanceAmount, setOpeningBalanceAmount] = useState("");

    // Validation
    const [errorName, setErrorName] = useState("");

    const isEditMode = !!editData;

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setVendorName(editData.vendorName ?? "");
                setMobileNumber(editData.mobileNumber ?? "");
                setEmailAddress(editData.emailAddress ?? "");
                setWebsiteLink(editData.websiteLink ?? "");
                setCompanyName(editData.companyName ?? "");
                setGstType(editData.gstType ?? "Unregistered");
                setBillingAddress(editData.billingAddress ?? "");
                setBillingPinCode(editData.billingPinCode ?? "");
                setBillingVillage(editData.billingVillage ?? "");
                setBillingTehsil(editData.billingTehsil ?? "");
                setBillingDistrict(editData.billingDistrict ?? "");
                setBillingState(editData.billingState ?? "");
                setBillingCountry(editData.billingCountry ?? "India");
                setSameAsBilling(editData.sameAsBilling ?? true);
                setShippingAddress(editData.shippingAddress ?? "");
                setShippingPinCode(editData.shippingPinCode ?? "");
                setShippingVillage(editData.shippingVillage ?? "");
                setShippingTehsil(editData.shippingTehsil ?? "");
                setShippingDistrict(editData.shippingDistrict ?? "");
                setShippingState(editData.shippingState ?? "");
                setShippingCountry(editData.shippingCountry ?? "India");
                setOpeningBalanceType(editData.openingBalanceType ?? "Credit");
                setOpeningBalanceAmount(editData.openingBalanceAmount ?? "");
            } else {
                // Reset to defaults
                setVendorName("");
                setMobileNumber("");
                setEmailAddress("");
                setWebsiteLink("");
                setCompanyName("");
                setGstType("Unregistered");
                setBillingAddress("");
                setBillingPinCode("");
                setBillingVillage("");
                setBillingTehsil("");
                setBillingDistrict("");
                setBillingState("");
                setBillingCountry("India");
                setSameAsBilling(true);
                setShippingAddress("");
                setShippingPinCode("");
                setShippingVillage("");
                setShippingTehsil("");
                setShippingDistrict("");
                setShippingState("");
                setShippingCountry("India");
                setOpeningBalanceType("Credit");
                setOpeningBalanceAmount("");
            }
            setErrorName("");
        }
    }, [editData, isOpen]);

    const baseInput =
        "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";

    const handleSave = () => {
        setErrorName("");
        const trimmedName = vendorName.trim();

        if (!trimmedName) {
            setErrorName("Vendor Name is required");
            return;
        }

        const payload = {
            id: editData?.id ?? String(Date.now()),
            vendorName: trimmedName,
            name: trimmedName, // for table display
            mobileNumber: mobileNumber.trim(),
            emailAddress: emailAddress.trim(),
            websiteLink: websiteLink.trim(),
            companyName: companyName.trim(),
            gstType,
            billingAddress: billingAddress.trim(),
            billingPinCode: billingPinCode.trim(),
            billingVillage: billingVillage.trim(),
            billingTehsil: billingTehsil.trim(),
            billingDistrict: billingDistrict.trim(),
            billingState: billingState.trim(),
            billingCountry: billingCountry.trim(),
            sameAsBilling,
            shippingAddress: sameAsBilling ? billingAddress.trim() : shippingAddress.trim(),
            shippingPinCode: sameAsBilling ? billingPinCode.trim() : shippingPinCode.trim(),
            shippingVillage: sameAsBilling ? billingVillage.trim() : shippingVillage.trim(),
            shippingTehsil: sameAsBilling ? billingTehsil.trim() : shippingTehsil.trim(),
            shippingDistrict: sameAsBilling ? billingDistrict.trim() : shippingDistrict.trim(),
            shippingState: sameAsBilling ? billingState.trim() : shippingState.trim(),
            shippingCountry: sameAsBilling ? billingCountry.trim() : shippingCountry.trim(),
            openingBalanceType,
            openingBalanceAmount: openingBalanceAmount || "",
        };

        onSave(payload, isEditMode);
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
            const form = e.target.closest('[data-form-container]');
            if (!form) return;
            
            const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
            const currentIndex = inputs.indexOf(e.target);
            
            if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
                inputs[currentIndex + 1].focus();
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-3 rounded-t-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <h3 className="text-base font-semibold text-white">
                        {isEditMode ? "Edit Vendor" : "New Vendor"}
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
                <div className="px-5 py-4 overflow-y-auto flex-1" data-form-container onKeyDown={handleKeyDown}>
                    {/* Basic Details Section */}
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2 pb-1 border-b border-gray-200">Basic Details</h4>
                        <div className="grid grid-cols-4 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Vendor Name<span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={vendorName}
                                    onChange={(e) => {
                                        setVendorName(e.target.value);
                                        if (errorName) setErrorName("");
                                    }}
                                    className={baseInput + (errorName ? " border-red-500" : "")}
                                    placeholder="Enter Vendor Name"
                                    autoFocus
                                />
                                {errorName && <p className="mt-1 text-xs text-red-500">{errorName}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                                <input
                                    type="text"
                                    value={mobileNumber}
                                    onChange={(e) => setMobileNumber(e.target.value)}
                                    className={baseInput}
                                    placeholder="Enter Mobile Number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={emailAddress}
                                    onChange={(e) => setEmailAddress(e.target.value)}
                                    className={baseInput}
                                    placeholder="Enter Email"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Website Link</label>
                                <input
                                    type="text"
                                    value={websiteLink}
                                    onChange={(e) => setWebsiteLink(e.target.value)}
                                    className={baseInput}
                                    placeholder="Enter Website URL"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Company Details Section */}
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2 pb-1 border-b border-gray-200">Company Details</h4>
                        <div className="grid grid-cols-4 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className={baseInput}
                                    placeholder="Enter Company Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">GST Type</label>
                                <select
                                    value={gstType}
                                    onChange={(e) => setGstType(e.target.value)}
                                    className={baseInput}
                                >
                                    <option value="Regular">Regular</option>
                                    <option value="Composition">Composition</option>
                                    <option value="Unregistered">Unregistered</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Billing Details Section */}
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2 pb-1 border-b border-gray-200">Billing Details</h4>
                        <div className="grid grid-cols-4 gap-3 mb-2">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Address</label>
                                <input
                                    type="text"
                                    value={billingAddress}
                                    onChange={(e) => setBillingAddress(e.target.value)}
                                    className={baseInput}
                                    placeholder="Enter Shop Address"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                                <input
                                    type="text"
                                    value={billingPinCode}
                                    onChange={(e) => setBillingPinCode(e.target.value)}
                                    className={baseInput}
                                    placeholder="Enter PIN Code"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Village / Colony</label>
                                <input
                                    type="text"
                                    value={billingVillage}
                                    onChange={(e) => setBillingVillage(e.target.value)}
                                    className={baseInput}
                                    placeholder="Enter Village/Colony"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tehsil / Taluka</label>
                                <input
                                    type="text"
                                    value={billingTehsil}
                                    onChange={(e) => setBillingTehsil(e.target.value)}
                                    className={baseInput}
                                    placeholder="Enter Tehsil/Taluka"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                                <input
                                    type="text"
                                    value={billingDistrict}
                                    onChange={(e) => setBillingDistrict(e.target.value)}
                                    className={baseInput}
                                    placeholder="Enter District"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                <input
                                    type="text"
                                    value={billingState}
                                    onChange={(e) => setBillingState(e.target.value)}
                                    className={baseInput}
                                    placeholder="Enter State"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                <input
                                    type="text"
                                    value={billingCountry}
                                    onChange={(e) => setBillingCountry(e.target.value)}
                                    className={baseInput}
                                    placeholder="Enter Country"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Shipping Details Section */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-800">Shipping Details</h4>
                            <label className="inline-flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={sameAsBilling}
                                    onChange={(e) => setSameAsBilling(e.target.checked)}
                                />
                                <span>Same as Billing Details</span>
                            </label>
                        </div>
                        {!sameAsBilling && (
                            <>
                                <div className="grid grid-cols-4 gap-3 mb-2">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Shop Address</label>
                                        <input
                                            type="text"
                                            value={shippingAddress}
                                            onChange={(e) => setShippingAddress(e.target.value)}
                                            className={baseInput}
                                            placeholder="Enter Shop Address"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                                        <input
                                            type="text"
                                            value={shippingPinCode}
                                            onChange={(e) => setShippingPinCode(e.target.value)}
                                            className={baseInput}
                                            placeholder="Enter PIN Code"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Village / Colony</label>
                                        <input
                                            type="text"
                                            value={shippingVillage}
                                            onChange={(e) => setShippingVillage(e.target.value)}
                                            className={baseInput}
                                            placeholder="Enter Village/Colony"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tehsil / Taluka</label>
                                        <input
                                            type="text"
                                            value={shippingTehsil}
                                            onChange={(e) => setShippingTehsil(e.target.value)}
                                            className={baseInput}
                                            placeholder="Enter Tehsil/Taluka"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                                        <input
                                            type="text"
                                            value={shippingDistrict}
                                            onChange={(e) => setShippingDistrict(e.target.value)}
                                            className={baseInput}
                                            placeholder="Enter District"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                        <input
                                            type="text"
                                            value={shippingState}
                                            onChange={(e) => setShippingState(e.target.value)}
                                            className={baseInput}
                                            placeholder="Enter State"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                        <input
                                            type="text"
                                            value={shippingCountry}
                                            onChange={(e) => setShippingCountry(e.target.value)}
                                            className={baseInput}
                                            placeholder="Enter Country"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Opening Balance Section */}
                    <div className="mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2 pb-1 border-b border-gray-200">Opening Balance</h4>
                        <div className="grid grid-cols-4 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Balance Type</label>
                                <select
                                    value={openingBalanceType}
                                    onChange={(e) => setOpeningBalanceType(e.target.value)}
                                    className={baseInput}
                                >
                                    <option value="Credit">Received (Credit)</option>
                                    <option value="Debit">Payment (Debit)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                <input
                                    type="number"
                                    value={openingBalanceAmount}
                                    onChange={(e) => setOpeningBalanceAmount(e.target.value)}
                                    className={baseInput}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
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
 * VendorPage - Vendor management with Excel-like table
 */
export default function VendorPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const { rows: vendors = [], loading, error, reload, create, update, remove } =
        useVendor({ useLocalFallback: true });

    const [selectedCell, setSelectedCell] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);

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
    };

    const handleSaveVendor = async (vendorData, isEdit) => {
        try {
            const payloadCommon = {
                vendorName: vendorData.vendorName,
                name: vendorData.name || vendorData.vendorName,
                mobileNumber: vendorData.mobileNumber || "",
                emailAddress: vendorData.emailAddress || "",
                websiteLink: vendorData.websiteLink || "",
                companyName: vendorData.companyName || "",
                gstType: vendorData.gstType || "Unregistered",
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
            };

            if (isEdit) {
                await update(vendorData.id, payloadCommon);
            } else {
                await create(payloadCommon);
            }

            setIsModalOpen(false);
            setEditingVendor(null);
        } catch (err) {
            console.error("Failed to save vendor:", err);
            alert(err?.message || "Failed to save vendor");
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
            alert(err?.message || "Failed to delete vendor");
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

    const emptyRowsCount = Math.max(0, visibleRows - vendors.length);
    const emptyRows = Array.from({ length: emptyRowsCount }, (_, i) => i);

    const totalRecords = vendors.length;
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

            {/* Toolbar - Icons commented out */}
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
                                <th className="min-w-[180px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Email</span>
                                    </div>
                                </th>
                                <th className="min-w-[150px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Company</span>
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
                                <th className="min-w-[140px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Balance</span>
                                    </div>
                                </th>
                                <th className="min-w-[100px] h-9 px-4 text-left text-sm font-medium text-gray-700 sticky right-0 z-20 bg-gray-100 border-l border-gray-400" style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.15)' }}>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Data rows */}
                            {vendors.map((vendor, rowIndex) => (
                                <tr
                                    key={vendor.id || vendor._id || rowIndex}
                                    className={`border-b border-gray-400 hover:bg-blue-100 transition-colors ${rowIndex % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'}`}
                                >
                                    <td
                                        className={getCellClasses(rowIndex, 0) + " text-left text-blue-600"}
                                        onClick={() => handleCellClick(rowIndex, 0)}
                                    >
                                        {vendor.vendorName}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 1) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 1)}
                                    >
                                        {vendor.mobileNumber || "-"}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 2) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 2)}
                                    >
                                        {vendor.emailAddress || "-"}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 3) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 3)}
                                    >
                                        {vendor.companyName || "-"}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 4) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 4)}
                                    >
                                        {vendor.gstType || "-"}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 5) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 5)}
                                    >
                                        {vendor.billingAddress || "-"}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 6) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 6)}
                                    >
                                        {vendor.billingDistrict || "-"}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 7) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 7)}
                                    >
                                        {vendor.billingState || "-"}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 8) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 8)}
                                    >
                                        {vendor.openingBalanceAmount ? `₹${vendor.openingBalanceAmount} (${vendor.openingBalanceType})` : '-'}
                                    </td>
                                    <td className={`h-8 px-4 text-left sticky right-0 z-10 border-l border-gray-400 ${rowIndex % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`} style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.1)' }}>
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEditVendor(vendor)}
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
            />
        </div>
    );
}
