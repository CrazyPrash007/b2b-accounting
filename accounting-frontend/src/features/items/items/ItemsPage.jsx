// ItemsPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useItem from "./hooks/useItem";
import ItemTable from "./ItemTable";
import { getCurrentCompany } from "../../../services/companyContextAccessor";
import { exportTableToExcel } from "../../../utils/excelExport";
import { authFetch, API_BASE_URL } from "../../../services/apiClient";

/**
 * Helper to safely parse backend JSON that might be { success, data, meta } or raw array
 */
async function parseJsonSafe(res) {
    const body = await res.json().catch(() => null);
    if (!body) return null;
    if (typeof body === "object" && Object.prototype.hasOwnProperty.call(body, "data")) return body.data;
    return body;
}

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

    // Validation
    const [errorName, setErrorName] = useState("");

    // Lists from backend
    const [unitsList, setUnitsList] = useState([]); // array of aliasName strings
    const [brandsList, setBrandsList] = useState([]); // array of brandName strings
    const [categoriesList, setCategoriesList] = useState([]); // array of { name, subcategories[] }
    const [gstList, setGstList] = useState([]); // array of rate strings

    const [listsLoading, setListsLoading] = useState(false);
    const [listsError, setListsError] = useState(null);
    const navigate = useNavigate();

    const isEditMode = !!editData;

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setItemName(editData.itemName ?? editData.name ?? "");
                setDescription(editData.description ?? "");
                setCategory(editData.category ?? "");
                setSubCategory(editData.subCategory ?? "");
                setBrandName(editData.brandName ?? "");
                setGstRate(editData.gstRate ?? (editData.gstRate === 0 ? "0" : ""));
                setHsnNo(editData.hsnNo ?? "");
                setItemType(editData.itemType ?? editData.type ?? "Goods");
                setUnit(editData.unit ?? "");
                setBuyPrice(editData.buyPrice ?? "");
                setSellPrice(editData.sellPrice ?? "");
                setOpeningStock(editData.openingStock ?? "");
                setMinStock(editData.minStock ?? "");
                setOpeningDate(editData.openingDate ?? new Date().toISOString().split("T")[0]);
            } else {
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
                setOpeningDate(new Date().toISOString().split("T")[0]);
            }
            setErrorName("");

            // fetch suggestion lists if not already fetched
            if (!unitsList.length || !brandsList.length || !categoriesList.length || !gstList.length) {
                fetchLists();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, editData]);

    // Use API base URL from environment variable
    const API_BASE = API_BASE_URL;

    const fetchLists = async () => {
        setListsLoading(true);
        setListsError(null);
        try {
            const companyId = getCurrentCompany();
            const [unitsRes, catsRes, brandsRes, gstRes] = await Promise.allSettled([
                authFetch(`${API_BASE}/api/unit?accountCompanyName=${companyId}`),
                authFetch(`${API_BASE}/api/item-categories?accountCompanyName=${companyId}`),
                authFetch(`${API_BASE}/api/brand?accountCompanyName=${companyId}`),
                authFetch(`${API_BASE}/api/gst?accountCompanyName=${companyId}`),
            ]);

            const parseSettled = async (s) => {
                if (s.status !== "fulfilled") return [];
                const r = s.value;
                if (!r) return [];
                if (!r.ok) {
                    const txt = await r.text().catch(() => "");
                    console.warn("Non-OK response", r.status, txt);
                    return [];
                }
                const parsed = await parseJsonSafe(r);
                return Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
            };

            const unitsData = await parseSettled(unitsRes);
            const catsData = await parseSettled(catsRes);
            const brandsData = await parseSettled(brandsRes);
            const gstData = await parseSettled(gstRes);

            // normalize same as before
            const unitsNormalized = unitsData
                .map((u) => u && (u.aliasName || u.fullName || u.name || (typeof u === "string" ? u : null)))
                .filter(Boolean);
            const brandsNormalized = brandsData
                .map((b) => b && (b.brandName || b.name || (typeof b === "string" ? b : null)))
                .filter(Boolean);
            const catsNormalized = (Array.isArray(catsData) ? catsData : [])
                .map((c) => {
                    if (!c) return null;
                    if (typeof c === "string") return { name: c, subcategories: [] };
                    return { name: c.name || c.title || "", subcategories: Array.isArray(c.subcategories) ? c.subcategories : [] };
                })
                .filter((c) => c && c.name);
            const gstNormalized = (Array.isArray(gstData) ? gstData : [])
                .map((g) => {
                    if (!g) return null;
                    if (typeof g === "number") return String(g);
                    if (typeof g === "string") return g;
                    if (g.rate != null) return String(g.rate);
                    return null;
                })
                .filter(Boolean);
            const gstFinal = gstNormalized.length ? Array.from(new Set(gstNormalized)) : ["0", "5", "12", "18", "28"];

            setUnitsList(Array.from(new Set(unitsNormalized)));
            setBrandsList(Array.from(new Set(brandsNormalized)));
            setCategoriesList(catsNormalized);
            setGstList(gstFinal);
        } catch (err) {
            console.error("Failed to fetch suggestion lists", err);
            setListsError(err);
        } finally {
            setListsLoading(false);
        }
    };


    // active subcategories for selected category
    const activeSubcategories = useRef([]);
    useEffect(() => {
        const found = categoriesList.find((c) => c && (c.name === category || c.name?.toLowerCase() === (category || "").toLowerCase()));
        activeSubcategories.current = found && Array.isArray(found.subcategories) ? found.subcategories : [];
        if (category && activeSubcategories.current.length && !activeSubcategories.current.includes(subCategory)) {
            setSubCategory("");
        }
    }, [category, categoriesList, subCategory]);

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
            name: trimmedName,
            description: description.trim(),
            category: category.trim(),
            subCategory: subCategory.trim(),
            brandName: brandName.trim(),
            gstRate: gstRate || "",
            hsnNo: hsnNo.trim(),
            itemType,
            type: itemType,
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
        if (e.target === e.currentTarget) onClose();
    };

    // Enter-to-next-field handling
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const form = e.target.closest("[data-form-container]");
            if (!form) return;
            const inputs = Array.from(form.querySelectorAll("input, select, textarea"));
            const currentIndex = inputs.indexOf(e.target);
            if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
                inputs[currentIndex + 1].focus();
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleBackdropClick}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 rounded-t-lg" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                    <h3 className="text-base font-semibold text-white">{isEditMode ? "Edit Item" : "New Item"}</h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 overflow-y-auto flex-1" data-form-container onKeyDown={handleKeyDown}>
                    {/* Row 1 */}
                    <div className="grid grid-cols-4 gap-3 mb-3">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name<span className="text-red-500">*</span></label>
                            <input type="text" value={itemName} onChange={(e) => { setItemName(e.target.value); if (errorName) setErrorName(""); }} className={baseInput + (errorName ? " border-red-500" : "")} placeholder="Enter Item Name" autoFocus />
                            {errorName && <p className="mt-1 text-xs text-red-500">{errorName}</p>}
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={baseInput} placeholder="Enter Description" maxLength={500} />
                        </div>
                    </div>

                    {/* Row 2: Type, Unit, Category, SubCategory */}
                    <div className="grid grid-cols-4 gap-3 mb-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
                            <select value={itemType} onChange={(e) => setItemType(e.target.value)} className={baseInput}>
                                <option value="Goods">Goods</option>
                                <option value="Service">Service</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                            <select
                                value={unit}
                                onChange={(e) => {
                                    if (e.target.value === "__ADD_NEW__") {
                                        navigate("/unit");
                                    } else {
                                        setUnit(e.target.value);
                                    }
                                }}
                                className={baseInput}
                            >
                                <option value="">-- Select Unit --</option>
                                {unitsList.map((u, idx) => (
                                    <option key={`unit-${idx}`} value={u}>
                                        {u}
                                    </option>
                                ))}
                                <option value="__ADD_NEW__" style={{ color: '#2563eb', fontWeight: '600' }}>+ Add New Unit</option>
                            </select>
                        </div>


                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                value={category}
                                onChange={(e) => {
                                    if (e.target.value === "__ADD_NEW__") {
                                        navigate("/item-category");
                                    } else {
                                        setCategory(e.target.value);
                                        setSubCategory(""); // Reset subcategory when category changes
                                    }
                                }}
                                className={baseInput}
                            >
                                <option value="">-- Select Category --</option>
                                {categoriesList.map((c, idx) => (
                                    <option key={`cat-${idx}`} value={c.name}>
                                        {c.name}
                                    </option>
                                ))}
                                <option value="__ADD_NEW__" style={{ color: '#2563eb', fontWeight: '600' }}>+ Add New Category</option>
                            </select>
                        </div>


                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Category</label>
                            <select
                                value={subCategory}
                                onChange={(e) => setSubCategory(e.target.value)}
                                disabled={!category}
                                className={`${baseInput} ${!category ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            >
                                <option value="">{!category ? "Select a category first" : "-- Select Sub-Category --"}</option>
                                {category && categoriesList
                                    .find(c => c.name === category)?.subcategories
                                    ?.filter(Boolean)
                                    .map((s, idx) => (
                                        <option key={`sub-${idx}`} value={s}>
                                            {s}
                                        </option>
                                    ))}
                            </select>
                        </div>

                    </div>

                    {/* Row 3: Brand, HSN, GST, Buy Price */}
                    <div className="grid grid-cols-4 gap-3 mb-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                            <select
                                value={brandName}
                                onChange={(e) => {
                                    if (e.target.value === "__ADD_NEW__") {
                                        navigate("/brand");
                                    } else {
                                        setBrandName(e.target.value);
                                    }
                                }}
                                className={baseInput}
                            >
                                <option value="">-- Select Brand --</option>
                                {brandsList.map((b, idx) => (
                                    <option key={`brand-${idx}`} value={b}>
                                        {b}
                                    </option>
                                ))}
                                <option value="__ADD_NEW__" style={{ color: '#2563eb', fontWeight: '600' }}>+ Add New Brand</option>
                            </select>
                        </div>


                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">HSN No</label>
                            <input type="text" value={hsnNo} onChange={(e) => setHsnNo(e.target.value)} className={baseInput} placeholder="Enter HSN Code" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
                            <select
                                value={gstRate}
                                onChange={(e) => {
                                    if (e.target.value === "__ADD_NEW__") {
                                        navigate("/gst");
                                    } else {
                                        setGstRate(e.target.value);
                                    }
                                }}
                                className={baseInput}
                            >
                                <option value="">Select GST Rate</option>
                                {gstList.map((g, idx) => (
                                    <option key={"gst-" + idx} value={String(g)}>
                                        {String(g)}%
                                    </option>
                                ))}
                                <option value="__ADD_NEW__" style={{ color: '#2563eb', fontWeight: '600' }}>+ Add New GST</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Buy Price</label>
                            <input type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} className={baseInput} placeholder="0.00" min="0" step="0.01" />
                        </div>
                    </div>

                    {/* Row 4 */}
                    <div className="grid grid-cols-4 gap-3 mb-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price</label>
                            <input type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} className={baseInput} placeholder="0.00" min="0" step="0.01" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Stock</label>
                            <input type="number" value={openingStock} onChange={(e) => setOpeningStock(e.target.value)} className={baseInput} placeholder="0" min="0" step="1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                            <input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} className={baseInput} placeholder="0" min="0" step="1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Date</label>
                            <input type="date" value={openingDate} onChange={(e) => setOpeningDate(e.target.value)} className={baseInput} />
                        </div>
                    </div>

                    <div className="text-xs text-gray-500 mt-2">
                        {listsLoading ? "Loading suggestions..." : listsError ? "Failed to load suggestions" : "Suggestions loaded"}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                    {isEditMode ? (
                        <button type="button" onClick={() => onDelete && onDelete(editData.id)} className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 transition-colors">Delete</button>
                    ) : <div></div>}
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-100 transition-colors">Cancel</button>
                        <button type="button" onClick={handleSave} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">{isEditMode ? "Update" : "Save"}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * ItemsPage - main page (keeps existing in-memory items flow)
 */
export default function ItemsPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Use server-backed items (rows) and CRUD helpers from your custom hook
    const { rows: items = [], loading, error, reload, create, update, remove } = useItem({ useLocalFallback: true });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

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
            // Try to extract server-side error message (many backends return { success:false, error:{ message } })
            console.error("Failed to save item:", err);

            // 1) axios-like shape: err.response.data
            const serverMsg =
                err?.response?.data?.error?.message ||
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.response?.data ||
                err?.message ||
                "Unknown error";

            // 2) If fetch wrapper threw a Response-like error with body, try to read it (best-effort)
            if (err?.response?.text) {
                try {
                    const txt = await err.response.text();
                    console.error("Server response text:", txt);
                } catch (e) {
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
            // reload list
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

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-semibold text-gray-900">Item Master</h1>
                    <button className="text-gray-400 hover:text-yellow-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    </button>
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

            {/* Table */}
            <ItemTable items={items} onEdit={handleEditItem} />

            {/* Modal */}
            <ItemModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveItem} onDelete={handleDeleteItem} editData={editingItem} />
        </div>
    );
}
