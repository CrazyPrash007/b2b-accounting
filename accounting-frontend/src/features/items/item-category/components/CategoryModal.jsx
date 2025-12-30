// CategoryModal.jsx - Extracted modal component for reusability
import React, { useState, useEffect, useRef } from "react";

export default function CategoryModal({ isOpen, onClose, onSave, onDelete, editData }) {
    const [categoryName, setCategoryName] = useState("");
    const [subcategories, setSubcategories] = useState([""]);
    const [error, setError] = useState("");
    const categoryNameRef = useRef(null);
    const subcategoryRefs = useRef([]);

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
                setCategoryName(editData.name || "");
                setSubcategories(editData.subcategories?.length > 0 ? [...editData.subcategories] : [""]);
            } else {
                setCategoryName("");
                setSubcategories([""]);
            }
            setError("");
            setTimeout(() => categoryNameRef.current?.focus(), 100);
        });
    }, [editData, isOpen]);

    const isSubcategoryComplete = (value) => value && value.trim() !== "";
    const canAddNewSubcategory = () => {
        if (subcategories.length === 0) return true;
        return isSubcategoryComplete(subcategories[subcategories.length - 1]);
    };

    const handleKeyDown = (e, fieldType, index = null) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (fieldType === 'categoryName') {
                subcategoryRefs.current[0]?.focus();
            } else if (fieldType === 'subcategory') {
                if (index === subcategories.length - 1) {
                    if (canAddNewSubcategory()) {
                        setSubcategories(prev => [...prev, ""]);
                        if (error) setError("");
                        setTimeout(() => subcategoryRefs.current[index + 1]?.focus(), 50);
                    } else {
                        setError("Please fill the current subcategory before adding a new one");
                    }
                } else {
                    subcategoryRefs.current[index + 1]?.focus();
                }
            }
        }
    };

    const handleSubcategoryChange = (index, value) => {
        const updated = [...subcategories];
        updated[index] = value;
        setSubcategories(updated);
    };

    const addSubcategory = () => {
        if (!canAddNewSubcategory()) {
            setError("Please fill the current subcategory before adding a new one");
            return;
        }
        setSubcategories([...subcategories, ""]);
        if (error) setError("");
    };

    const removeSubcategory = (index) => {
        if (subcategories.length <= 1) return;
        const updated = subcategories.filter((_, i) => i !== index);
        setSubcategories(updated);
    };

    const handleSave = () => {
        if (!categoryName.trim()) {
            setError("Category name is required. Please enter a valid category name.");
            return;
        }

        const filteredSubcategories = subcategories.map((s) => s.trim()).filter((s) => s !== "");
        const categoryData = {
            id: isEditMode ? editData.id : String(Date.now()),
            name: categoryName.trim(),
            subcategories: filteredSubcategories,
        };

        onSave(categoryData, isEditMode);
    };

    if (!isOpen) return null;

    return (
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 rounded-t-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <h3 className="text-base font-semibold text-white">
                    {isEditMode ? "Edit Category" : "New Category"}
                </h3>
                <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Modal Body */}
            <div className="px-5 py-4 space-y-4 max-h-[400px] overflow-y-auto">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category<span className="text-red-500">*</span>
                    </label>
                    <input
                        ref={categoryNameRef}
                        type="text"
                        value={categoryName}
                        onChange={(e) => {
                            setCategoryName(e.target.value);
                            if (error) setError("");
                        }}
                        onKeyDown={(e) => handleKeyDown(e, 'categoryName')}
                        placeholder="Enter category name"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sub Categories
                    </label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {subcategories.map((sub, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <input
                                    ref={(el) => (subcategoryRefs.current[index] = el)}
                                    type="text"
                                    value={sub}
                                    onChange={(e) => handleSubcategoryChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, 'subcategory', index)}
                                    placeholder={`Subcategory ${index + 1}`}
                                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {subcategories.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeSubcategory(index)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addSubcategory}
                        className="mt-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                    >
                        + Add Subcategory
                    </button>
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
