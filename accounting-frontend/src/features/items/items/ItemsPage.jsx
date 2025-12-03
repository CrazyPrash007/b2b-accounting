// ItemsPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ItemTable from "./ItemTable";

/**
 * ItemModal - Compact centered modal for creating/editing an item
 * Fields: Item Name, Description, Category, Sub-Category, Brand Name, GST Rate, HSN No, 
 *         Item Type, Unit, Buy Price, Sell Price, Opening Stock, Min Stock, Opening Date
 */
function ItemModal({ isOpen, onClose, onSave, onDelete, editData }) {
    // Form fields
    const [itemName, setItemName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [subCategory, setSubCategory] = useState("");
    const [brandName, setBrandName] = useState("");
    const [gstRate, setGstRate] = useState("");
    const [hsnNo, setHsnNo] = useState("");
    const [itemType, setItemType] = useState("Goods");
    const [unit, setUnit] = useState("");
    const [buyPrice, setBuyPrice] = useState("");
    const [sellPrice, setSellPrice] = useState("");
    const [openingStock, setOpeningStock] = useState("");
    const [minStock, setMinStock] = useState("");
    const [openingDate, setOpeningDate] = useState("");

    // Validation errors
    const [errorName, setErrorName] = useState("");

    const isEditMode = !!editData;

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setItemName(editData.itemName ?? editData.name ?? "");
                setDescription(editData.description ?? "");
                setCategory(editData.category ?? "");
                setSubCategory(editData.subCategory ?? "");
                setBrandName(editData.brandName ?? "");
                setGstRate(editData.gstRate ?? "");
                setHsnNo(editData.hsnNo ?? "");
                setItemType(editData.itemType ?? editData.type ?? "Goods");
                setUnit(editData.unit ?? "");
                setBuyPrice(editData.buyPrice ?? "");
                setSellPrice(editData.sellPrice ?? "");
                setOpeningStock(editData.openingStock ?? "");
                setMinStock(editData.minStock ?? "");
                setOpeningDate(editData.openingDate ?? new Date().toISOString().split('T')[0]);
            } else {
                // Reset to defaults
                setItemName("");
                setDescription("");
                setCategory("");
                setSubCategory("");
                setBrandName("");
                setGstRate("");
                setHsnNo("");
                setItemType("Goods");
                setUnit("");
                setBuyPrice("");
                setSellPrice("");
                setOpeningStock("");
                setMinStock("");
                setOpeningDate(new Date().toISOString().split('T')[0]);
            }
            setErrorName("");
        }
    }, [editData, isOpen]);

    const baseInput =
        "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";

    const handleSave = () => {
        setErrorName("");
        const trimmedName = itemName.trim();

        if (!trimmedName) {
            setErrorName("Item Name is required");
            return;
        }

        const payload = {
            id: editData?.id ?? String(Date.now()),
            itemName: trimmedName,
            name: trimmedName, // for table display compatibility
            description: description.trim(),
            category: category.trim(),
            subCategory: subCategory.trim(),
            brandName: brandName.trim(),
            gstRate: gstRate || "",
            hsnNo: hsnNo.trim(),
            itemType,
            type: itemType, // for table display compatibility
            unit: unit.trim(),
            buyPrice: buyPrice || "",
            sellPrice: sellPrice || "",
            openingStock: openingStock || "",
            minStock: minStock || "",
            openingDate: openingDate || "",
        };

        onSave(payload, isEditMode);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
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
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-3 rounded-t-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <h3 className="text-base font-semibold text-white">
                        {isEditMode ? "Edit Item" : "New Item"}
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

                {/* Modal Body */}
                <div className="px-5 py-4 overflow-y-auto flex-1" data-form-container onKeyDown={handleKeyDown}>
                    {/* Row 1: Item Name (wide) and Description (wide) */}
                    <div className="grid grid-cols-4 gap-3 mb-3">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Item Name<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={itemName}
                                onChange={(e) => {
                                    setItemName(e.target.value);
                                    if (errorName) setErrorName("");
                                }}
                                className={baseInput + (errorName ? " border-red-500" : "")}
                                placeholder="Enter Item Name"
                                autoFocus
                            />
                            {errorName && <p className="mt-1 text-xs text-red-500">{errorName}</p>}
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className={baseInput}
                                placeholder="Enter Description"
                                maxLength={500}
                            />
                        </div>
                    </div>

                    {/* Row 2: Item Type, Unit, Category, Sub-Category */}
                    <div className="grid grid-cols-4 gap-3 mb-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
                            <select
                                value={itemType}
                                onChange={(e) => setItemType(e.target.value)}
                                className={baseInput}
                            >
                                <option value="Goods">Goods</option>
                                <option value="Service">Service</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                            <input
                                type="text"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                className={baseInput}
                                placeholder="e.g., pcs, kg, ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className={baseInput}
                                placeholder="Select Category"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Category</label>
                            <input
                                type="text"
                                value={subCategory}
                                onChange={(e) => setSubCategory(e.target.value)}
                                className={baseInput}
                                placeholder="Select Sub-Category"
                            />
                        </div>
                    </div>

                    {/* Row 3: Brand Name, HSN No, GST Rate, Buy Price */}
                    <div className="grid grid-cols-4 gap-3 mb-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                            <input
                                type="text"
                                value={brandName}
                                onChange={(e) => setBrandName(e.target.value)}
                                className={baseInput}
                                placeholder="Enter Brand"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">HSN No</label>
                            <input
                                type="text"
                                value={hsnNo}
                                onChange={(e) => setHsnNo(e.target.value)}
                                className={baseInput}
                                placeholder="Enter HSN Code"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
                            <select
                                value={gstRate}
                                onChange={(e) => setGstRate(e.target.value)}
                                className={baseInput}
                            >
                                <option value="">Select GST Rate</option>
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Buy Price</label>
                            <input
                                type="number"
                                value={buyPrice}
                                onChange={(e) => setBuyPrice(e.target.value)}
                                className={baseInput}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Row 4: Sell Price, Opening Stock, Min Stock, Opening Date */}
                    <div className="grid grid-cols-4 gap-3 mb-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price</label>
                            <input
                                type="number"
                                value={sellPrice}
                                onChange={(e) => setSellPrice(e.target.value)}
                                className={baseInput}
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Stock</label>
                            <input
                                type="number"
                                value={openingStock}
                                onChange={(e) => setOpeningStock(e.target.value)}
                                className={baseInput}
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                            <input
                                type="number"
                                value={minStock}
                                onChange={(e) => setMinStock(e.target.value)}
                                className={baseInput}
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Date</label>
                            <input
                                type="date"
                                value={openingDate}
                                onChange={(e) => setOpeningDate(e.target.value)}
                                className={baseInput}
                            />
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
        </div>
    );
}

