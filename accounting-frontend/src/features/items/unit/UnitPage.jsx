// UnitPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useUnit from "./hooks/useUnit";


function UnitModal({ isOpen, onClose, onSave, onDelete, editData }) {
    const [fullName, setFullName] = useState("");
    const [aliasName, setAliasName] = useState("");
    const [error, setError] = useState("");
    const fullNameRef = useRef(null);
    const aliasNameRef = useRef(null);

    const isEditMode = !!editData;

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setFullName(editData.fullName || "");
                setAliasName(editData.aliasName || "");
            } else {
                setFullName("");
                setAliasName("");
            }
            setError("");
            // Focus first field when modal opens
            setTimeout(() => fullNameRef.current?.focus(), 100);
        }
    }, [editData, isOpen]);

    // Handle Enter key navigation
    const handleKeyDown = (e, fieldName) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (fieldName === 'fullName') {
                aliasNameRef.current?.focus();
            } else if (fieldName === 'aliasName') {
                handleSave();
            }
        }
    };

    const handleSave = () => {
        if (!fullName.trim()) {
            setError("Unit Full Name is required");
            return;
        }

        const unitData = {
            id: isEditMode ? editData.id : String(Date.now()),
            fullName: fullName.trim(),
            aliasName: aliasName.trim(),
        };

        onSave(unitData, isEditMode);
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-4 rounded-t-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <h3 className="text-base font-semibold text-white">
                        {isEditMode ? "Edit Unit" : "New Unit"}
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
                <div className="px-5 py-4 space-y-4">
                    {/* Unit Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Unit Full Name<span className="text-red-500">*</span>
                        </label>
                        <input
                            ref={fullNameRef}
                            type="text"
                            value={fullName}
                            onChange={(e) => {
                                setFullName(e.target.value);
                                if (error) setError("");
                            }}
                            onKeyDown={(e) => handleKeyDown(e, 'fullName')}
                            placeholder="e.g., Kilogram, Piece, Liter"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {error && (
                            <p className="mt-1 text-xs text-red-500">{error}</p>
                        )}
                    </div>

                    {/* Alias Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Alias Name
                        </label>
                        <input
                            ref={aliasNameRef}
                            type="text"
                            value={aliasName}
                            onChange={(e) => setAliasName(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'aliasName')}
                            placeholder="e.g., kg, pcs, ltr"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
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
 * UnitPage - Unit management with Excel-like table
 */
export default function UnitPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const { rows: units = [], loading, error, reload, create, update, remove } =
        useUnit({ useLocalFallback: true });

    const [selectedCell, setSelectedCell] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);

    useEffect(() => {
        if (location.state?.savedUnit || location.state?.deletedUnitId) {
            // server is source of truth now — reload list
            reload();
            // Clear the state
            window.history.replaceState({}, document.title);
        }
    }, [location.state, reload]);


    const handleOpenCreate = () => {
        setEditingUnit(null);
        setIsModalOpen(true);
    };

    const handleEditUnit = (unit) => {
        setEditingUnit(unit);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUnit(null);
    };

    const handleSaveUnit = async (unitData, isEdit) => {
        try {
            if (isEdit) {
                await update(unitData.id, {
                    fullName: unitData.fullName,
                    aliasName: unitData.aliasName || "",
                });
            } else {
                await create({
                    fullName: unitData.fullName,
                    aliasName: unitData.aliasName || "",
                });
            }
            setIsModalOpen(false);
            setEditingUnit(null);
        } catch (err) {
            console.error("Failed to save unit:", err);
            alert(err?.message || "Failed to save unit");
        }
    };


    const handleDeleteUnit = async (id) => {
        if (!window.confirm("Are you sure you want to delete this unit?")) return;
        try {
            await remove(id);
            setIsModalOpen(false);
            setEditingUnit(null);
        } catch (err) {
            console.error("Failed to delete unit:", err);
            alert(err?.message || "Failed to delete unit");
        }
    };


    const handleCellClick = (rowIndex, colIndex) => {
        setSelectedCell({ rowIndex, colIndex });
    };

    const handleTableContainerClick = (e) => {
        if (e.target === e.currentTarget) {
            setSelectedCell(null);
        }
    };

    const TOTAL_ROWS = 15;
    const tableContainerRef = useRef(null);
    const [visibleRows, setVisibleRows] = useState(TOTAL_ROWS);

    useEffect(() => {
        const calculateRows = () => {
            if (tableContainerRef.current) {
                const containerHeight = tableContainerRef.current.clientHeight;
                const rowHeight = 32;
                const headerHeight = 36;
                const availableHeight = containerHeight - headerHeight;
                const rows = Math.floor(availableHeight / rowHeight);
                setVisibleRows(Math.max(rows, 1));
            }
        };

        calculateRows();
        window.addEventListener('resize', calculateRows);
        return () => window.removeEventListener('resize', calculateRows);
    }, []);

    const emptyRowsCount = Math.max(0, visibleRows - units.length);
    const emptyRows = Array.from({ length: emptyRowsCount }, (_, i) => i);

    const totalRecords = units.length;
    const startRecord = totalRecords > 0 ? 1 : 0;
    const endRecord = totalRecords;

    const isCellSelected = (rowIndex, colIndex) => {
        return selectedCell?.rowIndex === rowIndex && selectedCell?.colIndex === colIndex;
    };

    const getCellClasses = (rowIndex, colIndex) => {
        const baseClasses = "h-8 px-4 border-r border-gray-400 cursor-cell";
        const selectedClasses = isCellSelected(rowIndex, colIndex)
            ? "outline outline-2 outline-blue-500 outline-offset-[-2px] bg-blue-50"
            : "";
        return `${baseClasses} ${selectedClasses}`;
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header Row */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">Units</h2>
                    <button className="text-gray-400 hover:text-yellow-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </button>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Unit
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
            </div>

            {/* Table Container */}
            <div
                ref={tableContainerRef}
                className="flex-1 overflow-auto px-4 pb-1"
                onClick={handleTableContainerClick}
            >
                <div className="border border-gray-400 rounded overflow-hidden h-full">
                    <table className="w-full border-collapse text-sm" style={{ borderSpacing: 0 }}>
                        <thead className="sticky top-0 z-10 bg-white">
                            <tr className="border-b border-gray-400">
                                <th className="w-[40%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Unit Full Name</span>
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                        </svg>
                                    </div>
                                </th>
                                <th className="w-[40%] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Alias Name</span>
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                        </svg>
                                    </div>
                                </th>
                                <th className="w-[20%] h-9 px-4 text-left text-sm font-medium text-gray-700">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Data rows */}
                            {units.map((unit, rowIndex) => (
                                <tr
                                    key={unit.id || unit._id || rowIndex}
                                    className={`border-b border-gray-400 hover:bg-blue-100 transition-colors ${rowIndex % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'}`}
                                >
                                    <td
                                        className={getCellClasses(rowIndex, 0) + " text-left text-gray-900"}
                                        onClick={() => handleCellClick(rowIndex, 0)}
                                    >
                                        {unit.fullName}
                                    </td>
                                    <td
                                        className={getCellClasses(rowIndex, 1) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 1)}
                                    >
                                        {unit.aliasName}
                                    </td>
                                    <td className="h-8 px-4 text-left">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEditUnit(unit)}
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
                            {/* Empty rows */}
                            {emptyRows.map((_, idx) => {
                                const rowIndex = units.length + idx;
                                return (
                                    <tr
                                        key={`empty-${idx}`}
                                        className={`border-b border-gray-400 hover:bg-blue-100 transition-colors ${rowIndex % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'}`}
                                    >
                                        <td
                                            className={getCellClasses(rowIndex, 0)}
                                            onClick={() => handleCellClick(rowIndex, 0)}
                                        ></td>
                                        <td
                                            className={getCellClasses(rowIndex, 1)}
                                            onClick={() => handleCellClick(rowIndex, 1)}
                                        ></td>
                                        <td className="h-8 px-4"></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-200 text-sm text-blue-600 bg-white">
                {totalRecords > 0 ? `${startRecord}-${endRecord} of ${totalRecords} Records` : '0 Records'}
            </div>

            {/* Unit Modal */}
            <UnitModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveUnit}
                onDelete={handleDeleteUnit}
                editData={editingUnit}
            />
        </div>
    );
}
