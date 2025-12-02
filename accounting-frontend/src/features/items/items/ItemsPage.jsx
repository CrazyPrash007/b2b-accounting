// ItemsPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ItemTable from "./ItemTable";

/**
 * ItemModal - Compact centered modal for creating/editing an item
 * Shows different fields based on type: Goods vs Service/Additional Service
 */
function ItemModal({ isOpen, onClose, onSave, onDelete, editData }) {
    // Common fields
    const [type, setType] = useState("Goods");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [unit, setUnit] = useState("");
    const [showInPurchase, setShowInPurchase] = useState(true);
    const [showInSales, setShowInSales] = useState(true);
    const [purchasePrice, setPurchasePrice] = useState("");
    const [salesPrice, setSalesPrice] = useState("");
    const [status, setStatus] = useState("Active");

    // Goods-only fields
    const [group, setGroup] = useState("");
    const [category, setCategory] = useState("");
    const [negativeQtyAllowed, setNegativeQtyAllowed] = useState(true);
    const [newMRP, setNewMRP] = useState("");
    const [oldMRP, setOldMRP] = useState("");
    const [manageStock, setManageStock] = useState("Normal");
    const [skuCode, setSkuCode] = useState("");
    const [openingStockQty, setOpeningStockQty] = useState("");
    const [openingStockRate, setOpeningStockRate] = useState("");
    const [openingStockValue, setOpeningStockValue] = useState("");
    const [cessEnable, setCessEnable] = useState(false);

    // Validation errors
    const [errorName, setErrorName] = useState("");

    const isEditMode = !!editData;
    const isServiceType = type === "Service" || type === "Additional Service";

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setType(editData.type ?? "Goods");
                setName(editData.name ?? "");
                setDescription(editData.description ?? "");
                setUnit(editData.unit ?? "");
                setShowInPurchase(editData.showInPurchase ?? true);
                setShowInSales(editData.showInSales ?? true);
                setPurchasePrice(editData.purchasePrice ?? "");
                setSalesPrice(editData.salesPrice ?? "");
                setStatus(editData.status ?? "Active");
                setGroup(editData.group ?? "");
                setCategory(editData.category ?? "");
                setNegativeQtyAllowed(editData.negativeQtyAllowed ?? true);
                setNewMRP(editData.newMRP ?? "");
                setOldMRP(editData.oldMRP ?? "");
                setManageStock(editData.manageStock ?? "Normal");
                setSkuCode(editData.skuCode ?? "");
                setOpeningStockQty(editData.openingStockQty ?? "");
                setOpeningStockRate(editData.openingStockRate ?? "");
                setOpeningStockValue(editData.openingStockValue ?? "");
                setCessEnable(editData.cessEnable ?? false);
            } else {
                // Reset to defaults
                setType("Goods");
                setName("");
                setDescription("");
                setUnit("");
                setShowInPurchase(true);
                setShowInSales(true);
                setPurchasePrice("");
                setSalesPrice("");
                setStatus("Active");
                setGroup("");
                setCategory("");
                setNegativeQtyAllowed(true);
                setNewMRP("");
                setOldMRP("");
                setManageStock("Normal");
                setSkuCode("");
                setOpeningStockQty("");
                setOpeningStockRate("");
                setOpeningStockValue("");
                setCessEnable(false);
            }
            setErrorName("");
        }
    }, [editData, isOpen]);

    const baseInput =
        "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";

    const handleSave = () => {
        setErrorName("");
        const trimmedName = name.trim();

        if (!trimmedName) {
            setErrorName("Name is required");
            return;
        }

        const payload = {
            id: editData?.id ?? String(Date.now()),
            type,
            name: trimmedName,
            description: description.trim(),
            unit: unit.trim(),
            showInPurchase,
            showInSales,
            purchasePrice: purchasePrice || "",
            salesPrice: salesPrice || "",
            status,
            group: group.trim(),
            category: category.trim(),
            negativeQtyAllowed,
            newMRP: newMRP || "",
            oldMRP: oldMRP || "",
            manageStock,
            skuCode: skuCode.trim(),
            openingStockQty: openingStockQty || "",
            openingStockRate: openingStockRate || "",
            openingStockValue: openingStockValue || "",
            cessEnable,
        };

        onSave(payload, isEditMode);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900">
                        {isEditMode ? "Edit Item" : "New Item"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
                    {/* TYPE SWITCH */}
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Type</p>
                        <div className="flex gap-2">
                            {["Goods", "Service", "Additional Service"].map((option) => {
                                const active = type === option;
                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => setType(option)}
                                        className={
                                            "flex-1 rounded border px-2 py-1.5 text-xs font-medium transition-colors " +
                                            (active
                                                ? "border-blue-600 bg-blue-600 text-white"
                                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50")
                                        }
                                    >
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* NAME */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name<span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (errorName) setErrorName("");
                            }}
                            className={baseInput + (errorName ? " border-red-500" : "")}
                            placeholder="Enter Name"
                        />
                        {errorName && <p className="mt-1 text-xs text-red-500">{errorName}</p>}
                    </div>

                    {/* DESCRIPTION */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className={baseInput + " resize-none"}
                            placeholder="Enter Description"
                            maxLength={3000}
                        />
                    </div>

                    {/* GOODS-ONLY: Group & Category */}
                    {!isServiceType && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                                <input
                                    type="text"
                                    value={group}
                                    onChange={(e) => setGroup(e.target.value)}
                                    className={baseInput}
                                    placeholder="None"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <input
                                    type="text"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className={baseInput}
                                    placeholder="None"
                                />
                            </div>
                        </div>
                    )}

                    {/* UNIT */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                        <input
                            type="text"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            className={baseInput}
                            placeholder={isServiceType ? "Enter unit" : "Multi Unit"}
                        />
                    </div>

                    {/* GOODS-ONLY: Negative Qty Allowed */}
                    {!isServiceType && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Negative Qty Allowed</p>
                            <div className="flex items-center gap-4 text-sm">
                                <label className="inline-flex items-center gap-2">
                                    <input type="radio" className="h-4 w-4" checked={negativeQtyAllowed === true} onChange={() => setNegativeQtyAllowed(true)} />
                                    <span>Yes</span>
                                </label>
                                <label className="inline-flex items-center gap-2">
                                    <input type="radio" className="h-4 w-4" checked={negativeQtyAllowed === false} onChange={() => setNegativeQtyAllowed(false)} />
                                    <span>No</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Show Item In Purchase / Sales */}
                    <div className="flex flex-col gap-2">
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input type="checkbox" className="h-4 w-4" checked={showInPurchase} onChange={(e) => setShowInPurchase(e.target.checked)} />
                            <span>Show Item In Purchase</span>
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input type="checkbox" className="h-4 w-4" checked={showInSales} onChange={(e) => setShowInSales(e.target.checked)} />
                            <span>Show Item In Sales</span>
                        </label>
                    </div>

                    {/* GOODS-ONLY: New MRP & Old MRP */}
                    {!isServiceType && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New MRP</label>
                                <input type="number" value={newMRP} onChange={(e) => setNewMRP(e.target.value)} className={baseInput} placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Old MRP</label>
                                <input type="number" value={oldMRP} onChange={(e) => setOldMRP(e.target.value)} className={baseInput} placeholder="0.00" />
                            </div>
                        </div>
                    )}

                    {/* Purchase Price & Sales Price */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                            <input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className={baseInput} placeholder="0.00" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sales Price</label>
                            <input type="number" value={salesPrice} onChange={(e) => setSalesPrice(e.target.value)} className={baseInput} placeholder="0.00" />
                        </div>
                    </div>

                    {/* GOODS-ONLY: Manage stock */}
                    {!isServiceType && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Manage stock</p>
                            <div className="flex items-center gap-4 text-sm">
                                {["Normal", "Batch wise", "Lot wise"].map((option) => (
                                    <label key={option} className="inline-flex items-center gap-2">
                                        <input type="radio" className="h-4 w-4" checked={manageStock === option} onChange={() => setManageStock(option)} />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* GOODS-ONLY: SKU / Goods Code */}
                    {!isServiceType && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SKU / Goods Code</label>
                            <input type="text" value={skuCode} onChange={(e) => setSkuCode(e.target.value)} className={baseInput} placeholder="Enter SKU" />
                        </div>
                    )}

                    {/* GOODS-ONLY: Opening Stock fields */}
                    {!isServiceType && (
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Qty</label>
                                <input type="number" value={openingStockQty} onChange={(e) => setOpeningStockQty(e.target.value)} className={baseInput} placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Rate</label>
                                <input type="number" value={openingStockRate} onChange={(e) => setOpeningStockRate(e.target.value)} className={baseInput} placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Value</label>
                                <input type="number" value={openingStockValue} onChange={(e) => setOpeningStockValue(e.target.value)} className={baseInput} placeholder="0.00" />
                            </div>
                        </div>
                    )}

                    {/* GOODS-ONLY: Cess Enable */}
                    {!isServiceType && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Cess Enable</p>
                            <div className="flex items-center gap-4 text-sm">
                                <label className="inline-flex items-center gap-2">
                                    <input type="radio" className="h-4 w-4" checked={cessEnable === true} onChange={() => setCessEnable(true)} />
                                    <span>Yes</span>
                                </label>
                                <label className="inline-flex items-center gap-2">
                                    <input type="radio" className="h-4 w-4" checked={cessEnable === false} onChange={() => setCessEnable(false)} />
                                    <span>No</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* STATUS */}
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Status</p>
                        <div className="flex items-center gap-4 text-sm">
                            <label className="inline-flex items-center gap-2">
                                <input type="radio" className="h-4 w-4" checked={status === "Active"} onChange={() => setStatus("Active")} />
                                <span>Active</span>
                            </label>
                            <label className="inline-flex items-center gap-2">
                                <input type="radio" className="h-4 w-4" checked={status === "Inactive"} onChange={() => setStatus("Inactive")} />
                                <span>Inactive</span>
                            </label>
                        </div>
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
