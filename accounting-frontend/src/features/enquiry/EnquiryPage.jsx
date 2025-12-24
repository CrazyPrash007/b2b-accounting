// src/features/enquiry/EnquiryPage.jsx
import React, { useState, useEffect, useContext, useRef } from "react";
import useEnquiry from "./hooks/useEnquiry";
import EnquiryTable from "./EnquiryTable";
import itemApi from "src/features/items/items/api/item.api";
import apiClient from "src/services/apiClient";
import { CompanyContext } from "src/App";

// Indian states list
const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

/**
 * CreateEnquiryModal - Modal for creating/editing enquiries
 */
function CreateEnquiryModal({ isOpen, onClose, onSave, editData }) {
    const context = useContext(CompanyContext);
    const selectedCompany = context?.selectedCompany || "";
    const dropdownRef = useRef(null);
    
    const [enquiryType, setEnquiryType] = useState("buy");
    const [productName, setProductName] = useState("");
    const [category, setCategory] = useState("");
    const [subCategory, setSubCategory] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("");
    const [expectedPrice, setExpectedPrice] = useState("");
    const [description, setDescription] = useState("");
    const [targetStates, setTargetStates] = useState([]);
    const [creatorName, setCreatorName] = useState("");
    const [creatorCompany, setCreatorCompany] = useState("");
    const [creatorState, setCreatorState] = useState("");
    const [creatorMobile, setCreatorMobile] = useState("");
    const [creatorEmail, setCreatorEmail] = useState("");
    const [validUntil, setValidUntil] = useState("");
    const [error, setError] = useState("");
    
    // Items dropdown
    const [items, setItems] = useState([]);
    const [showItemDropdown, setShowItemDropdown] = useState(false);
    const [filteredItems, setFilteredItems] = useState([]);

    const isEditMode = !!editData;

    // Load items and company details from backend
    useEffect(() => {
        const loadData = async () => {
            if (selectedCompany && isOpen && !isEditMode) {
                try {
                    // Load items
                    const itemsData = await itemApi.list(selectedCompany);
                    setItems(Array.isArray(itemsData) ? itemsData : []);

                    // Load company details
                    const companyRes = await apiClient.get(`/api/companies/${selectedCompany}`);
                    if (companyRes?.data?.success && companyRes?.data?.data) {
                        const company = companyRes.data.data;
                        // Auto-fill company contact details
                        setCreatorCompany(company.companyName || "");
                        setCreatorState(company.state || "");
                        setCreatorMobile(company.mobile || "");
                        setCreatorEmail(company.email || "");
                    }
                } catch (err) {
                    console.error("Failed to load data", err);
                    setItems([]);
                }
            }
        };
        loadData();
    }, [selectedCompany, isOpen, isEditMode]);

    // Filter items based on product name input
    useEffect(() => {
        if (productName.trim()) {
            const filtered = items.filter(item =>
                (item.name || item.itemName || "").toLowerCase().includes(productName.toLowerCase())
            );
            setFilteredItems(filtered);
        } else {
            setFilteredItems(items);
        }
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

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setEnquiryType(editData.enquiryType || "buy");
                setProductName(editData.productName || "");
                setCategory(editData.category || "");
                setSubCategory(editData.subCategory || "");
                setQuantity(editData.quantity || "");
                setUnit(editData.unit || "");
                setExpectedPrice(editData.expectedPrice || "");
                setDescription(editData.description || "");
                setTargetStates(editData.targetStates || []);
                setCreatorName(editData.creatorName || "");
                setCreatorCompany(editData.creatorCompany || "");
                setCreatorState(editData.creatorState || "");
                setCreatorMobile(editData.creatorMobile || "");
                setCreatorEmail(editData.creatorEmail || "");
                setValidUntil(editData.validUntil ? editData.validUntil.split('T')[0] : "");
            } else {
                setEnquiryType("buy");
                setProductName("");
                setCategory("");
                setSubCategory("");
                setQuantity("");
                setUnit("");
                setExpectedPrice("");
                setDescription("");
                setTargetStates([]);
                setCreatorName("");
                setCreatorCompany("");
                setCreatorState("");
                setCreatorMobile("");
                setCreatorEmail("");
                setValidUntil("");
            }
            setError("");
            setShowItemDropdown(false);
        }
    }, [editData, isOpen]);

    const handleSave = () => {
        if (!productName.trim()) {
            setError("Product Name is required");
            return;
        }

        const payload = {
            enquiryType,
            productName: productName.trim(),
            category: category.trim(),
            subCategory: subCategory.trim(),
            quantity: quantity ? Number(quantity) : 0,
            unit: unit.trim(),
            expectedPrice: expectedPrice ? Number(expectedPrice) : 0,
            description: description.trim(),
            targetStates,
            creatorName: creatorName.trim(),
            creatorCompany: creatorCompany.trim(),
            creatorState: creatorState.trim(),
            creatorMobile: creatorMobile.trim(),
            creatorEmail: creatorEmail.trim(),
            validUntil: validUntil || null,
        };

        onSave(payload, isEditMode, editData?.id);
    };

    const handleStateToggle = (state) => {
        setTargetStates(prev =>
            prev.includes(state)
                ? prev.filter(s => s !== state)
                : [...prev, state]
        );
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
                        {isEditMode ? "Edit Enquiry" : "Create New Enquiry"}
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
                                {showItemDropdown && filteredItems.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                                        {filteredItems.slice(0, 10).map((item) => (
                                            <button
                                                key={item.id || item._id}
                                                type="button"
                                                onClick={() => handleItemSelect(item)}
                                                className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
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
                                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={baseInput} rows={2} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                                <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={baseInput} />
                            </div>
                        </div>
                    </div>

                    {/* Creator Details */}
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2 pb-1 border-b border-gray-200">Your Contact Details</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                                <input type="text" value={creatorName} onChange={(e) => setCreatorName(e.target.value)} className={baseInput} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                <input type="text" value={creatorCompany} onChange={(e) => setCreatorCompany(e.target.value)} className={baseInput} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                <select value={creatorState} onChange={(e) => setCreatorState(e.target.value)} className={baseInput}>
                                    <option value="">Select State</option>
                                    {INDIAN_STATES.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                                <input type="text" value={creatorMobile} onChange={(e) => setCreatorMobile(e.target.value)} className={baseInput} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" value={creatorEmail} onChange={(e) => setCreatorEmail(e.target.value)} className={baseInput} />
                            </div>
                        </div>
                    </div>

                    {/* Target States */}
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2 pb-1 border-b border-gray-200">
                            Target States <span className="font-normal text-gray-500">(Leave empty to show to all states)</span>
                        </h4>
                        <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 border rounded">
                            {INDIAN_STATES.map(state => (
                                <label key={state} className="flex items-center text-sm">
                                    <input
                                        type="checkbox"
                                        checked={targetStates.includes(state)}
                                        onChange={() => handleStateToggle(state)}
                                        className="mr-2"
                                    />
                                    {state}
                                </label>
                            ))}
                        </div>
                        {targetStates.length > 0 && (
                            <div className="mt-2 text-xs text-gray-500">
                                Selected: {targetStates.join(", ")}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 px-5 py-3 border-t bg-gray-50 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700">
                        {isEditMode ? "Update" : "Create"} Enquiry
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * RespondModal - Modal for responding to an enquiry
 */
function RespondModal({ isOpen, onClose, onSave, enquiry }) {
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [message, setMessage] = useState("");
    const [responderName, setResponderName] = useState("");
    const [responderCompany, setResponderCompany] = useState("");
    const [responderState, setResponderState] = useState("");
    const [responderMobile, setResponderMobile] = useState("");
    const [responderEmail, setResponderEmail] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setPrice("");
            setQuantity(enquiry?.quantity || "");
            setMessage("");
            setResponderName("");
            setResponderCompany("");
            setResponderState("");
            setResponderMobile("");
            setResponderEmail("");
            setError("");
        }
    }, [isOpen, enquiry]);

    const handleSave = () => {
        if (!price) {
            setError("Price is required");
            return;
        }
        if (!quantity) {
            setError("Quantity is required");
            return;
        }

        const payload = {
            price: Number(price),
            quantity: Number(quantity),
            message: message.trim(),
            responderName: responderName.trim(),
            responderCompany: responderCompany.trim(),
            responderState: responderState.trim(),
            responderMobile: responderMobile.trim(),
            responderEmail: responderEmail.trim(),
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
                        Respond to Enquiry
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
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Response Details */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Your Price (₹) *</label>
                            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={baseInput} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity You Can Provide *</label>
                            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={baseInput} />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className={baseInput} rows={2} placeholder="Add any additional details..." />
                        </div>
                    </div>

                    {/* Your Details */}
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2 pb-1 border-b border-gray-200">Your Contact Details</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                                <input type="text" value={responderName} onChange={(e) => setResponderName(e.target.value)} className={baseInput} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                <input type="text" value={responderCompany} onChange={(e) => setResponderCompany(e.target.value)} className={baseInput} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                <select value={responderState} onChange={(e) => setResponderState(e.target.value)} className={baseInput}>
                                    <option value="">Select State</option>
                                    {INDIAN_STATES.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                                <input type="text" value={responderMobile} onChange={(e) => setResponderMobile(e.target.value)} className={baseInput} />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" value={responderEmail} onChange={(e) => setResponderEmail(e.target.value)} className={baseInput} />
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
 * ViewResponsesModal - Modal for viewing responses to own enquiry
 */
function ViewResponsesModal({ isOpen, onClose, enquiry }) {
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 flex flex-col max-h-[90vh]">
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

                    {/* Responses */}
                    {responses.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No responses yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {responses.map((response, idx) => (
                                <div key={response._id || idx} className="border rounded-lg p-4 hover:shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {response.responderCompany || response.responderName || 'Anonymous'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {response.responderState || 'Unknown State'}
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {formatDate(response.respondedAt)}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                                        <div>
                                            <span className="text-gray-500">Offered Price:</span>
                                            <span className="ml-2 font-medium text-green-600">₹{response.price?.toLocaleString()}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Quantity:</span>
                                            <span className="ml-2 font-medium">{response.quantity}</span>
                                        </div>
                                    </div>
                                    {response.message && (
                                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                            {response.message}
                                        </div>
                                    )}
                                    <div className="mt-2 flex gap-4 text-xs text-gray-500">
                                        {response.responderMobile && (
                                            <span>📞 {response.responderMobile}</span>
                                        )}
                                        {response.responderEmail && (
                                            <span>✉️ {response.responderEmail}</span>
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
 * EnquiryPage - Main page with tabs for My Enquiries and Public Enquiries
 */
export default function EnquiryPage() {
    const {
        myEnquiries,
        publicEnquiries,
        loading,
        error,
        reload,
        loadMyEnquiries,
        loadPublicEnquiries,
        create,
        update,
        remove,
        respond,
        close
    } = useEnquiry();

    const [activeTab, setActiveTab] = useState("my");
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [respondModalOpen, setRespondModalOpen] = useState(false);
    const [viewResponsesModalOpen, setViewResponsesModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);

    // Filters
    const [filterType, setFilterType] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterState, setFilterState] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [search, setSearch] = useState("");
    
    // Unique categories from all enquiries
    const [categories, setCategories] = useState([]);

    // Extract unique categories from enquiries
    useEffect(() => {
        const allEnquiries = [...myEnquiries, ...publicEnquiries];
        const uniqueCategories = [...new Set(
            allEnquiries
                .map(enq => enq.category)
                .filter(cat => cat && cat.trim())
        )].sort();
        setCategories(uniqueCategories);
    }, [myEnquiries, publicEnquiries]);

    // Apply filters
    useEffect(() => {
        if (activeTab === "my") {
            loadMyEnquiries({ enquiryType: filterType || undefined, status: filterStatus || undefined, search: search || undefined });
        } else {
            loadPublicEnquiries({ enquiryType: filterType || undefined, category: filterCategory || undefined, state: filterState || undefined, search: search || undefined });
        }
    }, [activeTab, filterType, filterCategory, filterState, filterStatus, search, loadMyEnquiries, loadPublicEnquiries]);

    const handleCreate = () => {
        setEditData(null);
        setCreateModalOpen(true);
    };

    const handleEdit = (item) => {
        setEditData(item);
        setCreateModalOpen(true);
    };

    const handleSave = async (payload, isEdit, id) => {
        try {
            if (isEdit) {
                await update(id, payload);
            } else {
                await create(payload);
            }
            setCreateModalOpen(false);
            setEditData(null);
        } catch (err) {
            console.error("Failed to save enquiry", err);
            alert(err?.response?.data?.error?.message || "Failed to save enquiry");
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
                await close(item.id);
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
            alert(err?.response?.data?.error?.message || "Failed to respond");
        }
    };

    const handleViewResponses = (item) => {
        setSelectedEnquiry(item);
        setViewResponsesModalOpen(true);
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
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab("my")}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === "my"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        My Enquiries ({myEnquiries.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("public")}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === "public"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        Public Enquiries ({publicEnquiries.length})
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

            {/* Table */}
            <div className="bg-white rounded-lg shadow">
                <EnquiryTable
                    data={activeTab === "my" ? myEnquiries : publicEnquiries}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRespond={handleRespond}
                    onViewResponses={handleViewResponses}
                    onClose={handleClose}
                    isMyEnquiries={activeTab === "my"}
                    loading={loading}
                />
            </div>

            {/* Modals */}
            <CreateEnquiryModal
                isOpen={createModalOpen}
                onClose={() => { setCreateModalOpen(false); setEditData(null); }}
                onSave={handleSave}
                editData={editData}
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
            />
        </div>
    );
}
