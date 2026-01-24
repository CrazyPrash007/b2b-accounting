// CustomerModal.jsx - Modal with global search and multi-select for customers
import React, { useState, useEffect, useRef } from "react";
import { authFetch, API_BASE_URL } from "../../../../services/apiClient";

/**
 * Helper to safely parse backend JSON that might be { success, data, meta } or raw array
 */
async function parseJsonSafe(res) {
    const body = await res.json().catch(() => null);
    if (!body) return null;
    if (typeof body === "object" && Object.prototype.hasOwnProperty.call(body, "data")) return body.data;
    return body;
}

export default function CustomerModal({ isOpen, onClose, onSave, onDelete, editData }) {
    const API_BASE = API_BASE_URL;

    // Global search state
    const [globalSearchQuery, setGlobalSearchQuery] = useState("");
    const [globalSearchResults, setGlobalSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const globalSearchRef = useRef(null);
    const searchDropdownRef = useRef(null);

    // Multi-select state - list of customers to be added
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null); // Index of customer being edited in the batch

    // Basic Details
    const [customerName, setCustomerName] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");
    const [emailAddress, setEmailAddress] = useState("");
    const [websiteLink, setWebsiteLink] = useState("");

    // Company Details
    const [companyName, setCompanyName] = useState("");
    const [gstType, setGstType] = useState("Unregistered");
    const [gstNumber, setGstNumber] = useState("");

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

    // Global search for customers across all users
    useEffect(() => {
        if (!globalSearchQuery || globalSearchQuery.trim().length < 2) {
            setGlobalSearchResults([]);
            setShowSearchDropdown(false);
            return;
        }

        const debounceTimer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await authFetch(`${API_BASE}/api/customers/global-search?q=${encodeURIComponent(globalSearchQuery.trim())}&limit=15`);
                if (res && res.ok) {
                    const data = await parseJsonSafe(res);
                    setGlobalSearchResults(Array.isArray(data) ? data : []);
                    setShowSearchDropdown(true);
                }
            } catch (err) {
                console.error("Global search failed:", err);
                setGlobalSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [globalSearchQuery, API_BASE]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                searchDropdownRef.current &&
                !searchDropdownRef.current.contains(event.target) &&
                globalSearchRef.current &&
                !globalSearchRef.current.contains(event.target)
            ) {
                setShowSearchDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fill form with customer data
    const fillFormWithCustomer = (customer) => {
        setCustomerName(customer.customerName || "");
        setMobileNumber(customer.mobileNumber || "");
        setEmailAddress(customer.emailAddress || "");
        setWebsiteLink(customer.websiteLink || "");
        setCompanyName(customer.companyName || "");
        setGstType(customer.gstType || "Unregistered");
        setGstNumber(customer.gstNumber || "");
        setBillingAddress(customer.billingAddress || "");
        setBillingPinCode(customer.billingPinCode || "");
        setBillingVillage(customer.billingVillage || "");
        setBillingTehsil(customer.billingTehsil || "");
        setBillingDistrict(customer.billingDistrict || "");
        setBillingState(customer.billingState || "");
        setBillingCountry(customer.billingCountry || "India");
        setSameAsBilling(customer.sameAsBilling ?? true);
        setShippingAddress(customer.shippingAddress || "");
        setShippingPinCode(customer.shippingPinCode || "");
        setShippingVillage(customer.shippingVillage || "");
        setShippingTehsil(customer.shippingTehsil || "");
        setShippingDistrict(customer.shippingDistrict || "");
        setShippingState(customer.shippingState || "");
        setShippingCountry(customer.shippingCountry || "India");
        setOpeningBalanceType(customer.openingBalanceType || "Credit");
        setOpeningBalanceAmount(customer.openingBalanceAmount || "");
    };

    // Get current form data as object
    const getFormData = () => ({
        customerName: customerName.trim(),
        mobileNumber: mobileNumber.trim(),
        emailAddress: emailAddress.trim(),
        websiteLink: websiteLink.trim(),
        companyName: companyName.trim(),
        gstType,
        gstNumber: gstType === "Unregistered" ? "" : gstNumber.trim(),
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
    });

    // Reset form to empty
    const resetForm = () => {
        setCustomerName("");
        setMobileNumber("");
        setEmailAddress("");
        setWebsiteLink("");
        setCompanyName("");
        setGstType("Unregistered");
        setGstNumber("");
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
        setErrorName("");
        setEditingIndex(null);
    };

    // Handle selecting a customer from global search
    const handleSelectGlobalCustomer = (selectedCustomer) => {
        fillFormWithCustomer(selectedCustomer);
        setGlobalSearchQuery("");
        setGlobalSearchResults([]);
        setShowSearchDropdown(false);
    };

    // Add current form data to selected customers list
    const handleAddToList = () => {
        setErrorName("");
        const trimmedName = customerName.trim();

        if (!trimmedName) {
            setErrorName("Customer Name is required");
            return;
        }

        if (gstType !== "Unregistered" && !gstNumber.trim()) {
            alert("GST number is required for Regular or Composition GST type");
            return;
        }

        const formData = getFormData();

        // Check if already in list (by name + company)
        const existsInList = selectedCustomers.some(
            (c, idx) => idx !== editingIndex && 
                c.customerName.toLowerCase() === formData.customerName.toLowerCase() &&
                (c.companyName || "").toLowerCase() === (formData.companyName || "").toLowerCase()
        );

        if (existsInList) {
            alert("This customer is already in the list");
            return;
        }

        if (editingIndex !== null) {
            // Update existing in list
            const updated = [...selectedCustomers];
            updated[editingIndex] = formData;
            setSelectedCustomers(updated);
            setEditingIndex(null);
        } else {
            // Add new to list
            setSelectedCustomers([...selectedCustomers, formData]);
        }

        resetForm();
    };

    // Edit a customer from the selected list
    const handleEditFromList = (index) => {
        const customer = selectedCustomers[index];
        fillFormWithCustomer(customer);
        setEditingIndex(index);
    };

    // Remove a customer from the selected list
    const handleRemoveFromList = (index) => {
        const updated = selectedCustomers.filter((_, i) => i !== index);
        setSelectedCustomers(updated);
        if (editingIndex === index) {
            resetForm();
        } else if (editingIndex !== null && index < editingIndex) {
            setEditingIndex(editingIndex - 1);
        }
    };

    // Track when modal opens/closes or editData changes to reset form
    useEffect(() => {
        if (isOpen) {
            setGlobalSearchQuery("");
            setGlobalSearchResults([]);
            setShowSearchDropdown(false);
            setSelectedCustomers([]);
            setEditingIndex(null);

            if (editData) {
                fillFormWithCustomer(editData);
            } else {
                resetForm();
            }
        }
    }, [isOpen, editData]);

    const baseInput =
        "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";

    const handleSave = () => {
        if (isEditMode) {
            // Single edit mode
            setErrorName("");
            const trimmedName = customerName.trim();

            if (!trimmedName) {
                setErrorName("Customer Name is required");
                return;
            }

            if (gstType !== "Unregistered" && !gstNumber.trim()) {
                alert("GST number is required for Regular or Composition GST type");
                return;
            }

            const payload = {
                id: editData?.id ?? editData?._id,
                ...getFormData(),
                name: customerName.trim(),
            };

            onSave(payload, true);
        } else {
            // Batch mode - check if there are customers in the list or form has data
            const formData = getFormData();
            let customersToSave = [...selectedCustomers];

            // If form has data, add it to the list first
            if (formData.customerName.trim()) {
                if (gstType !== "Unregistered" && !gstNumber.trim()) {
                    alert("GST number is required for Regular or Composition GST type");
                    return;
                }

                const existsInList = selectedCustomers.some(
                    c => c.customerName.toLowerCase() === formData.customerName.toLowerCase() &&
                        (c.companyName || "").toLowerCase() === (formData.companyName || "").toLowerCase()
                );

                if (!existsInList) {
                    customersToSave.push(formData);
                }
            }

            if (customersToSave.length === 0) {
                setErrorName("Please add at least one customer");
                return;
            }

            // Pass the array of customers to save
            onSave(customersToSave, false);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl mx-4 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 rounded-t-xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <h3 className="text-lg font-semibold text-white">
                        {isEditMode ? "Edit Customer" : "Add Customers"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Global Search Bar - Only show when not in edit mode */}
                {!isEditMode && (
                    <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                        <div className="relative">
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                🔍 Search existing customers to auto-fill form (you can add multiple)
                            </label>
                            <div className="relative">
                                <input
                                    ref={globalSearchRef}
                                    type="text"
                                    value={globalSearchQuery}
                                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                                    placeholder="Type customer name, mobile, or company to search..."
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                {isSearching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                                    </div>
                                )}
                            </div>

                            {/* Search Results Dropdown */}
                            {showSearchDropdown && globalSearchResults.length > 0 && (
                                <div
                                    ref={searchDropdownRef}
                                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                                >
                                    {globalSearchResults.map((customer, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelectGlobalCustomer(customer)}
                                            className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-gray-900">{customer.customerName}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        {[customer.companyName, customer.mobileNumber, customer.billingState]
                                                            .filter(Boolean)
                                                            .join(' • ')}
                                                    </div>
                                                </div>
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                    {customer.popularity || 1} {customer.popularity === 1 ? 'user' : 'users'}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* No results message */}
                            {showSearchDropdown && globalSearchResults.length === 0 && globalSearchQuery.trim().length >= 2 && !isSearching && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
                                    No customers found matching "{globalSearchQuery}"
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Selected Customers List - Only show when not in edit mode and has selections */}
                {!isEditMode && selectedCustomers.length > 0 && (
                    <div className="px-6 py-3 bg-green-50 border-b border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="text-sm font-medium text-green-800">
                                {selectedCustomers.length} customer{selectedCustomers.length > 1 ? 's' : ''} ready to save
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {selectedCustomers.map((customer, idx) => (
                                <div
                                    key={idx}
                                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${
                                        editingIndex === idx 
                                            ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-400' 
                                            : 'bg-white text-gray-700 border border-green-300'
                                    }`}
                                >
                                    <button
                                        onClick={() => handleEditFromList(idx)}
                                        className="hover:text-blue-600 font-medium"
                                        title="Click to edit"
                                    >
                                        {customer.customerName}
                                        {customer.companyName && (
                                            <span className="text-xs text-gray-500 ml-1">({customer.companyName})</span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleRemoveFromList(idx)}
                                        className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Remove from list"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            {/* Modal Body - Scrollable */}
            <div className="px-5 py-4 overflow-y-auto flex-1" data-form-container onKeyDown={handleKeyDown}>
                {/* Basic Details Section */}
                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2 pb-1 border-b border-gray-200">Basic Details</h4>
                    <div className="grid grid-cols-4 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Customer Name<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => {
                                    setCustomerName(e.target.value);
                                    if (errorName) setErrorName("");
                                }}
                                className={baseInput + (errorName ? " border-red-500" : "")}
                                placeholder="Enter Customer Name"
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
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setGstType(value);
                                    if (value === "Unregistered") setGstNumber("");
                                }}
                                className={baseInput}
                            >
                                <option value="Regular">Regular</option>
                                <option value="Composition">Composition</option>
                                <option value="Unregistered">Unregistered</option>
                            </select>
                        </div>
                        {gstType !== "Unregistered" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                                <input
                                    type="text"
                                    value={gstNumber}
                                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                                    className={baseInput}
                                    placeholder="Enter GSTIN"
                                    maxLength={15}
                                />
                            </div>
                        )}
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
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                {isEditMode ? (
                    <button
                        type="button"
                        onClick={() => onDelete && onDelete(editData.id || editData._id)}
                        className="px-4 py-2.5 text-sm font-medium text-red-600 hover:text-white border border-red-300 rounded-lg hover:bg-red-500 transition-colors"
                    >
                        Delete Customer
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleAddToList}
                        className="px-4 py-2.5 text-sm font-medium text-green-700 hover:text-white border border-green-400 rounded-lg hover:bg-green-500 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        {editingIndex !== null ? "Update in List" : "Add to List"}
                    </button>
                )}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                        {isEditMode ? (
                            "Update Customer"
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Save {selectedCustomers.length > 0 ? `(${selectedCustomers.length + (customerName.trim() ? 1 : 0)})` : ''}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
        </div>
    );
}
