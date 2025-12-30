// src/features/enquiry/EnquiryPage.jsx
import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import useEnquiry from "./hooks/useEnquiry";
import EnquiryTable from "./EnquiryTable";
import itemApi from "src/features/items/items/api/item.api";
import apiClient from "src/services/apiClient";
import { CompanyContext } from "src/App";
import { useAuth } from "src/contexts/AuthContext";
import ItemModal from "src/features/items/items/components/ItemModal";

// Indian States list
const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry", "Chandigarh",
    "Andaman & Nicobar Islands", "Dadra & Nagar Haveli and Daman & Diu", "Lakshadweep"
];

/**
 * CreateEnquiryModal - Modal for creating new enquiries (no edit mode)
 */
function CreateEnquiryModal({ isOpen, onClose, onSave, registeredVendors: vendorsList = [] }) {
    const context = useContext(CompanyContext);
    const selectedCompany = context?.selectedCompany || "";
    const { user } = useAuth();
    const dropdownRef = useRef(null);

    // Distribution type: 'public' or 'vendors'
    const [distributionType, setDistributionType] = useState("public");
    
    // Target states for public enquiries (empty means all states)
    const [selectedStates, setSelectedStates] = useState([]);
    const [stateSearch, setStateSearch] = useState("");
    
    // Vendor selection (for 'vendors' distribution)
    const [selectedVendors, setSelectedVendors] = useState([]);
    const [vendorSearch, setVendorSearch] = useState("");

    const [enquiryType, setEnquiryType] = useState("buy");
    const [productName, setProductName] = useState("");
    const [category, setCategory] = useState("");
    const [subCategory, setSubCategory] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("");
    const [expectedPrice, setExpectedPrice] = useState("");
    const [description, setDescription] = useState("");
    const [specifications, setSpecifications] = useState("");
    const [deliveryLocation, setDeliveryLocation] = useState("");
    const [requiredByDate, setRequiredByDate] = useState("");
    const [validUntil, setValidUntil] = useState("");
    const [error, setError] = useState("");

    // Auto-fetched company details (read-only)
    const [companyDetails, setCompanyDetails] = useState({
        creatorName: "",
        creatorCompany: "",
        creatorState: "",
        creatorMobile: "",
        creatorEmail: ""
    });

    // Items dropdown
    const [items, setItems] = useState([]);
    const [showItemDropdown, setShowItemDropdown] = useState(false);
    
    // Add Item form modal state
    const [showAddItemModal, setShowAddItemModal] = useState(false);

    // Filter vendors based on search (using vendorsList from props)
    const filteredVendors = useMemo(() => {
        if (!vendorSearch.trim()) return vendorsList;
        return vendorsList.filter(v => 
            (v.name || v.companyName || "").toLowerCase().includes(vendorSearch.toLowerCase())
        );
    }, [vendorsList, vendorSearch]);

    // Load items and company details from backend
    useEffect(() => {
        const loadData = async () => {
            if (selectedCompany && isOpen) {
                try {
                    // Load items
                    const itemsData = await itemApi.list(selectedCompany);
                    setItems(Array.isArray(itemsData) ? itemsData : []);

                    // Load company details and auto-fill contact info
                    const companyRes = await apiClient.get(`/api/companies/${selectedCompany}`);
                    if (companyRes?.data?.success && companyRes?.data?.data) {
                        const company = companyRes.data.data;
                        // Auto-fill company contact details from selected company and logged-in user
                        setCompanyDetails({
                            creatorName: user?.name || "",
                            creatorCompany: company.companyName || "",
                            creatorState: company.state || "",
                            creatorMobile: company.mobile || company.phone || "",
                            creatorEmail: company.email || ""
                        });
                        setDeliveryLocation(company.state || "");
                    }
                } catch (err) {
                    console.error("Failed to load data", err);
                    setItems([]);
                }
            }
        };
        loadData();
    }, [selectedCompany, isOpen, user]);

    // Filter items based on product name input (useMemo to avoid cascading renders)
    const filteredItems = useMemo(() => {
        if (productName.trim()) {
            return items.filter(item =>
                (item.name || item.itemName || "").toLowerCase().includes(productName.toLowerCase())
            );
        }
        return items;
    }, [productName, items]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowItemDropdown(false);
            }
        };

        if (showItemDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showItemDropdown]);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setDistributionType("public");
            setSelectedStates([]);
            setStateSearch("");
            setSelectedVendors([]);
            setVendorSearch("");
            setEnquiryType("buy");
            setProductName("");
            setCategory("");
            setSubCategory("");
            setQuantity("");
            setUnit("");
            setExpectedPrice("");
            setDescription("");
            setSpecifications("");
            setRequiredByDate("");
            setValidUntil("");
            setError("");
            setShowItemDropdown(false);
            setShowAddItemModal(false);
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!productName.trim()) {
            setError("Product name is required. Please enter what you want to buy/sell.");
            return;
        }

        if (distributionType === 'vendors' && selectedVendors.length === 0) {
            setError("Please select at least one vendor to send this enquiry to.");
            return;
        }

        const payload = {
            distributionType,
            targetStates: distributionType === 'public' ? selectedStates : [],
            targetVendorIds: distributionType === 'vendors' ? selectedVendors.map(v => v.id || v._id) : [],
            enquiryType,
            productName: productName.trim(),
            category: category.trim(),
            subCategory: subCategory.trim(),
            quantity: quantity ? Number(quantity) : 0,
            unit: unit.trim(),
            expectedPrice: expectedPrice ? Number(expectedPrice) : 0,
            description: description.trim(),
            specifications: specifications.trim(),
            deliveryLocation: deliveryLocation.trim(),
            requiredByDate: requiredByDate || null,
            creatorName: companyDetails.creatorName.trim(),
            creatorCompany: companyDetails.creatorCompany.trim(),
            creatorState: companyDetails.creatorState.trim(),
            creatorMobile: companyDetails.creatorMobile.trim(),
            creatorEmail: companyDetails.creatorEmail.trim(),
            validUntil: validUntil || null,
        };

        onSave(payload);
    };

    // State selection handlers for public enquiries
    const handleStateToggle = (state) => {
        setSelectedStates(prev => {
            if (prev.includes(state)) {
                return prev.filter(s => s !== state);
            }
            return [...prev, state];
        });
    };

    const handleSelectAllStates = () => {
        if (selectedStates.length === INDIAN_STATES.length) {
            setSelectedStates([]);
        } else {
            setSelectedStates([...INDIAN_STATES]);
        }
    };

    // Filter states based on search
    const filteredStates = useMemo(() => {
        if (!stateSearch.trim()) return INDIAN_STATES;
        return INDIAN_STATES.filter(state => 
            state.toLowerCase().includes(stateSearch.toLowerCase())
        );
    }, [stateSearch]);

    // Vendor selection handlers
    const handleVendorToggle = (vendor) => {
        setSelectedVendors(prev => {
            const exists = prev.find(v => (v.id || v._id) === (vendor.id || vendor._id));
            if (exists) {
                return prev.filter(v => (v.id || v._id) !== (vendor.id || vendor._id));
            }
            return [...prev, vendor];
        });
    };

    const handleSelectAllVendors = () => {
        if (selectedVendors.length === vendorsList.length) {
            setSelectedVendors([]);
        } else {
            setSelectedVendors([...vendorsList]);
        }
    };

    // Handle item created from AddItem modal
    const handleItemCreated = (newItem) => {
        // Add to items list
        setItems(prev => [...prev, newItem]);
        // Auto-fill form fields from the new item
        setProductName(newItem.name || newItem.itemName || "");
        setCategory(newItem.category || "");
        setSubCategory(newItem.subCategory || "");
        setUnit(newItem.unit || "");
        setDescription(newItem.description || "");
        if (enquiryType === "buy") {
            setExpectedPrice(newItem.buyPrice || "");
        } else {
            setExpectedPrice(newItem.sellPrice || newItem.buyPrice || "");
        }
        setShowAddItemModal(false);
    };

    // Handle item selection from dropdown
    const handleItemSelect = (item) => {
        setProductName(item.name || item.itemName || "");
        setCategory(item.category || "");
        setSubCategory(item.subCategory || "");
        setUnit(item.unit || "");
        setDescription(item.description || "");
        // Set expected price based on enquiry type
        if (enquiryType === "buy") {
            setExpectedPrice(item.buyPrice || "");
        } else {
            setExpectedPrice(item.sellPrice || "");
        }
        setShowItemDropdown(false);
    };

    const baseInput = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-5 py-3 rounded-t-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <h3 className="text-base font-semibold text-white">
                        Create New Enquiry
                    </h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-5 py-4 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Distribution Type Selection */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Send Enquiry To *</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setDistributionType("public")}
                                className={`p-4 border-2 rounded-lg text-left transition-all ${
                                    distributionType === "public"
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:border-gray-300"
                                }`}
                            >
                                <div className="flex items-center mb-2">
                                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-medium text-gray-900">Public Enquiry</span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Visible to all registered users in the Public Enquiries tab
                                </p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setDistributionType("vendors")}
                                className={`p-4 border-2 rounded-lg text-left transition-all ${
                                    distributionType === "vendors"
                                        ? "border-green-500 bg-green-50"
                                        : "border-gray-200 hover:border-gray-300"
                                }`}
                            >
                                <div className="flex items-center mb-2">
                                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span className="font-medium text-gray-900">Send to My Vendors</span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Send directly to selected vendors from your vendor list (registered on platform)
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* State Selection (only for 'public' distribution) */}
                    {distributionType === 'public' && (
                        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-sm font-semibold text-gray-800">
                                    Target States ({selectedStates.length === 0 ? "All States" : `${selectedStates.length} selected`})
                                </h4>
                                <button
                                    type="button"
                                    onClick={handleSelectAllStates}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    {selectedStates.length === INDIAN_STATES.length ? "Deselect All" : "Select All States"}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">
                                Leave empty to show enquiry to vendors in all states, or select specific states.
                            </p>
                            <input
                                type="text"
                                placeholder="Search states..."
                                value={stateSearch}
                                onChange={(e) => setStateSearch(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3"
                            />
                            <div className="max-h-48 overflow-y-auto space-y-2">
                                {filteredStates.map(state => (
                                    <label
                                        key={state}
                                        className={`flex items-center p-2 rounded border cursor-pointer transition-all ${
                                            selectedStates.includes(state)
                                                ? "border-blue-500 bg-blue-100"
                                                : "border-gray-200 hover:bg-gray-100"
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedStates.includes(state)}
                                            onChange={() => handleStateToggle(state)}
                                            className="mr-3"
                                        />
                                        <span className="text-sm text-gray-900">{state}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Vendor Selection (only for 'vendors' distribution) */}
                    {distributionType === 'vendors' && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-sm font-semibold text-gray-800">
                                    Select Vendors ({selectedVendors.length} selected)
                                </h4>
                                <button
                                    type="button"
                                    onClick={handleSelectAllVendors}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    {selectedVendors.length === vendorsList.length ? "Deselect All" : "Select All"}
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="Search vendors..."
                                value={vendorSearch}
                                onChange={(e) => setVendorSearch(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3"
                            />
                            {vendorsList.length === 0 ? (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                    No registered vendors found. Only vendors who are registered on the platform will appear here.
                                </div>
                            ) : filteredVendors.length === 0 ? (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                    No vendors match your search.
                                </div>
                            ) : (
                                <div className="max-h-48 overflow-y-auto space-y-2">
                                    {filteredVendors.map(vendor => (
                                        <label
                                            key={vendor.id || vendor._id}
                                            className={`flex items-center p-3 rounded border cursor-pointer transition-all ${
                                                selectedVendors.find(v => (v.id || v._id) === (vendor.id || vendor._id))
                                                    ? "border-green-500 bg-green-50"
                                                    : "border-gray-200 hover:bg-gray-100"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={!!selectedVendors.find(v => (v.id || v._id) === (vendor.id || vendor._id))}
                                                onChange={() => handleVendorToggle(vendor)}
                                                className="mr-3"
                                            />
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {vendor.vendorName || vendor.companyName}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {vendor.companyName && vendor.vendorName !== vendor.companyName && `${vendor.companyName} • `}
                                                    {vendor.billingState || ''} {vendor.mobileNumber && `• ${vendor.mobileNumber}`}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Enquiry Type */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Enquiry Type *</label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="enquiryType"
                                    value="buy"
                                    checked={enquiryType === "buy"}
                                    onChange={(e) => setEnquiryType(e.target.value)}
                                    className="mr-2"
                                />
                                <span className="text-sm">Buy (I want to purchase)</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="enquiryType"
                                    value="sell"
                                    checked={enquiryType === "sell"}
                                    onChange={(e) => setEnquiryType(e.target.value)}
                                    className="mr-2"
                                />
                                <span className="text-sm">Sell (I have to offer)</span>
                            </label>
                        </div>
                    </div>

                    {/* Product Details */}
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2 pb-1 border-b border-gray-200">Product Details</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="relative" ref={dropdownRef}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Product Name *
                                    <span className="text-xs text-gray-500 ml-2">(Type or select from items)</span>
                                </label>
                                <input
                                    type="text"
                                    value={productName}
                                    onChange={(e) => {
                                        setProductName(e.target.value);
                                        setShowItemDropdown(true);
                                    }}
                                    onFocus={() => setShowItemDropdown(true)}
                                    className={baseInput}
                                    placeholder="Type to search items..."
                                    autoComplete="off"
                                />
                                {/* Dropdown for items */}
                                {showItemDropdown && (filteredItems.length > 0 || productName.trim()) && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                                        {filteredItems.slice(0, 10).map((item) => (
                                            <button
                                                key={item.id || item._id}
                                                type="button"
                                                onClick={() => handleItemSelect(item)}
                                                className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100"
                                            >
                                                <div className="text-sm font-medium text-gray-900">
                                                    {item.name || item.itemName}
                                                </div>
                                                {item.category && (
                                                    <div className="text-xs text-gray-500">
                                                        {item.category} {item.subCategory && `/ ${item.subCategory}`}
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                        {/* Add Item button at the end */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddItemModal(true);
                                                setShowItemDropdown(false);
                                            }}
                                            className="w-full text-left px-3 py-2 hover:bg-blue-50 bg-blue-50/50 border-t-2 border-blue-200 text-blue-600 font-medium flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            <span>Add New Item</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className={baseInput} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Category</label>
                                <input type="text" value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className={baseInput} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={baseInput} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} className={baseInput} placeholder="e.g., kg, pcs, tons" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Price (₹)</label>
                                <input type="number" value={expectedPrice} onChange={(e) => setExpectedPrice(e.target.value)} className={baseInput} />
                            </div>
                            <div className="col-span-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={baseInput} rows={2} placeholder="Describe what you're looking for..." />
                            </div>
                            <div className="col-span-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Specifications / Requirements</label>
                                <textarea value={specifications} onChange={(e) => setSpecifications(e.target.value)} className={baseInput} rows={2} placeholder="Any specific requirements, quality standards, certifications needed..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Location</label>
                                <input type="text" value={deliveryLocation} onChange={(e) => setDeliveryLocation(e.target.value)} className={baseInput} placeholder="City, State" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Required By</label>
                                <input type="date" value={requiredByDate} onChange={(e) => setRequiredByDate(e.target.value)} className={baseInput} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                                <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={baseInput} />
                            </div>
                        </div>
                    </div>

                    {/* Creator Details (Auto-filled from selected company) */}
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2 pb-1 border-b border-gray-200">
                            Your Contact Details
                            <span className="font-normal text-gray-500 text-xs ml-2">(Auto-filled from selected company)</span>
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-500">Name:</span>
                                    <span className="ml-2 font-medium text-gray-800">{companyDetails.creatorName || "-"}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Company:</span>
                                    <span className="ml-2 font-medium text-gray-800">{companyDetails.creatorCompany || "-"}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">State:</span>
                                    <span className="ml-2 font-medium text-gray-800">{companyDetails.creatorState || "-"}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Mobile:</span>
                                    <span className="ml-2 font-medium text-gray-800">{companyDetails.creatorMobile || "-"}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Email:</span>
                                    <span className="ml-2 font-medium text-gray-800">{companyDetails.creatorEmail || "-"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 px-5 py-3 border-t bg-gray-50 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700">
                        Create Enquiry
                    </button>
                </div>
            </div>

            {/* Add Item Modal - Higher z-index to appear above enquiry modal */}
            {showAddItemModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50" onClick={() => setShowAddItemModal(false)}>
                    <ItemModal
                        isOpen={showAddItemModal}
                        onClose={() => setShowAddItemModal(false)}
                        onSave={handleItemCreated}
                        editData={null}
                    />
                </div>
            )}
        </div>
    );
}

/**
 * RespondModal - Modal for responding to an enquiry with enhanced quotation details
 */
function RespondModal({ isOpen, onClose, onSave, enquiry }) {
    const context = useContext(CompanyContext);
    const selectedCompany = context?.selectedCompany || "";
    const { user } = useAuth();

    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("");
    const [deliveryTime, setDeliveryTime] = useState("");
    const [paymentTerms, setPaymentTerms] = useState("");
    const [validityDays, setValidityDays] = useState("");
    const [additionalNotes, setAdditionalNotes] = useState("");
    const [error, setError] = useState("");

    // Auto-fetched company details (read-only)
    const [companyDetails, setCompanyDetails] = useState({
        responderName: "",
        responderCompany: "",
        responderState: "",
        responderMobile: "",
        responderEmail: ""
    });

    // Load company details from backend
    useEffect(() => {
        const loadCompanyDetails = async () => {
            if (selectedCompany && isOpen) {
                try {
                    const companyRes = await apiClient.get(`/api/companies/${selectedCompany}`);
                    if (companyRes?.data?.success && companyRes?.data?.data) {
                        const company = companyRes.data.data;
                        setCompanyDetails({
                            responderName: user?.name || "",
                            responderCompany: company.companyName || "",
                            responderState: company.state || "",
                            responderMobile: company.mobile || company.phone || "",
                            responderEmail: company.email || ""
                        });
                    }
                } catch (err) {
                    console.error("Failed to load company details", err);
                }
            }
        };
        loadCompanyDetails();
    }, [selectedCompany, isOpen, user]);

    useEffect(() => {
        if (isOpen && enquiry) {
            setPrice("");
            setQuantity(enquiry?.quantity || "");
            setUnit(enquiry?.unit || "");
            setDeliveryTime("");
            setPaymentTerms("");
            setValidityDays("");
            setAdditionalNotes("");
            setError("");
        }
    }, [isOpen, enquiry]);

    const handleSave = () => {
        setError("");
        
        // Validate price
        if (!price || price === "") {
            setError("Price is required. Please enter your quoted price per unit.");
            return;
        }
        const priceNum = Number(price);
        if (isNaN(priceNum) || priceNum < 0) {
            setError("Please enter a valid price (must be 0 or greater).");
            return;
        }
        
        // Validate quantity
        if (!quantity || quantity === "") {
            setError("Quantity is required. Please enter how much you can provide.");
            return;
        }
        const qtyNum = Number(quantity);
        if (isNaN(qtyNum) || qtyNum <= 0) {
            setError("Please enter a valid quantity (must be greater than 0).");
            return;
        }
        
        // Validate unit
        if (!unit || !unit.trim()) {
            setError("Unit is required. Please select a unit of measurement.");
            return;
        }

        const payload = {
            accountCompanyName: selectedCompany,
            price: Number(price),
            quantity: Number(quantity),
            unit: unit.trim(),
            deliveryTime: deliveryTime.trim(),
            paymentTerms: paymentTerms.trim(),
            validityDays: validityDays ? Number(validityDays) : 0,
            additionalNotes: additionalNotes.trim(),
            responderName: companyDetails.responderName.trim(),
            responderCompany: companyDetails.responderCompany.trim(),
            responderState: companyDetails.responderState.trim(),
            responderMobile: companyDetails.responderMobile.trim(),
            responderEmail: companyDetails.responderEmail.trim(),
        };

        onSave(enquiry.id, payload);
    };

    const baseInput = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-5 py-3 rounded-t-lg bg-green-600">
                    <h3 className="text-base font-semibold text-white">
                        Submit Your Quotation
                    </h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-5 py-4 overflow-y-auto flex-1">
                    {/* Enquiry Summary */}
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                        <div className="text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${enquiry?.enquiryType === 'buy' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                {enquiry?.enquiryType?.toUpperCase()}
                            </span>
                            <span className="ml-2 font-medium">{enquiry?.productName}</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                            Requested: {enquiry?.quantity} {enquiry?.unit} | Expected Price: ₹{enquiry?.expectedPrice?.toLocaleString() || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">
                            By: {enquiry?.creatorCompany || enquiry?.creatorName || 'Unknown'} ({enquiry?.creatorState || 'Unknown State'})
                        </div>
                        {enquiry?.description && (
                            <div className="text-sm text-gray-600 mt-2 pt-2 border-t">
                                <span className="font-medium">Description:</span> {enquiry.description}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Quotation Details */}
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Your Quotation</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Your Price (₹) <span className="text-red-500">*</span></label>
                            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={baseInput} placeholder="Per unit price" min="0" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity You Can Provide <span className="text-red-500">*</span></label>
                            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={baseInput} min="1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit <span className="text-red-500">*</span></label>
                            <select value={unit} onChange={(e) => setUnit(e.target.value)} className={baseInput}>
                                <option value="">Select Unit</option>
                                <option value="pieces">Pieces</option>
                                <option value="kg">Kg</option>
                                <option value="grams">Grams</option>
                                <option value="liters">Liters</option>
                                <option value="meters">Meters</option>
                                <option value="boxes">Boxes</option>
                                <option value="cartons">Cartons</option>
                                <option value="dozen">Dozen</option>
                                <option value="sets">Sets</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Time</label>
                            <input type="text" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className={baseInput} placeholder="e.g., 3-5 days" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                            <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className={baseInput}>
                                <option value="">Select Terms</option>
                                <option value="advance">100% Advance</option>
                                <option value="50-50">50% Advance, 50% on Delivery</option>
                                <option value="cod">Cash on Delivery</option>
                                <option value="credit-7">7 Days Credit</option>
                                <option value="credit-15">15 Days Credit</option>
                                <option value="credit-30">30 Days Credit</option>
                                <option value="credit-45">45 Days Credit</option>
                                <option value="credit-60">60 Days Credit</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quote Valid For (Days)</label>
                            <input type="number" value={validityDays} onChange={(e) => setValidityDays(e.target.value)} className={baseInput} placeholder="e.g., 7" />
                        </div>
                        <div className="col-span-2 md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                            <textarea value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} className={baseInput} rows={2} placeholder="Any additional details, terms, or conditions..." />
                        </div>
                    </div>

                    {/* Your Details (Auto-filled from selected company) */}
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2 pb-1 border-b border-gray-200">
                            Your Contact Details
                            <span className="font-normal text-gray-500 text-xs ml-2">(Auto-filled from selected company)</span>
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-500">Name:</span>
                                    <span className="ml-2 font-medium text-gray-800">{companyDetails.responderName || "-"}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Company:</span>
                                    <span className="ml-2 font-medium text-gray-800">{companyDetails.responderCompany || "-"}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">State:</span>
                                    <span className="ml-2 font-medium text-gray-800">{companyDetails.responderState || "-"}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Mobile:</span>
                                    <span className="ml-2 font-medium text-gray-800">{companyDetails.responderMobile || "-"}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Email:</span>
                                    <span className="ml-2 font-medium text-gray-800">{companyDetails.responderEmail || "-"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 px-5 py-3 border-t bg-gray-50 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700">
                        Submit Response
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * ViewResponsesModal - Modal for viewing responses to own enquiry with filtering/sorting
 */
function ViewResponsesModal({ isOpen, onClose, enquiry, onMarkViewed, onSelectResponse }) {
    const [sortOrder, setSortOrder] = useState('lowest'); // 'lowest', 'highest', 'newest', 'oldest'
    const [filterViewed, setFilterViewed] = useState('all'); // 'all', 'viewed', 'unviewed'
    const [selectingResponse, setSelectingResponse] = useState(null);
    const [selectionNote, setSelectionNote] = useState("");
    const [isSelecting, setIsSelecting] = useState(false);

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    const responses = enquiry?.responses || [];

    // Filter responses
    let filteredResponses = [...responses];
    if (filterViewed === 'viewed') {
        filteredResponses = filteredResponses.filter(r => r.viewedAt);
    } else if (filterViewed === 'unviewed') {
        filteredResponses = filteredResponses.filter(r => !r.viewedAt);
    }

    // Sort responses
    filteredResponses.sort((a, b) => {
        switch (sortOrder) {
            case 'lowest':
                return (a.price || 0) - (b.price || 0);
            case 'highest':
                return (b.price || 0) - (a.price || 0);
            case 'newest':
                return new Date(b.respondedAt || 0) - new Date(a.respondedAt || 0);
            case 'oldest':
                return new Date(a.respondedAt || 0) - new Date(b.respondedAt || 0);
            default:
                return 0;
        }
    });

    const handleMarkViewed = async (responseId) => {
        if (onMarkViewed) {
            await onMarkViewed(enquiry._id, responseId);
        }
    };

    const handleSelectResponse = async (responseId) => {
        if (!onSelectResponse) return;
        setIsSelecting(true);
        try {
            await onSelectResponse(enquiry._id, responseId, selectionNote);
            setSelectingResponse(null);
            setSelectionNote("");
        } catch (err) {
            console.error("Failed to select response:", err);
        } finally {
            setIsSelecting(false);
        }
    };

    // Check if a response has been selected
    const hasSelectedResponse = enquiry?.selectedResponseId || responses.some(r => r.selectionStatus === 'accepted');

    // Statistics
    const stats = {
        total: responses.length,
        viewed: responses.filter(r => r.viewedAt).length,
        lowest: responses.length > 0 ? Math.min(...responses.map(r => r.price || Infinity)) : 0,
        highest: responses.length > 0 ? Math.max(...responses.map(r => r.price || 0)) : 0,
        avg: responses.length > 0 ? Math.round(responses.reduce((sum, r) => sum + (r.price || 0), 0) / responses.length) : 0
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-5 py-3 rounded-t-lg bg-purple-600">
                    <h3 className="text-base font-semibold text-white">
                        Responses to: {enquiry?.productName}
                    </h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-5 py-4 overflow-y-auto flex-1">
                    {/* Enquiry Summary */}
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${enquiry?.enquiryType === 'buy' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                    {enquiry?.enquiryType?.toUpperCase()}
                                </span>
                                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${enquiry?.distributionType === 'public' ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'}`}>
                                    {enquiry?.distributionType === 'public' ? 'PUBLIC' : 'VENDOR SPECIFIC'}
                                </span>
                                <span className="ml-2 font-medium">{enquiry?.productName}</span>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${enquiry?.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {enquiry?.status?.toUpperCase()}
                            </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                            Requested: {enquiry?.quantity} {enquiry?.unit} | Expected Price: ₹{enquiry?.expectedPrice?.toLocaleString() || 'N/A'}
                        </div>
                    </div>

                    {/* Statistics Bar */}
                    {responses.length > 0 && (
                        <div className="mb-4 grid grid-cols-5 gap-3">
                            <div className="bg-blue-50 p-3 rounded text-center">
                                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                                <div className="text-xs text-gray-600">Total Responses</div>
                            </div>
                            <div className="bg-green-50 p-3 rounded text-center">
                                <div className="text-2xl font-bold text-green-600">{stats.viewed}</div>
                                <div className="text-xs text-gray-600">Viewed</div>
                            </div>
                            <div className="bg-emerald-50 p-3 rounded text-center">
                                <div className="text-2xl font-bold text-emerald-600">₹{stats.lowest.toLocaleString()}</div>
                                <div className="text-xs text-gray-600">Lowest Price</div>
                            </div>
                            <div className="bg-red-50 p-3 rounded text-center">
                                <div className="text-2xl font-bold text-red-600">₹{stats.highest.toLocaleString()}</div>
                                <div className="text-xs text-gray-600">Highest Price</div>
                            </div>
                            <div className="bg-amber-50 p-3 rounded text-center">
                                <div className="text-2xl font-bold text-amber-600">₹{stats.avg.toLocaleString()}</div>
                                <div className="text-xs text-gray-600">Avg Price</div>
                            </div>
                        </div>
                    )}

                    {/* Filters and Sorting */}
                    {responses.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-3 items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex gap-3 items-center">
                                <label className="text-sm text-gray-600">Sort by:</label>
                                <select 
                                    value={sortOrder} 
                                    onChange={(e) => setSortOrder(e.target.value)}
                                    className="text-sm border rounded px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                >
                                    <option value="lowest">Price: Low to High</option>
                                    <option value="highest">Price: High to Low</option>
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                            </div>
                            <div className="flex gap-3 items-center">
                                <label className="text-sm text-gray-600">Filter:</label>
                                <select 
                                    value={filterViewed} 
                                    onChange={(e) => setFilterViewed(e.target.value)}
                                    className="text-sm border rounded px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                >
                                    <option value="all">All Responses</option>
                                    <option value="unviewed">Unviewed Only</option>
                                    <option value="viewed">Viewed Only</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Responses */}
                    {filteredResponses.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {responses.length === 0 ? 'No responses yet.' : 'No responses match your filter.'}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredResponses.map((response, idx) => (
                                <div 
                                    key={response._id || idx} 
                                    className={`border rounded-lg p-4 hover:shadow-sm ${
                                        response.selectionStatus === 'accepted' 
                                            ? 'border-2 border-green-500 bg-green-50' 
                                            : response.selectionStatus === 'rejected'
                                            ? 'border-gray-300 bg-gray-100 opacity-60'
                                            : !response.viewedAt 
                                            ? 'border-l-4 border-l-purple-500 bg-purple-50/30' 
                                            : ''
                                    }`}
                                >
                                    {/* Selection Status Banner */}
                                    {response.selectionStatus === 'accepted' && (
                                        <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-green-100 rounded text-green-800 text-sm font-medium">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            SELECTED - You accepted this quotation
                                        </div>
                                    )}
                                    {response.selectionStatus === 'rejected' && (
                                        <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-gray-200 rounded text-gray-600 text-sm font-medium">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            REJECTED - Another quotation was selected
                                        </div>
                                    )}

                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-medium text-gray-900 flex items-center gap-2">
                                                {response.responderCompany || response.responderName || 'Anonymous'}
                                                {!response.viewedAt && (
                                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">NEW</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {response.responderState || 'Unknown State'}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-400">
                                                {formatDate(response.respondedAt)}
                                            </div>
                                            {!response.viewedAt && (
                                                <button 
                                                    onClick={() => handleMarkViewed(response._id)}
                                                    className="text-xs text-purple-600 hover:text-purple-800 mt-1"
                                                >
                                                    Mark as Viewed
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-2">
                                        <div>
                                            <span className="text-gray-500">Offered Price:</span>
                                            <span className="ml-2 font-medium text-green-600">₹{response.price?.toLocaleString()}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Quantity:</span>
                                            <span className="ml-2 font-medium">{response.quantity} {response.unit || ''}</span>
                                        </div>
                                        {response.deliveryTime && (
                                            <div>
                                                <span className="text-gray-500">Delivery:</span>
                                                <span className="ml-2 font-medium">{response.deliveryTime}</span>
                                            </div>
                                        )}
                                        {response.paymentTerms && (
                                            <div>
                                                <span className="text-gray-500">Payment:</span>
                                                <span className="ml-2 font-medium">{response.paymentTerms}</span>
                                            </div>
                                        )}
                                        {response.validityDays && (
                                            <div>
                                                <span className="text-gray-500">Valid For:</span>
                                                <span className="ml-2 font-medium">{response.validityDays} days</span>
                                            </div>
                                        )}
                                    </div>
                                    {response.additionalNotes && (
                                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded mb-2">
                                            {response.additionalNotes}
                                        </div>
                                    )}
                                    <div className="mt-2 flex justify-between items-center">
                                        <div className="flex gap-4 text-xs text-gray-500">
                                            {response.responderMobile && (
                                                <span>📞 {response.responderMobile}</span>
                                            )}
                                            {response.responderEmail && (
                                                <span>✉️ {response.responderEmail}</span>
                                            )}
                                        </div>
                                        
                                        {/* Selection Actions */}
                                        {!hasSelectedResponse && enquiry?.status === 'open' && response.selectionStatus !== 'accepted' && (
                                            <>
                                                {selectingResponse === response._id ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={selectionNote}
                                                            onChange={(e) => setSelectionNote(e.target.value)}
                                                            placeholder="Add a note (optional)..."
                                                            className="text-xs border rounded px-2 py-1 w-48"
                                                        />
                                                        <button
                                                            onClick={() => handleSelectResponse(response._id)}
                                                            disabled={isSelecting}
                                                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                                        >
                                                            {isSelecting ? 'Processing...' : 'Confirm Accept'}
                                                        </button>
                                                        <button
                                                            onClick={() => { setSelectingResponse(null); setSelectionNote(""); }}
                                                            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setSelectingResponse(response._id)}
                                                        className="px-3 py-1 text-xs bg-green-100 text-green-700 border border-green-300 rounded hover:bg-green-200"
                                                    >
                                                        ✓ Accept This Quotation
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 px-5 py-3 border-t bg-gray-50 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * EnquiryPage - Main page with tabs for My Enquiries, Public Enquiries, Vendor Enquiries, and My Responses
 */
export default function EnquiryPage() {
    const {
        myEnquiries,
        publicEnquiries,
        vendorEnquiries,
        myResponses,
        registeredVendors,
        loading,
        error,
        reload,
        loadMyEnquiries,
        loadPublicEnquiries,
        loadVendorEnquiries,
        loadMyResponses,
        loadRegisteredVendors,
        create,
        remove,
        respond,
        close: closeEnquiry,
        markResponseViewed,
        selectResponse
    } = useEnquiry();

    const [activeTab, setActiveTab] = useState("my");
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [respondModalOpen, setRespondModalOpen] = useState(false);
    const [viewResponsesModalOpen, setViewResponsesModalOpen] = useState(false);
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);

    // Filters
    const [filterType, setFilterType] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterState, setFilterState] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [search, setSearch] = useState("");

    // Unique categories from all enquiries (computed with useMemo to avoid cascading renders)
    const categories = useMemo(() => {
        const allEnquiries = [...myEnquiries, ...publicEnquiries, ...vendorEnquiries];
        return [...new Set(
            allEnquiries
                .map(enq => enq.category)
                .filter(cat => cat && cat.trim())
        )].sort();
    }, [myEnquiries, publicEnquiries, vendorEnquiries]);

    // Load registered vendors when component mounts
    useEffect(() => {
        loadRegisteredVendors();
    }, [loadRegisteredVendors]);

    // Apply filters based on active tab
    useEffect(() => {
        const filters = { 
            enquiryType: filterType || undefined, 
            status: filterStatus || undefined, 
            search: search || undefined,
            category: filterCategory || undefined,
            state: filterState || undefined
        };
        
        switch (activeTab) {
            case "my":
                loadMyEnquiries(filters);
                break;
            case "public":
                loadPublicEnquiries(filters);
                break;
            case "vendor":
                loadVendorEnquiries(filters);
                break;
            case "responses":
                loadMyResponses(filters);
                break;
        }
    }, [activeTab, filterType, filterCategory, filterState, filterStatus, search, loadMyEnquiries, loadPublicEnquiries, loadVendorEnquiries, loadMyResponses]);

    const handleCreate = () => {
        setCreateModalOpen(true);
    };

    const handleSave = async (payload) => {
        try {
            await create(payload);
            setCreateModalOpen(false);
        } catch (err) {
            console.error("Failed to save enquiry", err);
            const errorMessage = err?.response?.data?.error?.message || 
                                err?.response?.data?.message || 
                                "Failed to create enquiry. Please check all required fields.";
            alert(errorMessage);
        }
    };

    const handleDelete = async (item) => {
        if (window.confirm(`Delete enquiry for "${item.productName}"?`)) {
            try {
                await remove(item.id);
            } catch (err) {
                console.error("Failed to delete enquiry", err);
                alert(err?.response?.data?.error?.message || "Failed to delete enquiry");
            }
        }
    };

    const handleClose = async (item) => {
        if (window.confirm(`Close enquiry for "${item.productName}"? This cannot be undone.`)) {
            try {
                await closeEnquiry(item.id);
            } catch (err) {
                console.error("Failed to close enquiry", err);
                alert(err?.response?.data?.error?.message || "Failed to close enquiry");
            }
        }
    };

    const handleRespond = (item) => {
        setSelectedEnquiry(item);
        setRespondModalOpen(true);
    };

    const handleRespondSave = async (id, payload) => {
        try {
            await respond(id, payload);
            setRespondModalOpen(false);
            setSelectedEnquiry(null);
        } catch (err) {
            console.error("Failed to respond to enquiry", err);
            const errorMessage = err?.response?.data?.error?.message || 
                                err?.response?.data?.message || 
                                "Failed to submit your response. Please try again.";
            alert(errorMessage);
        }
    };

    const handleViewResponses = (item) => {
        setSelectedEnquiry(item);
        setViewResponsesModalOpen(true);
    };

    const handleMarkViewed = async (enquiryId, responseId) => {
        try {
            await markResponseViewed(enquiryId, responseId);
        } catch (err) {
            console.error("Failed to mark response as viewed", err);
        }
    };

    const handleSelectResponse = async (enquiryId, responseId, selectionNote) => {
        try {
            await selectResponse(enquiryId, responseId, selectionNote);
            // Update the selected enquiry to reflect the selection
            setSelectedEnquiry(prev => {
                if (!prev) return prev;
                const updatedResponses = (prev.responses || []).map(r => ({
                    ...r,
                    selectionStatus: r._id === responseId ? 'accepted' : 'rejected',
                    selectionStatusUpdatedAt: new Date().toISOString(),
                    selectionNote: r._id === responseId ? selectionNote : undefined
                }));
                return {
                    ...prev,
                    selectedResponseId: responseId,
                    status: 'closed',
                    responses: updatedResponses
                };
            });
            reload();
        } catch (err) {
            console.error("Failed to select response", err);
            alert(err?.response?.data?.error?.message || "Failed to select response");
        }
    };

    // Get current data based on active tab
    const getCurrentData = () => {
        switch (activeTab) {
            case "my":
                return myEnquiries;
            case "public":
                return publicEnquiries;
            case "vendor":
                return vendorEnquiries;
            case "responses":
                return myResponses;
            default:
                return [];
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Enquiries</h1>
                <button
                    onClick={handleCreate}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Enquiry
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-4">
                <div className="flex gap-4 flex-wrap">
                    <button
                        onClick={() => setActiveTab("my")}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === "my"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        My Enquiries ({myEnquiries.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("public")}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === "public"
                            ? "border-purple-600 text-purple-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Public Enquiries ({publicEnquiries.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("vendor")}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === "vendor"
                            ? "border-teal-600 text-teal-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Vendor Enquiries ({vendorEnquiries.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("responses")}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === "responses"
                            ? "border-orange-600 text-orange-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        My Responses ({myResponses.length})
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                />
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    <option value="">All Types</option>
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                </select>
                {activeTab === "my" && (
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                    </select>
                )}
                {activeTab === "public" && (
                    <>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <select
                            value={filterState}
                            onChange={(e) => setFilterState(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">All States</option>
                            {INDIAN_STATES.map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                    </>
                )}
                {(activeTab === "vendor" || activeTab === "responses") && (
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                )}
                <button
                    onClick={reload}
                    className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    title="Refresh"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {error.message || "An error occurred"}
                </div>
            )}

            {/* Content based on active tab */}
            <div className="bg-white rounded-lg shadow">
                {activeTab === "responses" ? (
                    <MyResponsesTable data={myResponses} loading={loading} />
                ) : (
                    <EnquiryTable
                        data={getCurrentData()}
                        onDelete={handleDelete}
                        onRespond={handleRespond}
                        onViewResponses={handleViewResponses}
                        onClose={handleClose}
                        isMyEnquiries={activeTab === "my"}
                        activeTab={activeTab}
                        loading={loading}
                    />
                )}
            </div>

            {/* Modals */}
            <CreateEnquiryModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSave={handleSave}
                registeredVendors={registeredVendors}
            />

            <RespondModal
                isOpen={respondModalOpen}
                onClose={() => { setRespondModalOpen(false); setSelectedEnquiry(null); }}
                onSave={handleRespondSave}
                enquiry={selectedEnquiry}
            />

            <ViewResponsesModal
                isOpen={viewResponsesModalOpen}
                onClose={() => { setViewResponsesModalOpen(false); setSelectedEnquiry(null); }}
                enquiry={selectedEnquiry}
                onMarkViewed={handleMarkViewed}
                onSelectResponse={handleSelectResponse}
            />
        </div>
    );
}

/**
 * MyResponsesTable - Table component for displaying user's responses to other enquiries
 */
function MyResponsesTable({ data, loading }) {
    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>You haven't responded to any enquiries yet.</p>
                <p className="text-sm mt-1">Check Public or Vendor enquiries to respond.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-orange-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Enquiry Details</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Posted By</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Your Quotation</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Response Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Selection Status</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((response) => (
                        <tr key={response._id || response.id} className={`hover:bg-gray-50 ${
                            response.selectionStatus === 'accepted' ? 'bg-green-50' :
                            response.selectionStatus === 'rejected' ? 'bg-gray-50 opacity-70' : ''
                        }`}>
                            <td className="px-4 py-4">
                                <div className="font-medium text-gray-900">{response.enquiryDetails?.productName || 'N/A'}</div>
                                <div className="text-sm text-gray-500">
                                    {response.enquiryDetails?.quantity} {response.enquiryDetails?.unit}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    <span className={`px-2 py-0.5 rounded ${response.enquiryDetails?.enquiryType === 'buy' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {response.enquiryDetails?.enquiryType?.toUpperCase()}
                                    </span>
                                    <span className="ml-2">{response.enquiryDetails?.category}</span>
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                <div className="text-sm text-gray-900">{response.enquiryDetails?.createdByCompany || 'Unknown'}</div>
                                <div className="text-xs text-gray-500">{response.enquiryDetails?.state}</div>
                            </td>
                            <td className="px-4 py-4">
                                <div className="font-medium text-green-600">₹{response.price?.toLocaleString()}</div>
                                <div className="text-sm text-gray-500">
                                    {response.quantity} {response.unit || response.enquiryDetails?.unit}
                                </div>
                                {response.deliveryTime && (
                                    <div className="text-xs text-gray-400">Delivery: {response.deliveryTime}</div>
                                )}
                                {response.paymentTerms && (
                                    <div className="text-xs text-gray-400">Payment: {response.paymentTerms}</div>
                                )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                                {formatDate(response.respondedAt)}
                            </td>
                            <td className="px-4 py-4">
                                {response.selectionStatus === 'accepted' ? (
                                    <div className="flex flex-col items-start">
                                        <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            ACCEPTED
                                        </span>
                                        <span className="text-xs text-green-600 mt-1">Your quotation was selected!</span>
                                        {response.selectionNote && (
                                            <span className="text-xs text-gray-500 mt-1 italic">"{response.selectionNote}"</span>
                                        )}
                                    </div>
                                ) : response.selectionStatus === 'rejected' ? (
                                    <div className="flex flex-col items-start">
                                        <span className="px-2 py-1 text-xs font-medium rounded bg-gray-200 text-gray-600 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            NOT SELECTED
                                        </span>
                                        <span className="text-xs text-gray-500 mt-1">Another quotation was chosen</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-start">
                                        <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                                            PENDING
                                        </span>
                                        <span className="text-xs text-gray-500 mt-1">Awaiting selection</span>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
