// src/features/staff/components/StaffTableRow.jsx
import React from 'react';
import DOMPurify from 'dompurify';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-yellow-100 text-yellow-800',
  terminated: 'bg-red-100 text-red-800',
};

/**
 * Individual staff table row component with XSS protection
 * Memoized for performance optimization
 */
const StaffTableRow = ({
  staff,
  rowIndex,
  selectedCell,
  onCellClick,
  onOpenModal,
  onOpenDetailsModal,
  onOpenHistoryModal,
  onStatusChange,
  getCellClasses,
}) => {
  // Sanitize user inputs to prevent XSS attacks
  const sanitize = (str) => {
    if (!str) return str;
    return DOMPurify.sanitize(String(str), { ALLOWED_TAGS: [] });
  };

  return (
    <tr
      className={`border-b border-gray-400 hover:bg-blue-100 transition-colors cursor-pointer ${
        rowIndex % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'
      }`}
      onClick={() => onOpenHistoryModal(staff)}
    >
      <td
        className={getCellClasses(rowIndex, 0) + ' text-left text-blue-600 font-medium'}
        onClick={(e) => {
          e.stopPropagation();
          onCellClick(rowIndex, 0);
          onOpenHistoryModal(staff);
        }}
      >
        {sanitize(staff.name)}
      </td>
      <td
        className={getCellClasses(rowIndex, 1) + ' text-left text-gray-600'}
        onClick={(e) => {
          e.stopPropagation();
          onCellClick(rowIndex, 1);
        }}
      >
        {sanitize(staff.fatherName) || '-'}
      </td>
      <td
        className={getCellClasses(rowIndex, 2) + ' text-left text-gray-600'}
        onClick={(e) => {
          e.stopPropagation();
          onCellClick(rowIndex, 2);
        }}
      >
        {formatDate(staff.dateOfBirth)}
      </td>
      <td
        className={getCellClasses(rowIndex, 3) + ' text-left text-gray-600'}
        onClick={(e) => {
          e.stopPropagation();
          onCellClick(rowIndex, 3);
        }}
      >
        {formatDate(staff.dateOfJoining)}
      </td>
      <td
        className={getCellClasses(rowIndex, 4) + ' text-left text-gray-600'}
        onClick={(e) => {
          e.stopPropagation();
          onCellClick(rowIndex, 4);
        }}
      >
        {sanitize(staff.mobile) || '-'}
      </td>
      <td
        className={getCellClasses(rowIndex, 5) + ' text-left text-gray-600 font-mono'}
        onClick={(e) => {
          e.stopPropagation();
          onCellClick(rowIndex, 5);
        }}
      >
        {sanitize(staff.aadharNumber) || '-'}
      </td>
      <td
        className={getCellClasses(rowIndex, 6) + ' text-left text-gray-600 capitalize'}
        onClick={(e) => {
          e.stopPropagation();
          onCellClick(rowIndex, 6);
        }}
      >
        {staff.salaryType}
      </td>
      <td
        className={getCellClasses(rowIndex, 7) + ' text-right text-gray-900 font-medium'}
        onClick={(e) => {
          e.stopPropagation();
          onCellClick(rowIndex, 7);
        }}
      >
        {formatCurrency(staff.salaryAmount)}
      </td>
      <td
        className={getCellClasses(rowIndex, 8) + ' text-center'}
        onClick={(e) => {
          e.stopPropagation();
          onCellClick(rowIndex, 8);
        }}
      >
        {staff.salaryType === 'monthly' ? (
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${
              staff.sundayIncluded
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {staff.sundayIncluded ? 'Yes' : 'No'}
          </span>
        ) : (
          '-'
        )}
      </td>
      <td
        className={getCellClasses(rowIndex, 9) + ' text-left text-gray-600 font-mono'}
        onClick={(e) => {
          e.stopPropagation();
          onCellClick(rowIndex, 9);
        }}
      >
        {sanitize(staff.bankAccountNumber) || '-'}
      </td>
      <td
        className={getCellClasses(rowIndex, 10) + ' text-left text-gray-600 font-mono uppercase'}
        onClick={(e) => {
          e.stopPropagation();
          onCellClick(rowIndex, 10);
        }}
      >
        {sanitize(staff.bankIfscCode) || '-'}
      </td>
      <td
        className={getCellClasses(rowIndex, 11) + ' text-left text-gray-600'}
        onClick={(e) => {
          e.stopPropagation();
          onCellClick(rowIndex, 11);
        }}
      >
        {sanitize(staff.bankName) || '-'}
      </td>
      <td
        className={getCellClasses(rowIndex, 12) + ' text-left text-gray-600'}
        onClick={(e) => {
          e.stopPropagation();
          onCellClick(rowIndex, 12);
        }}
      >
        {sanitize(staff.department) || '-'}
      </td>
      <td
        className={getCellClasses(rowIndex, 13) + ' text-left text-gray-600'}
        onClick={(e) => {
          e.stopPropagation();
          onCellClick(rowIndex, 13);
        }}
      >
        {sanitize(staff.designation) || '-'}
      </td>
      <td
        className={getCellClasses(rowIndex, 14) + ' text-left'}
        onClick={(e) => {
          e.stopPropagation();
          onCellClick(rowIndex, 14);
        }}
      >
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
            statusColors[staff.status] || ''
          }`}
        >
          {staff.status}
        </span>
      </td>
      <td
        className={`h-8 px-4 text-left sticky right-0 z-10 border-l border-gray-400 ${
          rowIndex % 2 === 0 ? 'bg-blue-50' : 'bg-white'
        }`}
        style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetailsModal(staff);
            }}
            className="text-purple-600 hover:underline text-sm"
          >
            Details
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenModal(staff);
            }}
            className="text-blue-600 hover:underline text-sm"
          >
            Edit
          </button>
          <div className="relative group">
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
            {/* Dropdown menu on hover */}
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border z-20 hidden group-hover:block">
              <div className="py-1">
                {staff.status !== 'active' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(staff, 'active');
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm text-green-700 hover:bg-green-50"
                  >
                    Set Active
                  </button>
                )}
                {staff.status !== 'inactive' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(staff, 'inactive');
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm text-yellow-700 hover:bg-yellow-50"
                  >
                    Set Inactive
                  </button>
                )}
                {staff.status !== 'terminated' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(staff, 'terminated');
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                  >
                    Terminate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(
  StaffTableRow,
  (prevProps, nextProps) => {
    // Custom comparison for better performance
    return (
      prevProps.staff._id === nextProps.staff._id &&
      prevProps.staff.status === nextProps.staff.status &&
      prevProps.staff.name === nextProps.staff.name &&
      prevProps.rowIndex === nextProps.rowIndex &&
      prevProps.selectedCell?.rowIndex === nextProps.selectedCell?.rowIndex &&
      prevProps.selectedCell?.colIndex === nextProps.selectedCell?.colIndex
    );
  }
);
