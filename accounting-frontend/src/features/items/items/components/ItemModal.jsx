// ItemModal.jsx - Extracted modal component for reusability
import React, { useState, useEffect, useRef } from "react";
import { useModal } from "../../../../hooks/useModal";
import { authFetch, API_BASE_URL } from "../../../../services/apiClient";
import { getCurrentCompany } from "../../../../services/companyContextAccessor";

// Import nested modals
import UnitModal from "../../unit/components/UnitModal";
import CategoryModal from "../../item-category/components/CategoryModal";
import BrandModal from "../../../account/brand/components/BrandModal";
import GstModal from "../../gst/components/GstModal";

/**
 * Helper to safely parse backend JSON that might be { success, data, meta } or raw array
 */
async function parseJsonSafe(res) {
    const body = await res.json().catch(() => null);
    if (!body) return null;
    if (typeof body === "object" && Object.prototype.hasOwnProperty.call(body, "data")) return body.data;
    return body;
}

export default function ItemModal({ isOpen, onClose, onSave, onDelete, editData }) {
    const { openModal, closeModal } = useModal();
    const API_BASE = API_BASE_URL;

    // Global search state
    const [globalSearchQuery, setGlobalSearchQuery] = useState("");
    const [globalSearchResults, setGlobalSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const globalSearchRef = useRef(null);
    const searchDropdownRef = useRef(null);

    // MasterItem linkage
    const [masterItemId, setMasterItemId] = useState(null);
    const [isFromMaster, setIsFromMaster] = useState(false);

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
    // Website visibility & image fields
    const [showOnWebsite, setShowOnWebsite] = useState(true);
    const [itemImage, setItemImage] = useState("");
    const [itemImageMimeType, setItemImageMimeType] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const imageInputRef = useRef(null);

    // Validation
    const [errorName, setErrorName] = useState("");

    // Multi-select state
    const [selectedItems, setSelectedItems] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);
    const [expandedItemIndex, setExpandedItemIndex] = useState(null);

    // Lists from backend
    const [unitsList, setUnitsList] = useState([]);
    const [brandsList, setBrandsList] = useState([]);
    const [categoriesList, setCategoriesList] = useState([]);
    const [gstList, setGstList] = useState([]);
    const [gstListFromDb, setGstListFromDb] = useState(false); // Track if GST list is from actual DB entries
    const [listsLoading, setListsLoading] = useState(false);
    const [listsError, setListsError] = useState(null);

    const isEditMode = !!editData;
    const lastEditDataRef = useRef(null);
    const itemNameRef = useRef(null);

    const fetchLists = async () => {
        setListsLoading(true);
        setListsError(null);
        try {
            const companyId = getCurrentCompany();
            console.log('📦 Fetching lists for company:', companyId);

            const [unitsRes, catsRes, brandsRes, gstRes] = await Promise.allSettled([
                authFetch(`${API_BASE}/api/unit?accountCompanyName=${companyId}`),
                authFetch(`${API_BASE}/api/item-categories?accountCompanyName=${companyId}`),
                authFetch(`${API_BASE}/api/brand?accountCompanyName=${companyId}`),
                authFetch(`${API_BASE}/api/gst?accountCompanyName=${companyId}`),
            ]);

            const parseSettled = async (s, name) => {
                if (s.status !== "fulfilled") {
                    console.warn(`⚠️ ${name} fetch failed:`, s.reason);
                    return [];
                }
                const r = s.value;
                if (!r || !r.ok) {
                    console.warn(`⚠️ ${name} response not ok:`, r?.status);
                    return [];
                }
                const parsed = await parseJsonSafe(r);
                console.log(`✅ ${name} data:`, parsed);
                return Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
            };

            const unitsData = await parseSettled(unitsRes, 'Units');
            const catsData = await parseSettled(catsRes, 'Categories');
            const brandsData = await parseSettled(brandsRes, 'Brands');
            const gstData = await parseSettled(gstRes, 'GST');

            const unitsNormalized = unitsData.map((u) => u && (u.aliasName || u.fullName || u.name || (typeof u === "string" ? u : null))).filter(Boolean);
            const brandsNormalized = brandsData.map((b) => b && (b.brandName || b.name || (typeof b === "string" ? b : null))).filter(Boolean);
            const catsNormalized = (Array.isArray(catsData) ? catsData : []).map((c) => {
                if (!c) return null;
                if (typeof c === "string") return { name: c, subcategories: [] };
                return { name: c.name || c.title || "", subcategories: Array.isArray(c.subcategories) ? c.subcategories : [] };
            }).filter((c) => c && c.name);
            const gstNormalized = (Array.isArray(gstData) ? gstData : []).map((g) => {
                if (!g) return null;
                if (typeof g === "number") return String(g);
                if (typeof g === "string") return g;
                if (g.rate != null) return String(g.rate);
                return null;
            }).filter(Boolean);
            const hasDbGstEntries = gstNormalized.length > 0;
            const gstFinal = hasDbGstEntries ? Array.from(new Set(gstNormalized)) : ["0", "5", "12", "18", "28"];

            console.log('📋 Normalized lists:', { units: unitsNormalized, brands: brandsNormalized, categories: catsNormalized, gst: gstFinal, gstFromDb: hasDbGstEntries });

            setUnitsList(Array.from(new Set(unitsNormalized)));
            setBrandsList(Array.from(new Set(brandsNormalized)));
            setCategoriesList(catsNormalized);
            setGstList(gstFinal);
            setGstListFromDb(hasDbGstEntries);
        } catch (err) {
            console.error("❌ Failed to fetch suggestion lists", err);
            setListsError(err);
        } finally {
            setListsLoading(false);
        }
    };

    // Global search for items across all users
    useEffect(() => {
        if (!globalSearchQuery || globalSearchQuery.trim().length < 2) {
            setGlobalSearchResults([]);
            setShowSearchDropdown(false);
            return;
        }

        const debounceTimer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await authFetch(`${API_BASE}/api/items/global-search?q=${encodeURIComponent(globalSearchQuery.trim())}&limit=15`);
                if (res && res.ok) {
                    const data = await parseJsonSafe(res);
                    setGlobalSearchResults(Array.isArray(data) ? data : []);
                    setShowSearchDropdown(true);
                }
            } catch (err) {
                console.error("Global search failed:", err);
                setGlobalSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [globalSearchQuery]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                searchDropdownRef.current &&
                !searchDropdownRef.current.contains(event.target) &&
                globalSearchRef.current &&
                !globalSearchRef.current.contains(event.target)
            ) {
                setShowSearchDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle selecting an item from global search (MasterItem catalog)
    const handleSelectGlobalItem = async (selectedItem) => {
        const companyId = getCurrentCompany();

        // Fill the form with selected MasterItem's details
        setItemName(selectedItem.itemName || "");
        setDescription(selectedItem.description || "");
        setItemType(selectedItem.itemType || "Goods");
        setBrandName(selectedItem.brandName || "");
        if (selectedItem.category) setCategory(selectedItem.category);

        // Set MasterItem linkage
        setMasterItemId(selectedItem.masterItemId || null);
        setIsFromMaster(true);

        // Set image if available
        if (selectedItem.itemImage) {
            setItemImage(selectedItem.itemImage);
            setItemImageMimeType(selectedItem.itemImageMimeType || "");
            setImagePreview(selectedItem.itemImage);
        }

        // Auto-create missing entries in respective tables
        const createIfMissing = async (endpoint, field, value, payloadKey) => {
            if (!value || value.trim() === '') return;
            const trimmed = value.trim();

            // Check if already exists in current list
            // For GST, only check against DB entries, not fallback values
            let exists = false;
            if (field === 'unit') {
                exists = unitsList.some(u => u.toLowerCase() === trimmed.toLowerCase());
            } else if (field === 'brand') {
                exists = brandsList.some(b => b.toLowerCase() === trimmed.toLowerCase());
            } else if (field === 'gst') {
                // Only consider it "exists" if we have actual DB entries and the rate is in that list
                exists = gstListFromDb && gstList.some(g => String(g) === String(trimmed));
            }

            if (!exists) {
                try {
                    const payload = { accountCompanyName: companyId };
                    if (field === 'unit') {
                        payload.aliasName = trimmed;
                        payload.fullName = trimmed;
                    } else if (field === 'brand') {
                        payload.brandName = trimmed;
                    } else if (field === 'gst') {
                        payload.rate = Number(trimmed);
                    }

                    const res = await authFetch(`${API_BASE}/api/${endpoint}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (res && res.ok) {
                        console.log(`✅ Auto-created ${field}:`, trimmed);
                    }
                } catch (err) {
                    console.warn(`Could not auto-create ${field}:`, err);
                }
            }
        };

        // Create missing entries
        await Promise.all([
            createIfMissing('unit', 'unit', selectedItem.unit),
            createIfMissing('brand', 'brand', selectedItem.brandName),
            createIfMissing('gst', 'gst', selectedItem.gstRate != null ? String(selectedItem.gstRate) : null)
        ]);

        // Refresh lists to include new entries
        await fetchLists();

        // Clear search
        setGlobalSearchQuery("");
        setGlobalSearchResults([]);
        setShowSearchDropdown(false);
    };

    // Helper: get current form data as an object
    const getFormData = () => ({
        itemName: itemName.trim(),
        description: description.trim(),
        category: category.trim(),
        subCategory: subCategory.trim(),
        brandName: brandName.trim(),
        gstRate: gstRate || "",
        hsnNo: hsnNo.trim(),
        itemType,
        unit: unit.trim(),
        buyPrice: buyPrice || "",
        sellPrice: sellPrice || "",
        openingStock: openingStock || "",
        minStock: minStock || "",
        openingDate: openingDate || new Date().toISOString().split("T")[0],
        showOnWebsite,
        itemImage,
        itemImageMimeType,
        // MasterItem linkage
        masterItemId: masterItemId || undefined,
        isFromMaster: isFromMaster || false,
    });

    // Helper: reset form to empty
    const resetForm = () => {
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
        setShowOnWebsite(true);
        setItemImage("");
        setItemImageMimeType("");
        setImageFile(null);
        setImagePreview("");
        setErrorName("");
        setEditingIndex(null);
        setMasterItemId(null);
        setIsFromMaster(false);
    };

    // Helper: fill form from an item object
    const fillFormWithItem = (item) => {
        setItemName(item.itemName || "");
        setDescription(item.description || "");
        setCategory(item.category || "");
        setSubCategory(item.subCategory || "");
        setBrandName(item.brandName || "");
        setGstRate(item.gstRate != null ? String(item.gstRate) : "");
        setHsnNo(item.hsnNo || "");
        setItemType(item.itemType || "Goods");
        setUnit(item.unit || "");
        setBuyPrice(item.buyPrice || "");
        setSellPrice(item.sellPrice || "");
        setOpeningStock(item.openingStock || "");
        setMinStock(item.minStock || "");
        setOpeningDate(item.openingDate || new Date().toISOString().split("T")[0]);
        setShowOnWebsite(item.showOnWebsite !== false);
        setItemImage(item.itemImage || "");
        setItemImageMimeType(item.itemImageMimeType || "");
        setImagePreview(item.itemImage || "");
        // Restore MasterItem linkage if present
        setMasterItemId(item.masterItemId || null);
        setIsFromMaster(item.isFromMaster || false);
    };

    // Add current form to batch list
    const handleAddToList = () => {
        setErrorName("");
        const trimmedName = itemName.trim();
        if (!trimmedName) {
            setErrorName("Item name is required to add to list");
            return;
        }

        const formData = getFormData();

        // Check for duplicate in list
        const existsInList = selectedItems.some(
            (item, idx) => idx !== editingIndex &&
                item.itemName.toLowerCase() === formData.itemName.toLowerCase()
        );
        if (existsInList) {
            alert("This item is already in the list");
            return;
        }

        if (editingIndex !== null) {
            const updated = [...selectedItems];
            updated[editingIndex] = formData;
            setSelectedItems(updated);
            setEditingIndex(null);
        } else {
            setSelectedItems([...selectedItems, formData]);
        }
        resetForm();
    };

    // Edit an item from the batch list (loads into main form)
    const handleEditFromList = (index) => {
        const item = selectedItems[index];
        fillFormWithItem(item);
        setEditingIndex(index);
        setExpandedItemIndex(null);
    };

    // Remove an item from the batch list
    const handleRemoveFromList = (index) => {
        const updated = selectedItems.filter((_, i) => i !== index);
        setSelectedItems(updated);
        if (editingIndex === index) {
            resetForm();
        } else if (editingIndex !== null && index < editingIndex) {
            setEditingIndex(editingIndex - 1);
        }
        if (expandedItemIndex === index) {
            setExpandedItemIndex(null);
        } else if (expandedItemIndex !== null && index < expandedItemIndex) {
            setExpandedItemIndex(expandedItemIndex - 1);
        }
    };

    // Toggle inline expand for editing an item's details
    const handleToggleExpand = (index) => {
        setExpandedItemIndex(expandedItemIndex === index ? null : index);
    };

    // Update a field in an expanded item inline
    const handleInlineFieldChange = (index, field, value) => {
        const updated = [...selectedItems];
        updated[index] = { ...updated[index], [field]: value };
        setSelectedItems(updated);
    };

    // Fetch dropdown lists when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchLists();
            // Reset global search on modal open
            setGlobalSearchQuery("");
            setGlobalSearchResults([]);
            setShowSearchDropdown(false);
            // Reset multi-select state
            setSelectedItems([]);
            setEditingIndex(null);
            setExpandedItemIndex(null);
        }
    }, [isOpen]);

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
                // Website visibility & image
                setShowOnWebsite(editData.showOnWebsite !== false); // Default to true
                setItemImage(editData.itemImage ?? "");
                setItemImageMimeType(editData.itemImageMimeType ?? "");
                setImageFile(null);
                // Set preview from existing base64 image
                setImagePreview(editData.itemImage ?? "");
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
                // Reset website fields
                setShowOnWebsite(true);
                setItemImage("");
                setItemImageMimeType("");
                setImageFile(null);
                setImagePreview("");
            }
            setErrorName("");
            setTimeout(() => itemNameRef.current?.focus(), 100);
        });
    }, [isOpen, editData]);

    // Active subcategories for selected category
    const activeSubcategories = useRef([]);
    useEffect(() => {
        const found = categoriesList.find((c) => c && (c.name === category || c.name?.toLowerCase() === (category || "").toLowerCase()));
        activeSubcategories.current = found && Array.isArray(found.subcategories) ? found.subcategories : [];
        if (category && activeSubcategories.current.length && !activeSubcategories.current.includes(subCategory)) {
            setSubCategory("");
        }
    }, [category, categoriesList, subCategory]);

    // 🎯 Add New Unit Modal
    const handleAddUnit = () => {
        openModal(UnitModal, {
            onClose: () => closeModal(),
            onSave: async (unitData) => {
                try {
                    const companyId = getCurrentCompany();
                    const response = await authFetch(`${API_BASE}/api/unit`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...unitData, accountCompanyName: companyId })
                    });
                    const saved = await response.json();
                    const newUnit = saved.data || saved;
                    console.log('✅ Unit saved:', newUnit);

                    await fetchLists();
                    setUnit(newUnit.aliasName || unitData.aliasName || unitData.name);
                    closeModal();
                } catch (err) {
                    console.error('❌ Failed to save unit:', err);
                    alert('Failed to save unit. Please try again.');
                }
            }
        });
    };

    // 🎯 Add New Category Modal
    const handleAddCategory = () => {
        openModal(CategoryModal, {
            onClose: () => closeModal(),
            onSave: async (categoryData) => {
                try {
                    const companyId = getCurrentCompany();
                    const response = await authFetch(`${API_BASE}/api/item-categories`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...categoryData, accountCompanyName: companyId })
                    });
                    const saved = await response.json();
                    const newCategory = saved.data || saved;
                    console.log('✅ Category saved:', newCategory);

                    await fetchLists();
                    setCategory(newCategory.name || categoryData.name);
                    closeModal();
                } catch (err) {
                    console.error('❌ Failed to save category:', err);
                    alert('Failed to save category. Please try again.');
                }
            }
        });
    };

    // 🎯 Add New Brand Modal
    const handleAddBrand = () => {
        openModal(BrandModal, {
            onClose: () => closeModal(),
            onSave: async (brandData) => {
                try {
                    const companyId = getCurrentCompany();
                    const response = await authFetch(`${API_BASE}/api/brand`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...brandData, accountCompanyName: companyId })
                    });
                    const saved = await response.json();
                    const newBrand = saved.data || saved;
                    console.log('✅ Brand saved:', newBrand);

                    await fetchLists();
                    setBrandName(newBrand.brandName || brandData.brandName);
                    closeModal();
                } catch (err) {
                    console.error('❌ Failed to save brand:', err);
                    alert('Failed to save brand. Please try again.');
                }
            }
        });
    };

    // 🎯 Add New GST Modal
    const handleAddGst = () => {
        openModal(GstModal, {
            onClose: () => closeModal(),
            onSave: async (gstData) => {
                try {
                    const companyId = getCurrentCompany();
                    const response = await authFetch(`${API_BASE}/api/gst`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...gstData, accountCompanyName: companyId })
                    });
                    const saved = await response.json();
                    const newGst = saved.data || saved;
                    console.log('✅ GST saved:', newGst);

                    await fetchLists();
                    setGstRate(String(newGst.rate || gstData.rate));
                    closeModal();
                } catch (err) {
                    console.error('❌ Failed to save GST:', err);
                    alert('Failed to save GST. Please try again.');
                }
            }
        });
    };

    // 📷 Handle Image File Selection and Upload
    const handleImageFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file (JPEG, PNG, GIF, etc.)');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image file size must be less than 5MB');
            return;
        }

        setImageFile(file);
        // Create local preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload to server to get base64
        setIsUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('itemImage', file);

            const response = await authFetch(`${API_BASE}/api/items/upload-image`, {
                method: 'POST',
                body: formData,
                // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
            });

            if (response && response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    setItemImage(result.data.itemImage);
                    setItemImageMimeType(result.data.itemImageMimeType);
                    console.log('✅ Image uploaded successfully');
                }
            } else {
                console.error('❌ Failed to upload image');
                alert('Failed to upload image. Please try again.');
            }
        } catch (err) {
            console.error('❌ Image upload error:', err);
            alert('Failed to upload image. Please try again.');
        } finally {
            setIsUploadingImage(false);
        }
    };

    // Remove uploaded image
    const handleRemoveImage = () => {
        setItemImage("");
        setItemImageMimeType("");
        setImageFile(null);
        setImagePreview("");
        if (imageInputRef.current) {
            imageInputRef.current.value = "";
        }
    };

    const baseInput = "w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white";
    const labelClass = "block text-sm font-medium text-gray-600 mb-1.5";
    const sectionTitle = "text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2";

    const handleSave = () => {
        if (isEditMode) {
            // Single edit mode
            setErrorName("");
            const trimmedName = itemName.trim();
            if (!trimmedName) {
                setErrorName("Item name is required. Please enter a valid item name.");
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
                showOnWebsite: showOnWebsite,
                itemImage: itemImage,
                itemImageMimeType: itemImageMimeType,
            };

            onSave(payload, true);
        } else {
            // Batch mode
            const formData = getFormData();
            let itemsToSave = [...selectedItems];

            // If form has data, add it to the list
            if (formData.itemName.trim()) {
                const existsInList = selectedItems.some(
                    i => i.itemName.toLowerCase() === formData.itemName.toLowerCase()
                );
                if (!existsInList) {
                    itemsToSave.push(formData);
                }
            }

            if (itemsToSave.length === 0) {
                setErrorName("Please add at least one item");
                return;
            }

            // If only one item, pass as single object for backward compatibility
            if (itemsToSave.length === 1) {
                const single = itemsToSave[0];
                const payload = {
                    id: String(Date.now()),
                    ...single,
                    name: single.itemName,
                    type: single.itemType,
                };
                onSave(payload, false);
            } else {
                // Multiple items - pass array
                onSave(itemsToSave, false);
            }
        }
    };

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
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 rounded-t-xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <h3 className="text-lg font-semibold text-white">
                    {isEditMode ? "Edit Item" : "Add Items"}
                </h3>
                <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Global Search Bar - Only show when not in edit mode */}
            {!isEditMode && (
                <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                    <div className="relative">
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            🔍 Search existing items from all users to auto-fill form
                        </label>
                        <div className="relative">
                            <input
                                ref={globalSearchRef}
                                type="text"
                                value={globalSearchQuery}
                                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                                placeholder="Type item name to search..."
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                            />
                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {isSearching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                                </div>
                            )}
                        </div>

                        {/* Search Results Dropdown — MasterItem catalog */}
                        {showSearchDropdown && globalSearchResults.length > 0 && (
                            <div
                                ref={searchDropdownRef}
                                className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                            >
                                {globalSearchResults.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectGlobalItem(item)}
                                        className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-gray-900">{item.itemName}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {[item.itemType, item.brandName, item.category]
                                                        .filter(Boolean)
                                                        .join(' • ')}
                                                </div>
                                                {item.description && (
                                                    <div className="text-xs text-gray-400 truncate max-w-md mt-0.5">{item.description}</div>
                                                )}
                                            </div>
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                {item.userCount || 0} {item.userCount === 1 ? 'user' : 'users'}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* No results message */}
                        {showSearchDropdown && globalSearchResults.length === 0 && globalSearchQuery.trim().length >= 2 && !isSearching && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
                                No items found in catalog matching "{globalSearchQuery}" — you can create a new item manually
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Selected Items List - Accordion with inline editing */}
            {!isEditMode && selectedItems.length > 0 && (
                <div className="px-6 py-3 bg-green-50 border-b border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="text-sm font-medium text-green-800">
                            {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} ready to save
                        </span>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedItems.map((item, idx) => (
                            <div key={idx} className={`rounded-lg border ${expandedItemIndex === idx ? 'border-blue-400 bg-white shadow-sm' : 'border-green-300 bg-white'}`}>
                                {/* Item header row */}
                                <div className="flex items-center justify-between px-3 py-2">
                                    <button
                                        onClick={() => handleToggleExpand(idx)}
                                        className="flex items-center gap-2 flex-1 text-left hover:text-blue-600 transition-colors"
                                        title="Click to expand/collapse inline editing"
                                    >
                                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedItemIndex === idx ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span className={`font-medium text-sm ${editingIndex === idx ? 'text-blue-700' : 'text-gray-800'}`}>
                                            {item.itemName}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {[item.unit, item.brandName, item.gstRate ? `GST ${item.gstRate}%` : null, item.sellPrice ? `₹${item.sellPrice}` : null]
                                                .filter(Boolean).join(' • ')}
                                        </span>
                                    </button>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleEditFromList(idx)}
                                            className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                            title="Edit in main form"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleRemoveFromList(idx)}
                                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                            title="Remove from list"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                {/* Expanded inline editing fields */}
                                {expandedItemIndex === idx && (
                                    <div className="px-3 pb-3 border-t border-gray-100 pt-2">
                                        <div className="grid grid-cols-4 gap-2 text-xs">
                                            <div>
                                                <label className="block text-gray-500 mb-0.5">Item Name</label>
                                                <input type="text" value={item.itemName} onChange={(e) => handleInlineFieldChange(idx, 'itemName', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-500 mb-0.5">Unit</label>
                                                <select value={item.unit || ''} onChange={(e) => handleInlineFieldChange(idx, 'unit', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                                                    <option value="">Select</option>
                                                    {unitsList.map((u, i) => <option key={i} value={u}>{u}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-gray-500 mb-0.5">Category</label>
                                                <select value={item.category || ''} onChange={(e) => handleInlineFieldChange(idx, 'category', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                                                    <option value="">Select</option>
                                                    {categoriesList.map((c, i) => <option key={i} value={c.name}>{c.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-gray-500 mb-0.5">Brand</label>
                                                <select value={item.brandName || ''} onChange={(e) => handleInlineFieldChange(idx, 'brandName', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                                                    <option value="">Select</option>
                                                    {brandsList.map((b, i) => <option key={i} value={b}>{b}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-gray-500 mb-0.5">GST Rate (%)</label>
                                                <select value={item.gstRate != null ? String(item.gstRate) : ''} onChange={(e) => handleInlineFieldChange(idx, 'gstRate', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                                                    <option value="">Select</option>
                                                    {gstList.map((g, i) => <option key={i} value={String(g)}>{g}%</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-gray-500 mb-0.5">HSN No</label>
                                                <input type="text" value={item.hsnNo || ''} onChange={(e) => handleInlineFieldChange(idx, 'hsnNo', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-500 mb-0.5">Buy Price (₹)</label>
                                                <input type="number" value={item.buyPrice || ''} onChange={(e) => handleInlineFieldChange(idx, 'buyPrice', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500" min="0" step="0.01" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-500 mb-0.5">Sell Price (₹)</label>
                                                <input type="number" value={item.sellPrice || ''} onChange={(e) => handleInlineFieldChange(idx, 'sellPrice', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500" min="0" step="0.01" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-500 mb-0.5">Opening Stock</label>
                                                <input type="number" value={item.openingStock || ''} onChange={(e) => handleInlineFieldChange(idx, 'openingStock', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500" min="0" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-500 mb-0.5">Min Stock</label>
                                                <input type="number" value={item.minStock || ''} onChange={(e) => handleInlineFieldChange(idx, 'minStock', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500" min="0" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-500 mb-0.5">Type</label>
                                                <select value={item.itemType || 'Goods'} onChange={(e) => handleInlineFieldChange(idx, 'itemType', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                                                    <option value="Goods">Goods</option>
                                                    <option value="Service">Service</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-gray-500 mb-0.5">Description</label>
                                                <input type="text" value={item.description || ''} onChange={(e) => handleInlineFieldChange(idx, 'description', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal Body - Scrollable */}
            <div className="px-6 py-5 overflow-y-auto flex-1" data-form-container onKeyDown={handleKeyDown}>
                {/* Basic Details */}
                <div className="mb-5">
                    <h4 className={sectionTitle}>
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Basic Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>
                                Item Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                ref={itemNameRef}
                                type="text"
                                value={itemName}
                                onChange={(e) => { setItemName(e.target.value); if (errorName) setErrorName(""); }}
                                className={baseInput + (errorName ? " border-red-500 ring-1 ring-red-500" : "")}
                                placeholder="Enter Item Name"
                            />
                            {errorName && <p className="mt-1 text-xs text-red-500">{errorName}</p>}
                        </div>
                        <div>
                            <label className={labelClass}>Description</label>
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
                </div>

                {/* Classification */}
                <div className="mb-5">
                    <h4 className={sectionTitle}>
                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Classification
                    </h4>
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <label className={labelClass}>Item Type</label>
                            <select value={itemType} onChange={(e) => setItemType(e.target.value)} className={baseInput}>
                                <option value="Goods">Goods</option>
                                <option value="Service">Service</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Unit</label>
                            <select
                                value={unit}
                                onChange={(e) => {
                                    if (e.target.value === '__ADD_NEW__') {
                                        handleAddUnit();
                                        e.target.value = '';
                                    } else {
                                        setUnit(e.target.value);
                                    }
                                }}
                                className={baseInput}
                            >
                                <option value="">Select Unit</option>
                                {unitsList.length > 0 ? unitsList.map((u, idx) => (
                                    <option key={`unit-${idx}`} value={u}>{u}</option>
                                )) : <option disabled>No units available</option>}
                                <option value="__ADD_NEW__" className="text-blue-600 font-semibold">+ Add New Unit</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Category</label>
                            <select
                                value={category}
                                onChange={(e) => {
                                    if (e.target.value === '__ADD_NEW__') {
                                        handleAddCategory();
                                        e.target.value = '';
                                    } else {
                                        setCategory(e.target.value);
                                        setSubCategory("");
                                    }
                                }}
                                className={baseInput}
                            >
                                <option value="">Select Category</option>
                                {categoriesList.length > 0 ? categoriesList.map((c, idx) => (
                                    <option key={`cat-${idx}`} value={c.name}>{c.name}</option>
                                )) : <option disabled>No categories available</option>}
                                <option value="__ADD_NEW__" className="text-blue-600 font-semibold">+ Add New Category</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Sub-Category</label>
                            <select
                                value={subCategory}
                                onChange={(e) => setSubCategory(e.target.value)}
                                disabled={!category}
                                className={`${baseInput} ${!category ? 'bg-gray-50 cursor-not-allowed text-gray-400' : ''}`}
                            >
                                <option value="">{!category ? "Select category first" : "Select Sub-Category"}</option>
                                {category && categoriesList.find(c => c.name === category)?.subcategories?.filter(Boolean).map((s, idx) => (
                                    <option key={`sub-${idx}`} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tax & Pricing */}
                <div className="mb-5">
                    <h4 className={sectionTitle}>
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Tax & Pricing
                    </h4>
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <label className={labelClass}>Brand Name</label>
                            <select
                                value={brandName}
                                onChange={(e) => {
                                    if (e.target.value === '__ADD_NEW__') {
                                        handleAddBrand();
                                        e.target.value = '';
                                    } else {
                                        setBrandName(e.target.value);
                                    }
                                }}
                                className={baseInput}
                            >
                                <option value="">Select Brand</option>
                                {brandsList.length > 0 ? brandsList.map((b, idx) => (
                                    <option key={`brand-${idx}`} value={b}>{b}</option>
                                )) : <option disabled>No brands available</option>}
                                <option value="__ADD_NEW__" className="text-blue-600 font-semibold">+ Add New Brand</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>HSN No</label>
                            <input
                                type="text"
                                value={hsnNo}
                                onChange={(e) => setHsnNo(e.target.value)}
                                className={baseInput}
                                placeholder="Enter HSN Code"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>GST Rate (%)</label>
                            <select
                                value={gstRate}
                                onChange={(e) => {
                                    if (e.target.value === '__ADD_NEW__') {
                                        handleAddGst();
                                    } else {
                                        setGstRate(e.target.value);
                                    }
                                }}
                                className={baseInput}
                            >
                                <option value="">Select GST Rate</option>
                                {gstList.map((g, idx) => (
                                    <option key={`gst-${idx}`} value={String(g)}>{String(g)}%</option>
                                ))}
                                <option value="__ADD_NEW__" className="text-blue-600 font-semibold">+ Add New GST Rate</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Buy Price (₹)</label>
                            <input
                                type="number"
                                value={buyPrice}
                                onChange={(e) => setBuyPrice(e.target.value)}
                                className={baseInput}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>
                </div>

                {/* Stock Details */}
                <div className="mb-3">
                    <h4 className={sectionTitle}>
                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Stock Details
                    </h4>
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <label className={labelClass}>Sell Price (₹)</label>
                            <input
                                type="number"
                                value={sellPrice}
                                onChange={(e) => setSellPrice(e.target.value)}
                                className={baseInput}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Opening Stock</label>
                            <input
                                type="number"
                                value={openingStock}
                                onChange={(e) => setOpeningStock(e.target.value)}
                                className={baseInput}
                                placeholder="0"
                                min="0"
                                step="1"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Min Stock</label>
                            <input
                                type="number"
                                value={minStock}
                                onChange={(e) => setMinStock(e.target.value)}
                                className={baseInput}
                                placeholder="0"
                                min="0"
                                step="1"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Opening Date</label>
                            <input
                                type="date"
                                value={openingDate}
                                onChange={(e) => setOpeningDate(e.target.value)}
                                className={baseInput}
                            />
                        </div>
                    </div>
                </div>

                {/* Website Settings */}
                <div className="mb-3">
                    <h4 className={sectionTitle}>
                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        Website Settings
                        <span className="text-xs font-normal text-gray-500 ml-2">(Personal shop website)</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showOnWebsite}
                                    onChange={(e) => setShowOnWebsite(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                            <div>
                                <p className="text-sm font-medium text-gray-700">Show on Website</p>
                                <p className="text-xs text-gray-500">Display this item on your personal shop website</p>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>
                                Item Image
                                <span className="text-xs font-normal text-gray-400 ml-1">(optional, max 5MB)</span>
                            </label>
                            <div className="flex flex-col gap-2">
                                {/* File Input */}
                                <div className="relative">
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageFileChange}
                                        className="hidden"
                                        id="itemImageInput"
                                    />
                                    <label
                                        htmlFor="itemImageInput"
                                        className={`flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors ${isUploadingImage ? 'opacity-50 pointer-events-none' : ''}`}
                                    >
                                        {isUploadingImage ? (
                                            <>
                                                <svg className="w-5 h-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span className="text-sm text-gray-500">Uploading...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-sm text-gray-600">
                                                    {imagePreview ? 'Change Image' : 'Upload Image'}
                                                </span>
                                            </>
                                        )}
                                    </label>
                                </div>

                                {/* Image Preview */}
                                {imagePreview && (
                                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-16 h-16 object-cover rounded border border-gray-200"
                                        />
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-600">
                                                {imageFile ? imageFile.name : 'Existing image'}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : ''}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                            title="Remove image"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {listsLoading && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-4 py-3 rounded-lg">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading dropdown options...
                    </div>
                )}
                {listsError && (
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-4 py-3 rounded-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Failed to load some dropdown options. You can still add new items using the + buttons.
                    </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                {isEditMode ? (
                    <button
                        type="button"
                        onClick={() => onDelete && onDelete(editData.id)}
                        className="px-4 py-2.5 text-sm font-medium text-red-600 hover:text-white border border-red-300 rounded-lg hover:bg-red-500 transition-colors"
                    >
                        Delete Item
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleAddToList}
                        className="px-4 py-2.5 text-sm font-medium text-green-700 hover:text-white border border-green-400 rounded-lg hover:bg-green-500 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        {editingIndex !== null ? "Update in List" : "Add to List"}
                    </button>
                )}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                        {isEditMode ? (
                            "Update Item"
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Save {selectedItems.length > 0 ? `(${selectedItems.length + (itemName.trim() ? 1 : 0)})` : ''}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
