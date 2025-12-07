// ItemTable.jsx
import React, { useRef, useEffect, useState } from "react";

/**
 * ItemTable - Table for displaying items with matching category table style
 * Excel-like interactions: row hover highlighting, cell selection with border
 * @param {Array} items - List of item objects
 * @param {Function} onEdit - Callback when edit is clicked
 */
export default function ItemTable({ items, onEdit }) {
    const tableContainerRef = useRef(null);
    const [visibleRows, setVisibleRows] = useState(15);
    const [selectedCell, setSelectedCell] = useState(null); // { rowIndex, colIndex }

    // Calculate how many rows can fit in the available space
    useEffect(() => {
        const calculateRows = () => {
            if (tableContainerRef.current) {
                const containerHeight = tableContainerRef.current.clientHeight;
                const rowHeight = 32; // h-8 = 32px
                const headerHeight = 36; // h-9 = 36px
                const availableHeight = containerHeight - headerHeight;
                const rows = Math.floor(availableHeight / rowHeight);
                setVisibleRows(Math.max(rows, 1));
            }
        };

        calculateRows();
        window.addEventListener('resize', calculateRows);
        return () => window.removeEventListener('resize', calculateRows);
    }, []);

    // Create empty rows to fill remaining space (only if data is less than visible rows)
    const emptyRowsCount = Math.max(0, visibleRows - items.length);
    const emptyRows = Array.from({ length: emptyRowsCount }, (_, i) => i);

    // Calculate record display
    const totalRecords = items.length;
    const startRecord = totalRecords > 0 ? 1 : 0;
    const endRecord = totalRecords;

    const handleCellClick = (rowIndex, colIndex) => {
        setSelectedCell({ rowIndex, colIndex });
    };

    // Clear selection when clicking outside table
    const handleTableContainerClick = (e) => {
        if (e.target === e.currentTarget) {
            setSelectedCell(null);
        }
    };

    // Helper to determine if a cell is selected
    const isCellSelected = (rowIndex, colIndex) => {
        return selectedCell?.rowIndex === rowIndex && selectedCell?.colIndex === colIndex;
    };

    // Cell classes with Excel-like selection border
    const getCellClasses = (rowIndex, colIndex) => {
        const baseClasses = "h-8 px-4 border-r border-gray-400 cursor-cell";
        const selectedClasses = isCellSelected(rowIndex, colIndex) 
            ? "outline outline-2 outline-blue-500 outline-offset-[-2px] bg-blue-50" 
            : "";
        return `${baseClasses} ${selectedClasses}`;
    };

    return (
        <>
            {/* Toolbar - Icons commented out */}
            <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-gray-100">
                {/* <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
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
                <div className="w-px h-5 bg-gray-300 mx-1"></div>
                <button className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    More Filter
                </button> */}
            </div>

            {/* Table Container - Scrollable with horizontal scroll */}
            <div 
                ref={tableContainerRef} 
                className="flex-1 overflow-auto px-4 pb-1"
                onClick={handleTableContainerClick}
            >
                <div className="border border-gray-400 rounded overflow-hidden h-full">
                    <div className="overflow-x-auto h-full">
                    <table className="min-w-[1800px] w-full border-collapse text-sm" style={{ borderSpacing: 0 }}>
                        <thead className="sticky top-0 z-10 bg-white">
                            <tr className="border-b border-gray-400">
                                <th className="min-w-[160px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Item Name</span>
                                    </div>
                                </th>
                                <th className="min-w-[150px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Description</span>
                                    </div>
                                </th>
                                <th className="min-w-[100px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Item Type</span>
                                    </div>
                                </th>
                                <th className="min-w-[100px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Unit</span>
                                    </div>
                                </th>
                                <th className="min-w-[120px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Category</span>
                                    </div>
                                </th>
                                <th className="min-w-[120px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Sub-Category</span>
                                    </div>
                                </th>
                                <th className="min-w-[120px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Brand</span>
                                    </div>
                                </th>
                                <th className="min-w-[100px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>HSN No</span>
                                    </div>
                                </th>
                                <th className="min-w-[90px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>GST Rate</span>
                                    </div>
                                </th>
                                <th className="min-w-[100px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Buy Price</span>
                                    </div>
                                </th>
                                <th className="min-w-[100px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Sell Price</span>
                                    </div>
                                </th>
                                <th className="min-w-[110px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Opening Stock</span>
                                    </div>
                                </th>
                                <th className="min-w-[90px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Min Stock</span>
                                    </div>
                                </th>
                                <th className="min-w-[110px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <span>Opening Date</span>
                                    </div>
                                </th>
                                <th className="min-w-[100px] h-9 px-4 text-left text-sm font-medium text-gray-700 sticky right-0 z-20 bg-gray-100 border-l border-gray-400" style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.15)' }}>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Data rows */}
                            {items.map((item, rowIndex) => (
                                <tr 
                                    key={item.id} 
                                    className={`border-b border-gray-400 hover:bg-blue-100 transition-colors ${rowIndex % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'}`}
                                >
                                    <td 
                                        className={getCellClasses(rowIndex, 0) + " text-left text-blue-600 truncate"}
                                        onClick={() => handleCellClick(rowIndex, 0)}
                                    >
                                        {item.name || item.itemName}
                                    </td>
                                    <td 
                                        className={getCellClasses(rowIndex, 1) + " text-left text-gray-600 truncate"}
                                        onClick={() => handleCellClick(rowIndex, 1)}
                                    >
                                        {item.description || "-"}
                                    </td>
                                    <td 
                                        className={getCellClasses(rowIndex, 2) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 2)}
                                    >
                                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                                            {item.type || item.itemType || "Goods"}
                                        </span>
                                    </td>
                                    <td 
                                        className={getCellClasses(rowIndex, 3) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 3)}
                                    >
                                        {item.unit || "-"}
                                    </td>
                                    <td 
                                        className={getCellClasses(rowIndex, 4) + " text-left text-gray-600 truncate"}
                                        onClick={() => handleCellClick(rowIndex, 4)}
                                    >
                                        {item.category || "-"}
                                    </td>
                                    <td 
                                        className={getCellClasses(rowIndex, 5) + " text-left text-gray-600 truncate"}
                                        onClick={() => handleCellClick(rowIndex, 5)}
                                    >
                                        {item.subCategory || "-"}
                                    </td>
                                    <td 
                                        className={getCellClasses(rowIndex, 6) + " text-left text-gray-600 truncate"}
                                        onClick={() => handleCellClick(rowIndex, 6)}
                                    >
                                        {item.brandName || "-"}
                                    </td>
                                    <td 
                                        className={getCellClasses(rowIndex, 7) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 7)}
                                    >
                                        {item.hsnNo || "-"}
                                    </td>
                                    <td 
                                        className={getCellClasses(rowIndex, 8) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 8)}
                                    >
                                        {item.gstRate ? `${item.gstRate}%` : "-"}
                                    </td>
                                    <td 
                                        className={getCellClasses(rowIndex, 9) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 9)}
                                    >
                                        {item.buyPrice ? `₹${item.buyPrice}` : "-"}
                                    </td>
                                    <td 
                                        className={getCellClasses(rowIndex, 10) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 10)}
                                    >
                                        {item.sellPrice ? `₹${item.sellPrice}` : "-"}
                                    </td>
                                    <td 
                                        className={getCellClasses(rowIndex, 11) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 11)}
                                    >
                                        {item.openingStock || "-"}
                                    </td>
                                    <td 
                                        className={getCellClasses(rowIndex, 12) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 12)}
                                    >
                                        {item.minStock || "-"}
                                    </td>
                                    <td 
                                        className={getCellClasses(rowIndex, 13) + " text-left text-gray-600"}
                                        onClick={() => handleCellClick(rowIndex, 13)}
                                    >
                                        {item.openingDate || "-"}
                                    </td>
                                    <td className={`h-8 px-4 text-left sticky right-0 z-10 border-l border-gray-400 ${rowIndex % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`} style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.1)' }}>
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                className="text-blue-600 hover:underline text-sm"
                                                onClick={() => onEdit(item)}
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
                        {/* Empty rows to fill the display */}
                        {emptyRows.map((_, idx) => {
                            const rowIndex = items.length + idx;
                            return (
                                <tr 
                                    key={`empty-${idx}`} 
                                    className={`border-b border-gray-400 hover:bg-blue-100 transition-colors ${rowIndex % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'}`}
                                >
                                    <td className={getCellClasses(rowIndex, 0)} onClick={() => handleCellClick(rowIndex, 0)}></td>
                                    <td className={getCellClasses(rowIndex, 1)} onClick={() => handleCellClick(rowIndex, 1)}></td>
                                    <td className={getCellClasses(rowIndex, 2)} onClick={() => handleCellClick(rowIndex, 2)}></td>
                                    <td className={getCellClasses(rowIndex, 3)} onClick={() => handleCellClick(rowIndex, 3)}></td>
                                    <td className={getCellClasses(rowIndex, 4)} onClick={() => handleCellClick(rowIndex, 4)}></td>
                                    <td className={getCellClasses(rowIndex, 5)} onClick={() => handleCellClick(rowIndex, 5)}></td>
                                    <td className={getCellClasses(rowIndex, 6)} onClick={() => handleCellClick(rowIndex, 6)}></td>
                                    <td className={getCellClasses(rowIndex, 7)} onClick={() => handleCellClick(rowIndex, 7)}></td>
                                    <td className={getCellClasses(rowIndex, 8)} onClick={() => handleCellClick(rowIndex, 8)}></td>
                                    <td className={getCellClasses(rowIndex, 9)} onClick={() => handleCellClick(rowIndex, 9)}></td>
                                    <td className={getCellClasses(rowIndex, 10)} onClick={() => handleCellClick(rowIndex, 10)}></td>
                                    <td className={getCellClasses(rowIndex, 11)} onClick={() => handleCellClick(rowIndex, 11)}></td>
                                    <td className={getCellClasses(rowIndex, 12)} onClick={() => handleCellClick(rowIndex, 12)}></td>
                                    <td className={getCellClasses(rowIndex, 13)} onClick={() => handleCellClick(rowIndex, 13)}></td>
                                    <td className={`h-8 px-4 sticky right-0 z-10 border-l border-gray-400 ${rowIndex % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`} style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.1)' }}></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                    </div>
                </div>
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="px-4 py-2 border-t border-gray-200 text-sm text-blue-600 bg-white">
                {totalRecords > 0 ? `${startRecord}-${endRecord} of ${totalRecords} Records` : '0 Records'}
            </div>
        </>
    );
}
