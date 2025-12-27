// VendorModal.jsx - Extracted modal component for reusability
import React, { useState, useEffect, useRef } from "react";

/**
 * VendorModal - Modal for creating/editing vendors
 * Can be used standalone or as a nested modal via ModalContext
 */
export default function VendorModal({ isOpen, onClose, onSave, onDelete, editData }) {
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
    const lastEditDataRef = useRef(null);

    // Track when modal opens/closes or editData changes to reset form
    useEffect(() => {
        if (!isOpen) {
            lastEditDataRef.current = null;
            return;
        }

        // Only update if editData actually changed
        if (lastEditDataRef.current === editData) return;
        lastEditDataRef.current = editData;

        // Use queueMicrotask to defer state updates
        queueMicrotask(() => {
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
        });
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
            name: trimmedName,
            displayName: trimmedName,
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
        <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
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
    );
}
