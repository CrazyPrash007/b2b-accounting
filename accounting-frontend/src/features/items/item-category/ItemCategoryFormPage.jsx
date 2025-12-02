// ItemCategoryFormPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * ItemCategoryFormPage - Full page form for creating/editing a category
 * Opens as a new tab/page instead of a drawer
 */
export default function ItemCategoryFormPage() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get edit data from location state if editing
    const editData = location.state?.category || null;
    const isEditMode = !!editData;
    const onSaveCallback = location.state?.onSave;

    const [categoryName, setCategoryName] = useState("");
    const [subcategories, setSubcategories] = useState([""]);
    const [error, setError] = useState("");

    useEffect(() => {
        if (editData) {
            setCategoryName(editData.name || "");
            setSubcategories(
                editData.subcategories?.length > 0 ? [...editData.subcategories] : [""]
            );
        }
    }, [editData]);

    const handleSubcategoryChange = (index, value) => {
        const updated = [...subcategories];
        updated[index] = value;
        setSubcategories(updated);
    };

    const addSubcategory = () => {
        setSubcategories([...subcategories, ""]);
    };

    const removeSubcategory = (index) => {
        if (subcategories.length <= 1) return;
        const updated = subcategories.filter((_, i) => i !== index);
        setSubcategories(updated);
    };

    const handleSave = (e) => {
        e.preventDefault();
        
        if (!categoryName.trim()) {
            setError("Category is required");
            return;
        }

        const filteredSubcategories = subcategories
            .map((s) => s.trim())
            .filter((s) => s !== "");

        const categoryData = {
            id: isEditMode ? editData.id : String(Date.now()),
            name: categoryName.trim(),
            subcategories: filteredSubcategories,
        };

        // Navigate back with the saved data
        navigate("/item-category", { 
            state: { 
                savedCategory: categoryData, 
                isEdit: isEditMode 
            } 
        });
    };

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            navigate("/item-category", { 
                state: { 
                    deletedCategoryId: editData.id 
                } 
            });
        }
    };

    const handleCancel = () => {
        navigate("/item-category");
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleCancel}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h2 className="text-lg font-semibold text-gray-900">
                        {isEditMode ? "Edit Category" : "New Category"}
                    </h2>
                </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-auto p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Category Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category<span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={categoryName}
                            onChange={(e) => {
                                setCategoryName(e.target.value);
                                if (error) setError("");
                            }}
                            placeholder="Enter category name"
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {error && (
                            <p className="mt-1 text-sm text-red-500">{error}</p>
                        )}
                    </div>

                    {/* Subcategories */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sub Categories
                        </label>
                        <div className="space-y-2">
                            {subcategories.map((sub, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={sub}
                                        onChange={(e) =>
                                            handleSubcategoryChange(index, e.target.value)
                                        }
                                        placeholder={`Subcategory ${index + 1}`}
                                        className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {subcategories.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeSubcategory(index)}
                                            className="text-red-500 hover:text-red-700 px-2 py-1 text-lg font-bold"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addSubcategory}
                            className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                        >
                            <span className="text-lg">+</span> Add Subcategory
                        </button>
                    </div>
                </div>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                {isEditMode ? (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="px-4 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50"
                    >
                        Delete
                    </button>
                ) : (
                    <div></div>
                )}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        {isEditMode ? "Update" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}
