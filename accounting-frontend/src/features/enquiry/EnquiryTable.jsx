// src/features/enquiry/EnquiryTable.jsx
import React from "react";

/**
 * EnquiryTable - Display enquiry list with columns
 */
export default function EnquiryTable({
    data = [],
    onEdit,
    onDelete,
    onRespond,
    onViewResponses,
    onClose,
    isMyEnquiries = true,
    loading = false
}) {
    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!data.length) {
        return (
            <div className="text-center py-8 text-gray-500">
                {isMyEnquiries ? "No enquiries found. Create your first enquiry!" : "No public enquiries available."}
            </div>
        );
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const colors = {
            open: "bg-green-100 text-green-800",
            closed: "bg-gray-100 text-gray-800"
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.open}`}>
                {status?.charAt(0).toUpperCase() + status?.slice(1)}
            </span>
        );
    };

    const getTypeBadge = (type) => {
        const colors = {
            buy: "bg-blue-100 text-blue-800",
            sell: "bg-orange-100 text-orange-800"
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || colors.buy}`}>
                {type?.charAt(0).toUpperCase() + type?.slice(1)}
            </span>
        );
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty / Unit</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        {!isMyEnquiries && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posted By</th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        {isMyEnquiries && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responses</th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                                {getTypeBadge(item.enquiryType)}
                            </td>
                            <td className="px-4 py-3">
                                <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                                {item.description && (
                                    <div className="text-xs text-gray-500 truncate max-w-xs">{item.description}</div>
                                )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {item.category || "-"}
                                {item.subCategory && <span className="text-xs text-gray-400"> / {item.subCategory}</span>}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {item.quantity || "-"} {item.unit || ""}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {item.expectedPrice ? `₹${item.expectedPrice.toLocaleString()}` : "-"}
                            </td>
                            {!isMyEnquiries && (
                                <td className="px-4 py-3">
                                    <div className="text-sm text-gray-900">{item.creatorCompany || item.creatorName || "-"}</div>
                                    <div className="text-xs text-gray-500">{item.creatorState || ""}</div>
                                </td>
                            )}
                            <td className="px-4 py-3 whitespace-nowrap">
                                {getStatusBadge(item.status)}
                            </td>
                            {isMyEnquiries && (
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <button
                                        onClick={() => onViewResponses?.(item)}
                                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        {item.responses?.length || 0} responses
                                    </button>
                                </td>
                            )}
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(item.createdAt)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                                <div className="flex justify-end gap-2">
                                    {isMyEnquiries ? (
                                        <>
                                            {item.status === 'open' && (
                                                <>
                                                    <button
                                                        onClick={() => onEdit?.(item)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => onClose?.(item)}
                                                        className="text-yellow-600 hover:text-yellow-800"
                                                        title="Close Enquiry"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => onDelete?.(item)}
                                                className="text-red-600 hover:text-red-800"
                                                title="Delete"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => onRespond?.(item)}
                                            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                                        >
                                            Respond
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
