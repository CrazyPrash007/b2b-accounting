// ItemCategoryDrawer.jsx
import React, { useEffect, useState } from "react";

/**
 * Right-side drawer form for Create / Edit Item Category.
 *
 * Props:
 * - open: boolean
 * - initialData: null | { id, name, remarks }
 * - onClose: () => void
 * - onSave: (payload) => Promise  (for both create & edit; if initialData present, it's an edit)
 *
 * Keyboard shortcuts:
 * - Esc to close
 * - Ctrl+Alt+S to save
 * - Ctrl+Alt+C to cancel/close
 */

export default function ItemCategoryDrawer({ open, initialData = null, onClose, onSave }) {
    const [name, setName] = useState("");
    const [remarks, setRemarks] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || "");
            setRemarks(initialData.remarks || "");
        } else {
            setName("");
            setRemarks("");
        }
    }, [initialData, open]);

    useEffect(() => {
        function onKey(e) {
            if (e.key === "Escape") onClose && onClose();
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "s") {
                e.preventDefault();
                handleSave();
            }
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "c") {
                e.preventDefault();
                onClose && onClose();
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [name, remarks]);

    if (!open) return null;

    const handleSave = async () => {
        if (!name.trim()) return alert("Category name is required");
        const payload = { name: name.trim(), remarks: remarks.trim() };
        setSaving(true);
        try {
            await onSave(payload);
            onClose && onClose();
        } catch (err) {
            console.error(err);
            alert(err?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="ml-auto w-full max-w-md bg-white shadow-xl h-full overflow-auto p-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">{initialData ? "Edit Category" : "New Category"}</h3>
                    <button onClick={onClose} className="text-slate-500">✕</button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Category <span className="text-red-500">*</span></label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Category Name"
                            className="mt-1 block w-full border rounded px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Remarks</label>
                        <input
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Remarks"
                            className="mt-1 block w-full border rounded px-3 py-2"
                        />
                    </div>

                    <div className="flex items-center space-x-3 pt-2">
                        <button
                            onClick={handleSave}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save"}
                        </button>

                        <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                    </div>

                    <div className="mt-6 text-sm text-slate-500">
                        <div className="font-medium mb-2">SHORTCUTS:</div>
                        <div className="flex gap-2 items-center flex-wrap">
                            <kbd className="border rounded px-2 py-1">CTRL</kbd>
                            <span className="text-xs">+</span>
                            <kbd className="border rounded px-2 py-1">ALT</kbd>
                            <span className="text-xs">+</span>
                            <kbd className="border rounded px-2 py-1">S</kbd>
                            <span className="ml-2">Save</span>

                            <span className="mx-2">•</span>

                            <kbd className="border rounded px-2 py-1">CTRL</kbd>
                            <span className="text-xs">+</span>
                            <kbd className="border rounded px-2 py-1">ALT</kbd>
                            <span className="text-xs">+</span>
                            <kbd className="border rounded px-2 py-1">C</kbd>
                            <span className="ml-2">Cancel</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