/**
 * ItemsPage - Main page for Item Master management
 * Frontend-only, in-memory state, no backend calls
 */
export default function ItemsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [items, setItems] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Handle saved/deleted data from form page (for backwards compatibility)
    useEffect(() => {
        if (location.state?.savedItem) {
            const savedItem = location.state.savedItem;
            const isEdit = location.state.isEdit;
            
            if (isEdit) {
                setItems((prev) =>
                    prev.map((item) =>
                        item.id === savedItem.id ? savedItem : item
                    )
                );
            } else {
                setItems((prev) => [...prev, savedItem]);
            }
            // Clear the state
            window.history.replaceState({}, document.title);
        }
        
        if (location.state?.deletedItemId) {
            setItems((prev) => 
                prev.filter((item) => item.id !== location.state.deletedItemId)
            );
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const handleCreateItem = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEditItem = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleSaveItem = (itemData, isEdit) => {
        if (isEdit) {
            setItems((prev) =>
                prev.map((item) =>
                    item.id === itemData.id ? itemData : item
                )
            );
        } else {
            setItems((prev) => [...prev, itemData]);
        }
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleDeleteItem = (id) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            setItems((prev) => prev.filter((item) => item.id !== id));
            setIsModalOpen(false);
            setEditingItem(null);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header Row */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-semibold text-gray-900">Item Master</h1>
                    <button className="text-gray-400 hover:text-yellow-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </button>
                </div>
                <button
                    type="button"
                    className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                    onClick={handleCreateItem}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Item
                </button>
            </div>

            {/* Item Table */}
            <ItemTable
                items={items}
                onEdit={handleEditItem}
            />

            {/* Item Modal */}
            <ItemModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveItem}
                onDelete={handleDeleteItem}
                editData={editingItem}
            />
        </div>
    );
}
