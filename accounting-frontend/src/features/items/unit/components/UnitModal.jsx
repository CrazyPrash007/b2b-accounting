// UnitModal.jsx - Extracted modal component for reusability
import React, { useState, useEffect, useRef } from "react";

export default function UnitModal({ isOpen, onClose, onSave, onDelete, editData }) {
    const [fullName, setFullName] = useState("");
    const [aliasName, setAliasName] = useState("");
    const [error, setError] = useState("");
    const fullNameRef = useRef(null);
    const aliasNameRef = useRef(null);

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
                setFullName(editData.fullName || "");
                setAliasName(editData.aliasName || "");
            } else {
                setFullName("");
                setAliasName("");
            }
            setError("");
            setTimeout(() => fullNameRef.current?.focus(), 100);
        });
    }, [editData, isOpen]);

    const handleKeyDown = (e, fieldName) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (fieldName === 'fullName') {
                aliasNameRef.current?.focus();
            } else if (fieldName === 'aliasName') {
                handleSave();
            }
        }
    };

    const handleSave = async () => {
        if (!fullName.trim()) {
            setError("Unit full name is required (e.g., Kilogram, Piece, Liter)");
            return;
        }

        const unitData = {
            id: isEditMode ? editData.id : String(Date.now()),
            fullName: fullName.trim(),
            aliasName: aliasName.trim(),
            name: aliasName.trim() || fullName.trim(), // for backend compatibility
        };

        try {
            await Promise.resolve(onSave(unitData, isEditMode));
        } catch (saveErr) {
            setError(saveErr?.message || "Failed to save unit. Please check required fields and try again.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 rounded-t-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <h3 className="text-base font-semibold text-white">
                    {isEditMode ? "Edit Unit" : "New Unit"}
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
                        Unit Full Name<span className="text-red-500">*</span>
                    </label>
                    <input
                        ref={fullNameRef}
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                            setFullName(e.target.value);
                            if (error) setError("");
                        }}
                        onKeyDown={(e) => handleKeyDown(e, 'fullName')}
                        placeholder="e.g., Kilogram, Piece, Liter"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alias Name
                    </label>
                    <input
                        ref={aliasNameRef}
                        type="text"
                        value={aliasName}
                        onChange={(e) => setAliasName(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, 'aliasName')}
                        placeholder="e.g., kg, pcs, ltr"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
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
                                setError(deleteErr?.message || "Failed to delete unit.");
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
