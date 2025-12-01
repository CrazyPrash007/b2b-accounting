// ItemCategoryPage.jsx
import React, { useState } from "react";
import AppLayout from "src/layouts/AppLayout"; // if you use absolute imports
import useItemCategories from "./hooks/useItemCategories";
import { ItemCategoryDrawer, ItemCategoryRow } from "./components";

/**
 * ItemCategoryPage
 * - uses useItemCategories hook
 * - shows table + create button + drawer for create/edit
 */

export default function ItemCategoryPage() {
    const { rows, loading, error, create, update, remove } = useItemCategories();
    // drawer state: null | { mode: 'create' } | { mode: 'edit', row: { ... } }
    const [drawer, setDrawer] = useState(null);

    const openCreate = () => setDrawer({ mode: "create" });
    const openEdit = (row) => setDrawer({ mode: "edit", row });

    const handleClose = () => setDrawer(null);

    const handleSave = async (payload) => {
        if (drawer?.mode === "edit") {
            await update(drawer.row.id, payload);
        } else {
            await create(payload);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this category?")) return;
        try {
            await remove(id);
        } catch (err) {
            console.error(err);
            alert("Delete failed");
        }
    };

    return (
        <AppLayout>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Item Category</h2>
                <div>
                    <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
                        + Create Category
                    </button>
                </div>
            </div>

            <div className="bg-white border rounded">
                <table className="min-w-full">
                    <thead className="bg-slate-100 text-left">
                        <tr>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Remarks</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan="3" className="px-4 py-8 text-center text-slate-500">
                                    Loading...
                                </td>
                            </tr>
                        )}

                        {!loading && rows.length === 0 && (
                            <tr>
                                <td colSpan="3" className="px-4 py-8 text-center text-slate-500">
                                    No categories yet. Click "Create Category" to add one.
                                </td>
                            </tr>
                        )}

                        {!loading &&
                            rows.map((r) => (
                                <ItemCategoryRow key={r.id || r._id} row={r} onEdit={openEdit} onDelete={handleDelete} />
                            ))}

                        {error && (
                            <tr>
                                <td colSpan="3" className="px-4 py-4 text-red-600">
                                    Error: {error.message || "Something went wrong"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ItemCategoryDrawer
                open={!!drawer}
                initialData={drawer?.mode === "edit" ? drawer.row : null}
                onClose={handleClose}
                onSave={handleSave}
            />
        </AppLayout>
    );
}
