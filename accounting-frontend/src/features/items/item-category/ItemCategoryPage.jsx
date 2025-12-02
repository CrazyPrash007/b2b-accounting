// ItemCategoryPage.jsx
import React, { useState, useEffect, useRef } from "react";

/**
 * CategoryDrawer - Right-side sliding drawer for creating/editing a category
 */
function CategoryDrawer({ isOpen, onClose, onSave, onDelete, editData }) {
    const [categoryName, setCategoryName] = useState("");
    const [subcategories, setSubcategories] = useState([""]);
    const [error, setError] = useState("");

    const isEditMode = !!editData;

    useEffect(() => {
        if (editData) {
            setCategoryName(editData.name || "");
            setSubcategories(
                editData.subcategories?.length > 0 ? [...editData.subcategories] : [""]
            );
        } else {
            resetForm();
        }
    }, [editData, isOpen]);

    const resetForm = () => {
        setCategoryName("");
        setSubcategories([""]);
        setError("");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

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

        onSave(categoryData, isEditMode);
        resetForm();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/40"
                onClick={handleClose}
            />

            {/* Drawer Panel */}
            <div className="ml-auto w-full sm:w-[35%] sm:min-w-[400px] bg-white shadow-xl h-full flex flex-col relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold">
                        {isEditMode ? "Edit Category" : "New Category"}
                    </h3>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-600 text-xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSave} className="flex-1 overflow-auto p-6">
                    <div className="space-y-6">
                        {/* Category Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
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
                                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {error && (
                                <p className="mt-1 text-sm text-red-500">{error}</p>
                            )}
                        </div>

                        {/* Subcategories */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
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
                                            className="flex-1 border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50">
                    {isEditMode ? (
                        <button
                            type="button"
                            onClick={() => onDelete && onDelete(editData.id)}
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
                            onClick={handleClose}
                            className="px-4 py-2 text-slate-600 hover:text-slate-800 border border-slate-300 rounded hover:bg-slate-100"
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
        </div>
    );
}

/**
 * ItemCategoryPage
 * - Frontend-only category management with subcategories
 * - No backend/API calls, in-memory state only
 */
export default function ItemCategoryPage() {
    const [categories, setCategories] = useState([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const handleOpenDrawer = () => {
        setEditingCategory(null);
        setIsDrawerOpen(true);
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setIsDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setEditingCategory(null);
    };

    const handleSave = (categoryData, isEdit) => {
        if (isEdit) {
            setCategories((prev) =>
                prev.map((cat) =>
                    cat.id === categoryData.id ? categoryData : cat
                )
            );
        } else {
            setCategories((prev) => [...prev, categoryData]);
        }
        setIsDrawerOpen(false);
        setEditingCategory(null);
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            setCategories((prev) => prev.filter((cat) => cat.id !== id));
            setIsDrawerOpen(false);
            setEditingCategory(null);
        }
    };

    const TOTAL_ROWS = 15;
    const tableContainerRef = useRef(null);
    const [visibleRows, setVisibleRows] = useState(TOTAL_ROWS);

    // Calculate how many rows can fit in the available space
    useEffect(() => {
        const calculateRows = () => {
            if (tableContainerRef.current) {
                const containerHeight = tableContainerRef.current.clientHeight;
                const rowHeight = 32; // h-8 = 32px
                const headerHeight = 36; // h-9 = 36px
                const availableHeight = containerHeight - headerHeight;
                const rows = Math.floor(availableHeight / rowHeight);
                setVisibleRows(Math.max(rows, 1));
            }
        };

        calculateRows();
        window.addEventListener('resize', calculateRows);
        return () => window.removeEventListener('resize', calculateRows);
    }, []);

    const emptyRowsCount = Math.max(0, visibleRows - categories.length);
    const emptyRows = Array.from({ length: emptyRowsCount }, (_, i) => i);

    // Calculate record display
    const totalRecords = categories.length;
    const startRecord = totalRecords > 0 ? 1 : 0;
    const endRecord = totalRecords;

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header Row */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">Item Category</h2>
                    <button className="text-gray-400 hover:text-yellow-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </button>
                </div>
                <button
                    onClick={handleOpenDrawer}
                    className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Category
                </button>
            </div>

            {/* Toolbar */}
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
                <div className="w-px h-5 bg-gray-300 mx-1"></div>
                <button className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    More Filter
                </button>
            </div>

            {/* Table Container - Scrollable */}
            <div ref={tableContainerRef} className="flex-1 overflow-auto px-4 pb-1">
                <div className="border border-gray-200 rounded overflow-hidden h-full">
                <table className="w-full border-collapse text-sm" style={{ borderSpacing: 0 }}>
                    <thead className="sticky top-0 z-10 bg-white">
                        <tr className="border-b border-gray-300">
                            <th className="w-[35%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                    <span>Category</span>
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                            </th>
                            <th className="w-[50%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                    <span>Sub Category</span>
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                            </th>
                            <th className="w-[15%] h-9 px-4 text-left text-sm font-medium text-gray-700">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Data rows */}
                        {categories.map((category, index) => (
                            <tr key={category.id} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'}`}>
                                <td className="h-8 px-4 text-left text-blue-600 border-r border-gray-200">
                                    {category.name}
                                </td>
                                <td className="h-8 px-4 text-left text-gray-600 border-r border-gray-200">
                                    {category.subcategories.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {category.subcategories.map((sub, idx) => (
                                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                                                    {sub}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        ""
                                    )}
                                </td>
                                <td className="h-8 px-4 text-left">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleEditCategory(category)}
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
                        {/* Empty rows to fill the display */}
                        {emptyRows.map((_, idx) => {
                            const rowIndex = categories.length + idx;
                            return (
                                <tr key={`empty-${idx}`} className={`border-b border-gray-200 ${rowIndex % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'}`}>
                                    <td className="h-8 px-4 border-r border-gray-200"></td>
                                    <td className="h-8 px-4 border-r border-gray-200"></td>
                                    <td className="h-8 px-4"></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                </div>
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="px-4 py-2 border-t border-gray-200 text-sm text-blue-600 bg-white">
                {totalRecords > 0 ? `${startRecord}-${endRecord} of ${totalRecords} Records` : '0 Records'}
            </div>

            {/* Drawer */}
            <CategoryDrawer
                isOpen={isDrawerOpen}
                onClose={handleCloseDrawer}
                onSave={handleSave}
                onDelete={handleDelete}
                editData={editingCategory}
            />
        </div>
    );
}
