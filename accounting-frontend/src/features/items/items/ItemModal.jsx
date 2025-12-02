// ItemModal.jsx
import React, { useState, useEffect } from "react";

/**
 * ItemModal - Right-side drawer for creating/editing an item
 * Shows different fields based on type: Goods vs Service/Additional Service
 */
export default function ItemModal({ isOpen, initialItem, onSave, onDelete, onClose }) {
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

    const isServiceType = type === "Service" || type === "Additional Service";

    // Reset form when initialItem or isOpen changes
    useEffect(() => {
        if (!initialItem) {
            setType("Goods");
            setName("");
            setDescription("");
            setUnit("");
            setShowInPurchase(true);
            setShowInSales(true);
            setPurchasePrice("");
            setSalesPrice("");
            setStatus("Active");
            // Goods-only
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
        } else {
            setType(initialItem.type ?? "Goods");
            setName(initialItem.name ?? "");
            setDescription(initialItem.description ?? "");
            setUnit(initialItem.unit ?? "");
            setShowInPurchase(initialItem.showInPurchase ?? true);
            setShowInSales(initialItem.showInSales ?? true);
            setPurchasePrice(initialItem.purchasePrice ?? "");
            setSalesPrice(initialItem.salesPrice ?? "");
            setStatus(initialItem.status ?? "Active");
            // Goods-only
            setGroup(initialItem.group ?? "");
            setCategory(initialItem.category ?? "");
            setNegativeQtyAllowed(initialItem.negativeQtyAllowed ?? true);
            setNewMRP(initialItem.newMRP ?? "");
            setOldMRP(initialItem.oldMRP ?? "");
            setManageStock(initialItem.manageStock ?? "Normal");
            setSkuCode(initialItem.skuCode ?? "");
            setOpeningStockQty(initialItem.openingStockQty ?? "");
            setOpeningStockRate(initialItem.openingStockRate ?? "");
            setOpeningStockValue(initialItem.openingStockValue ?? "");
            setCessEnable(initialItem.cessEnable ?? false);
        }
        setErrorName("");
    }, [initialItem, isOpen]);

    const baseInput =
        "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm " +
        "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";

    const handleSave = () => {
        setErrorName("");

        const trimmedName = name.trim();

        if (!trimmedName) {
            setErrorName("Is required!");
            return;
        }

        const payload = {
            id: initialItem?.id ?? String(Date.now()),
            type,
            name: trimmedName,
            description: description.trim(),
            unit: unit.trim(),
            showInPurchase,
            showInSales,
            purchasePrice: purchasePrice || "",
            salesPrice: salesPrice || "",
            status,
            // Goods-only fields (stored for all types but only shown for Goods)
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

        onSave(payload);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div className="ml-auto w-full sm:w-[40%] sm:min-w-[500px] bg-white shadow-xl h-full flex flex-col relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {initialItem ? "Edit Item" : "New Item"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Body (scrollable) */}
                <div className="px-6 py-4 space-y-6 overflow-y-auto flex-1">
                    {/* TYPE SWITCH */}
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Type</p>
                        <div className="flex gap-3">
                            {["Goods", "Service", "Additional Service"].map((option) => {
                                const active = type === option;
                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => setType(option)}
                                        className={
                                            "flex-1 rounded-md border px-3 py-2 text-sm font-medium " +
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

                    {/* NAME (Required for all types) */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">
                            Name<span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={
                                baseInput +
                                (errorName
                                    ? " border-red-500 focus:border-red-500 focus:ring-red-500"
                                    : "")
                            }
                            placeholder="Enter Name"
                        />
                        {errorName && (
                            <p className="mt-1 text-xs text-red-600">{errorName}</p>
                        )}
                    </div>

                    {/* DESCRIPTION (All types) */}
                    <div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">
                                Description
                            </label>
                            <span className="text-xs text-gray-400">3000</span>
                        </div>
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
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Group</label>
                                <input
                                    type="text"
                                    value={group}
                                    onChange={(e) => setGroup(e.target.value)}
                                    className={baseInput}
                                    placeholder="None of the list"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Category</label>
                                <input
                                    type="text"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className={baseInput}
                                    placeholder="None of the above"
                                />
                            </div>
                        </div>
                    )}

                    {/* UNIT */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Unit</label>
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
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">
                                Negative Qty Allowed
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                                <label className="inline-flex items-center gap-2">
                                    <input
                                        type="radio"
                                        className="h-4 w-4"
                                        checked={negativeQtyAllowed === true}
                                        onChange={() => setNegativeQtyAllowed(true)}
                                    />
                                    <span>Yes</span>
                                </label>
                                <label className="inline-flex items-center gap-2">
                                    <input
                                        type="radio"
                                        className="h-4 w-4"
                                        checked={negativeQtyAllowed === false}
                                        onChange={() => setNegativeQtyAllowed(false)}
                                    />
                                    <span>No</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Show Item In Purchase / Sales (All types) */}
                    <div className="flex flex-col gap-2">
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={showInPurchase}
                                onChange={(e) => setShowInPurchase(e.target.checked)}
                            />
                            <span>Show Item In Purchase</span>
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={showInSales}
                                onChange={(e) => setShowInSales(e.target.checked)}
                            />
                            <span>Show Item In Sales</span>
                        </label>
                    </div>

                    {/* GOODS-ONLY: New MRP & Old MRP */}
                    {!isServiceType && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium text-gray-700">New MRP</label>
                                <input
                                    type="number"
                                    value={newMRP}
                                    onChange={(e) => setNewMRP(e.target.value)}
                                    className={baseInput}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Old MRP</label>
                                <input
                                    type="number"
                                    value={oldMRP}
                                    onChange={(e) => setOldMRP(e.target.value)}
                                    className={baseInput}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    )}

                    {/* Purchase Price & Sales Price (All types) */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Purchase Price
                            </label>
                            <input
                                type="number"
                                value={purchasePrice}
                                onChange={(e) => setPurchasePrice(e.target.value)}
                                className={baseInput}
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Sales Price
                            </label>
                            <input
                                type="number"
                                value={salesPrice}
                                onChange={(e) => setSalesPrice(e.target.value)}
                                className={baseInput}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* GOODS-ONLY: Manage stock */}
                    {!isServiceType && (
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">Manage stock</p>
                            <div className="flex items-center gap-4 text-sm">
                                {["Normal", "Batch wise", "Lot wise"].map((option) => (
                                    <label key={option} className="inline-flex items-center gap-2">
                                        <input
                                            type="radio"
                                            className="h-4 w-4"
                                            checked={manageStock === option}
                                            onChange={() => setManageStock(option)}
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* GOODS-ONLY: SKU / Goods Code */}
                    {!isServiceType && (
                        <div>
                            <label className="text-sm font-medium text-gray-700">SKU / Goods Code</label>
                            <input
                                type="text"
                                value={skuCode}
                                onChange={(e) => setSkuCode(e.target.value)}
                                className={baseInput}
                                placeholder="Enter product or SKU here"
                            />
                        </div>
                    )}

                    {/* GOODS-ONLY: Opening Stock fields */}
                    {!isServiceType && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Opening Stock Qty</label>
                                <input
                                    type="number"
                                    value={openingStockQty}
                                    onChange={(e) => setOpeningStockQty(e.target.value)}
                                    className={baseInput}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Opening Stock Rate</label>
                                <input
                                    type="number"
                                    value={openingStockRate}
                                    onChange={(e) => setOpeningStockRate(e.target.value)}
                                    className={baseInput}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Opening Stock Value</label>
                                <input
                                    type="number"
                                    value={openingStockValue}
                                    onChange={(e) => setOpeningStockValue(e.target.value)}
                                    className={baseInput}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    )}

                    {/* GOODS-ONLY: Cess Enable */}
                    {!isServiceType && (
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">Cess Enable</p>
                            <div className="flex items-center gap-4 text-sm">
                                <label className="inline-flex items-center gap-2">
                                    <input
                                        type="radio"
                                        className="h-4 w-4"
                                        checked={cessEnable === true}
                                        onChange={() => setCessEnable(true)}
                                    />
                                    <span>Yes</span>
                                </label>
                                <label className="inline-flex items-center gap-2">
                                    <input
                                        type="radio"
                                        className="h-4 w-4"
                                        checked={cessEnable === false}
                                        onChange={() => setCessEnable(false)}
                                    />
                                    <span>No</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* STATUS (All types) */}
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700">Status</p>
                        <div className="flex items-center gap-4 text-sm">
                            <label className="inline-flex items-center gap-2">
                                <input
                                    type="radio"
                                    className="h-4 w-4"
                                    checked={status === "Active"}
                                    onChange={() => setStatus("Active")}
                                />
                                <span>Active</span>
                            </label>
                            <label className="inline-flex items-center gap-2">
                                <input
                                    type="radio"
                                    className="h-4 w-4"
                                    checked={status === "Inactive"}
                                    onChange={() => setStatus("Inactive")}
                                />
                                <span>Inactive</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 bg-slate-50">
                    {initialItem ? (
                        <button
                            type="button"
                            className="px-4 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50"
                            onClick={() => {
                                if (window.confirm("Delete this item?")) {
                                    onDelete(initialItem.id);
                                }
                            }}
                        >
                            Delete
                        </button>
                    ) : (
                        <div></div>
                    )}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            className="px-4 py-2 text-slate-600 hover:text-slate-800 border border-slate-300 rounded hover:bg-slate-100"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            onClick={handleSave}
                        >
                            {initialItem ? "Update" : "Save"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
