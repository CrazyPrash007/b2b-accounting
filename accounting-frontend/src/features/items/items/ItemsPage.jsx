// ItemsPage.jsx
import React, { useState } from "react";
import ItemTable from "./ItemTable";
import ItemModal from "./ItemModal";

/**
 * ItemsPage - Main page for Item Master management
 * Frontend-only, in-memory state, no backend calls
 */
export default function ItemsPage() {
    const [items, setItems] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const handleCreateItem = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEditItem = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDeleteItem = (itemId) => {
        if (window.confirm("Delete this item?")) {
            setItems((prev) => prev.filter((item) => item.id !== itemId));
        }
    };

    const handleSaveItem = (payload) => {
        setItems((prev) => {
            const exists = prev.some((item) => item.id === payload.id);
            if (exists) {
                return prev.map((item) => (item.id === payload.id ? payload : item));
            }
            return [...prev, payload];
        });
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleDeleteFromModal = (id) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
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
                onDelete={handleDeleteItem}
            />

            {/* Item Modal */}
            <ItemModal
                isOpen={isModalOpen}
                initialItem={editingItem}
                onSave={handleSaveItem}
                onDelete={handleDeleteFromModal}
                onClose={handleCloseModal}
            />
        </div>
    );
}
