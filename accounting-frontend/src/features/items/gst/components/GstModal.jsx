// GstModal.jsx - Extracted modal component for reusability
import React, { useState, useEffect, useRef } from "react";

export default function GstModal({ isOpen, onClose, onSave, onDelete, editData }) {
    const [gstRate, setGstRate] = useState("");
    const [error, setError] = useState("");
    const inputRef = useRef(null);

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
                setGstRate(editData.rate || "");
            } else {
                setGstRate("");
            }
            setError("");
            setTimeout(() => inputRef.current?.focus(), 100);
        });
    }, [editData, isOpen]);

    const handleSave = async () => {
        if (!gstRate.toString().trim()) {
            setError("GST rate is required (e.g., 0, 5, 12, 18, 28)");
            return;
        }

        const rate = parseFloat(gstRate);
        if (isNaN(rate) || rate < 0) {
            setError("Please enter a valid GST rate (must be 0 or a positive number)");
            return;
        }

        if (rate > 100) {
            setError("GST rate cannot exceed 100%");
            return;
        }

        const gstData = {
            id: isEditMode ? editData.id : String(Date.now()),
            rate: rate,
        };

        try {
            await Promise.resolve(onSave(gstData, isEditMode));
        } catch (saveErr) {
            setError(saveErr?.message || "Failed to save GST rate. Please check required fields and try again.");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 rounded-t-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <h3 className="text-base font-semibold text-white">
                    {isEditMode ? "Edit GST Rate" : "New GST Rate"}
                </h3>
                <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Modal Body */}
            <div className="px-5 py-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        GST Rate (%)<span className="text-red-500">*</span>
                    </label>
                    <input
                        ref={inputRef}
                        type="number"
                        value={gstRate}
                        onChange={(e) => {
                            setGstRate(e.target.value);
                            if (error) setError("");
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter GST rate (e.g., 18)"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        step="0.01"
                    />
                    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
                </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                {isEditMode ? (
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                setError("");
                                if (onDelete) await Promise.resolve(onDelete(editData.id));
                            } catch (deleteErr) {
                                setError(deleteErr?.message || "Failed to delete GST rate.");
                            }
                        }}
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
