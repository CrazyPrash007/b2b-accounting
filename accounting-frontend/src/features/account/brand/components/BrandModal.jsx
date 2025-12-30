// BrandModal.jsx - Extracted modal component for reusability
import React, { useState, useEffect, useRef } from "react";

export default function BrandModal({ isOpen, onClose, onSave, onDelete, editData }) {
    const [brandName, setBrandName] = useState("");
    const [error, setError] = useState("");
    const brandNameRef = useRef(null);

    const isEditMode = !!editData;
    const lastEditDataRef = useRef(null);

    // Reset form state when modal opens
    useEffect(() => {
        if (!isOpen) {
            lastEditDataRef.current = null;
            return;
        }

        if (lastEditDataRef.current === editData) return;
        lastEditDataRef.current = editData;

        queueMicrotask(() => {
            if (editData) {
                setBrandName(editData.brandName || "");
            } else {
                setBrandName("");
            }
            setError("");
            setTimeout(() => brandNameRef.current?.focus(), 100);
        });
    }, [editData, isOpen]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        }
    };

    const handleSave = () => {
        if (!brandName.trim()) {
            setError("Brand name is required. Please enter a valid brand name.");
            return;
        }

        const brandData = {
            id: isEditMode ? editData.id : String(Date.now()),
            brandName: brandName.trim(),
        };

        onSave(brandData, isEditMode);
    };

    if (!isOpen) return null;

    return (
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 rounded-t-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <h3 className="text-base font-semibold text-white">
                    {isEditMode ? "Edit Brand" : "New Brand"}
                </h3>
                <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Modal Body */}
            <div className="px-5 py-4 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Brand Name<span className="text-red-500">*</span>
                    </label>
                    <input
                        ref={brandNameRef}
                        type="text"
                        value={brandName}
                        onChange={(e) => {
                            setBrandName(e.target.value);
                            if (error) setError("");
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter brand name"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
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
                ) : <div></div>}
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
