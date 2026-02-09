// src/features/staff/components/StaffPagination.jsx
import React from 'react';

/**
 * Pagination component for staff list with page navigation and size selection
 */
const StaffPagination = ({ pagination, onPageChange, onLimitChange }) => {
  if (!pagination || pagination.total === 0) {
    return (
      <div className="px-4 py-2 border-t border-gray-200 text-sm text-blue-600 bg-white">
        0 Records
      </div>
    );
  }

  const { total, page, limit, totalPages, hasNextPage, hasPrevPage } = pagination;
  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, current range, and last
      if (page <=3) {
        // Near start
        for (let i = 1; i <= Math.min(maxVisible, totalPages); i++) {
          pages.push(i);
        }
        if (totalPages > maxVisible) {
          pages.push('...');
          pages.push(totalPages);
        }
      } else if (page >= totalPages - 2) {
        // Near end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - (maxVisible - 2); i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle
        pages.push(1);
        pages.push('...');
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="px-4 py-2 border-t border-gray-200 bg-white flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="text-sm text-blue-600">
          {startRecord}-{endRecord} of {total} Records
        </span>

        {/* Rows per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(parseInt(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* Previous button */}
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrevPage}
            className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous page"
          >
            ←
          </button>

          {/* Page numbers */}
          {renderPageNumbers().map((pageNum, idx) => {
            if (pageNum === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                  ...
                </span>
              );
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-1 border rounded text-sm ${
                  pageNum === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {/* Next button */}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNextPage}
            className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next page"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(StaffPagination);
