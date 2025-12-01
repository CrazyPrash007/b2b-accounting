// ItemCategoryRow.jsx
import React from "react";

/**
 * Small presentational row for category table.
 * - onEdit / onDelete are callbacks provided by the page.
 */

export default function ItemCategoryRow({ row, onEdit, onDelete }) {
    return (
        <tr className="border-t hover:bg-slate-50">
            <td className="px-4 py-3">
                <button className="text-blue-600 underline" onClick={() => onEdit(row)}>
                    {row.name}
                </button>
            </td>
            <td className="px-4 py-3">{row.remarks}</td>
            <td className="px-4 py-3">
                <button className="text-sm text-blue-600 mr-3" onClick={() => onEdit(row)}>Edit</button>
                <button className="text-sm text-red-500" onClick={() => onDelete(row.id)}>Delete</button>
            </td>
        </tr>
    );
}
