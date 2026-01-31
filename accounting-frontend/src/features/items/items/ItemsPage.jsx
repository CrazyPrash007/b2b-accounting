// ItemsPage.jsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import useItem from "./hooks/useItem";
import ItemTable from "./ItemTable";
import { exportTableToExcel } from "../../../utils/excelExport";
import ItemModal from "./components/ItemModal";
import ItemMovementModal from "./components/ItemMovementModal";

/**
 * ItemsPage - main page for Items management
 */
export default function ItemsPage() {
    const location = useLocation();

    // Use server-backed items (rows) and CRUD helpers from your custom hook
    const { rows: items = [], meta = {}, reload, create, update, remove } = useItem({ useLocalFallback: true });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [showMovementModal, setShowMovementModal] = useState(false);
    const [selectedItemForMovement, setSelectedItemForMovement] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterStock, setFilterStock] = useState("all"); // all, inStock, lowStock, outOfStock
    const [filterGst, setFilterGst] = useState("all"); // all, withGst, withoutGst

    const totalStock = meta.totalStock || 0;
    const negativeStockCount = meta.negativeStockCount || 0;

    // GST classification counts
    const gstCounts = items.reduce((acc, item) => {
        const rate = item.gstRate != null ? Number(item.gstRate) : null;
        if (rate === 0) acc.gst0++;
        else if (rate === 5) acc.gst5++;
        else if (rate === 12) acc.gst12++;
        else if (rate === 18) acc.gst18++;
        else if (rate === 28) acc.gst28++;
        else acc.other++;
        return acc;
    }, { gst0: 0, gst5: 0, gst12: 0, gst18: 0, gst28: 0, other: 0 });

    // Get unique categories from items
    const categories = ["all", ...new Set(items.map(item => item.category).filter(Boolean))];

    // Filter items
    const filteredItems = items.filter(item => {
        // Search filter
        const matchesSearch = !searchTerm ||
            (item.itemName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.hsnNo?.includes(searchTerm));

        // Category filter
        const matchesCategory = filterCategory === "all" || item.category === filterCategory;

        // Stock filter
        const stock = item.openingStock || 0;
        const minStock = item.minStock || 0;
        const matchesStock =
            filterStock === "all" ||
            (filterStock === "inStock" && stock > minStock) ||
            (filterStock === "lowStock" && stock > 0 && stock <= minStock) ||
            (filterStock === "outOfStock" && stock <= 0);

        // GST filter
        const gstRate = item.gstRate != null ? Number(item.gstRate) : null;
        const hasGst = gstRate !== null && gstRate > 0;
        const matchesGst =
            filterGst === "all" ||
            (filterGst === "withGst" && hasGst) ||
            (filterGst === "withoutGst" && !hasGst);

        return matchesSearch && matchesCategory && matchesStock && matchesGst;
    });

    // Handle saved/deleted data from form page (backwards compatibility)
    useEffect(() => {
        if (location.state?.savedItem || location.state?.deletedItemId) {
            // server is source of truth — reload list
            reload();
            // Clear the state so it doesn't retrigger on navigation
            window.history.replaceState({}, document.title);
        }
    }, [location.state, reload]);

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

    const handleSaveItem = async (itemData, isEdit) => {
        // Build normalized payload expected by backend/validator
        const normalized = {
            // ensure canonical required field
            name: (itemData.name || itemData.itemName || "").toString().trim(),
            itemName: (itemData.itemName || itemData.name || "").toString().trim(),
            description: (itemData.description || "").toString().trim(),
            category: (itemData.category || "").toString().trim(),
            subCategory: (itemData.subCategory || "").toString().trim(),
            brandName: (itemData.brandName || "").toString().trim(),

            // coerce numeric fields (backend expects numbers)
            gstRate: itemData.gstRate === "" || itemData.gstRate == null ? null : Number(itemData.gstRate),
            buyPrice: itemData.buyPrice === "" || itemData.buyPrice == null ? 0 : Number(itemData.buyPrice),
            sellPrice: itemData.sellPrice === "" || itemData.sellPrice == null ? 0 : Number(itemData.sellPrice),
            openingStock: itemData.openingStock === "" || itemData.openingStock == null ? 0 : Number(itemData.openingStock),
            minStock: itemData.minStock === "" || itemData.minStock == null ? 0 : Number(itemData.minStock),

            hsnNo: (itemData.hsnNo || "").toString().trim(),
            itemType: (itemData.itemType || itemData.type || "Goods").toString(),
            type: (itemData.type || itemData.itemType || "Goods").toString(),
            unit: (itemData.unit || "").toString().trim(),

            // normalize date -> ISO or undefined/null
            openingDate: itemData.openingDate ? new Date(itemData.openingDate).toISOString() : null,

            // Website visibility & image
            showOnWebsite: itemData.showOnWebsite !== false, // Default to true
            itemImage: (itemData.itemImage || "").toString().trim(),
        };

        // Basic client-side validation before hitting backend
        if (!normalized.name) {
            alert("Item Name is required.");
            return;
        }

        try {
            if (isEdit) {
                const id = itemData.id ?? itemData._id;
                await update(id, normalized);
            } else {
                await create(normalized);
            }

            // success: close modal and reload server state
            setIsModalOpen(false);
            setEditingItem(null);
            reload();
        } catch (err) {
            // Try to extract server-side error message
            console.error("Failed to save item:", err);

            const serverMsg =
                err?.response?.data?.error?.message ||
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.response?.data ||
                err?.message ||
                "Unknown error";

            if (err?.response?.text) {
                try {
                    const txt = await err.response.text();
                    console.error("Server response text:", txt);
                } catch {
                    /* ignore */
                }
            }

            alert(`Save failed: ${serverMsg}`);
        }
    };

    const handleDeleteItem = async (id) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;

        try {
            await remove(id);
            setIsModalOpen(false);
            setEditingItem(null);
            reload();
        } catch (err) {
            console.error("Failed to delete item:", err);
            alert(err?.message || "Failed to delete item — check console for details");
        }
    };

    const handleExportToExcel = () => {
        const columns = [
            { header: 'Item Name', key: 'itemName' },
            { header: 'Description', key: 'description' },
            { header: 'Item Type', key: 'itemType' },
            { header: 'Unit', key: 'unit' },
            { header: 'Category', key: 'category' },
            { header: 'Sub-Category', key: 'subCategory' },
            { header: 'Brand', key: 'brandName' },
            { header: 'HSN No', key: 'hsnNo' },
            { header: 'GST Rate', key: 'gstRate' },
            { header: 'Buy Price', key: 'buyPrice' },
            { header: 'Sell Price', key: 'sellPrice' },
            { header: 'Opening Stock', key: 'openingStock' },
            { header: 'Min Stock', key: 'minStock' },
            { header: 'Opening Date', key: 'openingDate' },
        ];

        const exportData = items.map(item => ({
            itemName: item.itemName || item.name || '-',
            description: item.description || '-',
            itemType: item.itemType || '-',
            unit: item.unit || '-',
            category: item.category || '-',
            subCategory: item.subCategory || '-',
            brandName: item.brandName || '-',
            hsnNo: item.hsnNo || '-',
            gstRate: item.gstRate != null ? `${item.gstRate}%` : '-',
            buyPrice: item.buyPrice != null ? `₹${item.buyPrice}` : '-',
            sellPrice: item.sellPrice != null ? `₹${item.sellPrice}` : '-',
            openingStock: item.openingStock != null ? item.openingStock : '-',
            minStock: item.minStock != null ? item.minStock : '-',
            openingDate: item.openingDate || '-',
        }));

        exportTableToExcel(exportData, columns, 'Items_Report', 'Items');
    };

    // Toggle website visibility for an item
    const handleToggleWebsite = async (item) => {
        try {
            const newValue = item.showOnWebsite === false ? true : false;
            await update(item.id || item._id, { showOnWebsite: newValue });
            reload();
        } catch (err) {
            console.error("Failed to toggle website visibility:", err);
            alert("Failed to update website visibility");
        }
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Show Item Movement History when selected (replaces table view like Party History) */}
            {showMovementModal && selectedItemForMovement ? (
                <ItemMovementModal
                    isOpen={showMovementModal}
                    onClose={() => {
                        setShowMovementModal(false);
                        setSelectedItemForMovement(null);
                    }}
                    item={selectedItemForMovement}
                />
            ) : (
                <>
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-semibold text-gray-900">Item Master</h1>
                            <button className="text-gray-400 hover:text-yellow-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                            </button>
                            {totalStock !== 0 && (
                                <div className="px-3 py-1 rounded-md text-sm font-semibold bg-blue-100 text-blue-800">
                                    Total Stock: {totalStock.toFixed(2)}
                                </div>
                            )}
                            {negativeStockCount > 0 && (
                                <div className="px-3 py-1 rounded-md text-sm font-semibold bg-red-100 text-red-800">
                                    {negativeStockCount} Item{negativeStockCount > 1 ? 's' : ''} with Negative Stock
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExportToExcel}
                                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm"
                                title="Export to Excel"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export to Excel
                            </button>
                            <button type="button" className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium" onClick={handleCreateItem}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Create Item
                            </button>
                        </div>
                    </div>

                    {/* GST Classification Badges */}
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50">
                        <span className="text-xs font-medium text-gray-600">GST Classifications:</span>
                        {gstCounts.gst0 > 0 && (
                            <div className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                                0%: {gstCounts.gst0}
                            </div>
                        )}
                        {gstCounts.gst5 > 0 && (
                            <div className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                                5%: {gstCounts.gst5}
                            </div>
                        )}
                        {gstCounts.gst12 > 0 && (
                            <div className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                                12%: {gstCounts.gst12}
                            </div>
                        )}
                        {gstCounts.gst18 > 0 && (
                            <div className="px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-800">
                                18%: {gstCounts.gst18}
                            </div>
                        )}
                        {gstCounts.gst28 > 0 && (
                            <div className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">
                                28%: {gstCounts.gst28}
                            </div>
                        )}
                        {gstCounts.other > 0 && (
                            <div className="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                                Other: {gstCounts.other}
                            </div>
                        )}
                    </div>

                    {/* Filters Toolbar */}
                    <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            {/* Search */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by name or HSN..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            {/* Category Filter */}
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">All Categories</option>
                                {categories.filter(c => c !== "all").map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            {/* Stock Filter */}
                            <select
                                value={filterStock}
                                onChange={(e) => setFilterStock(e.target.value)}
                                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">All Stock Levels</option>
                                <option value="inStock">In Stock</option>
                                <option value="lowStock">Low Stock</option>
                                <option value="outOfStock">Out of Stock</option>
                            </select>

                            {/* GST Filter */}
                            <select
                                value={filterGst}
                                onChange={(e) => setFilterGst(e.target.value)}
                                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">All GST</option>
                                <option value="withGst">With GST</option>
                                <option value="withoutGst">Without GST</option>
                            </select>

                            {/* Results count */}
                            <span className="text-sm text-gray-600">
                                {filteredItems.length} of {items.length} items
                            </span>
                        </div>
                    </div>

                    {/* Table */}
                    <ItemTable
                        items={filteredItems}
                        onEdit={handleEditItem}
                        onViewMovement={(item) => {
                            setSelectedItemForMovement(item);
                            setShowMovementModal(true);
                        }}
                        onToggleWebsite={handleToggleWebsite}
                    />
                </>
            )}

            {/* Modal with Backdrop */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCloseModal}>
                    <ItemModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveItem} onDelete={handleDeleteItem} editData={editingItem} />
                </div>
            )}
        </div>
    );
}
