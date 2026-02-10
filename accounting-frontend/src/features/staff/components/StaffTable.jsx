// src/features/staff/components/StaffTable.jsx
import React from 'react';
import StaffTableRow from './StaffTableRow';

/**
 * Staff table component with header and body
 * Handles loading states, empty states, and row rendering
 */
const StaffTable = ({
  staff,
  loading,
  visibleRows,
  selectedCell,
  onCellClick,
  onOpenModal,
  onOpenDetailsModal,
  onStatusChange,
  getCellClasses,
}) => {
  // Calculate empty rows to fill space
  const emptyRowsCount = Math.max(0, visibleRows - staff.length);
  const emptyRows = Array.from({ length: emptyRowsCount }, (_, i) => i);

  return (
    <div className="border border-gray-400 rounded overflow-hidden h-full">
      <div className="overflow-x-auto h-full">
        <table
          className="min-w-[2250px] w-full border-collapse text-sm"
          style={{ borderSpacing: 0 }}
        >
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-gray-400">
              <th className="min-w-[150px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 cursor-grab">⋮⋮</span>
                  <span>Name</span>
                </div>
              </th>
              <th className="min-w-[140px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 cursor-grab">⋮⋮</span>
                  <span>Father's Name</span>
                </div>
              </th>
              <th className="min-w-[100px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 cursor-grab">⋮⋮</span>
                  <span>DOB</span>
                </div>
              </th>
              <th className="min-w-[100px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 cursor-grab">⋮⋮</span>
                  <span>DOJ</span>
                </div>
              </th>
              <th className="min-w-[110px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 cursor-grab">⋮⋮</span>
                  <span>Mobile</span>
                </div>
              </th>
              <th className="min-w-[130px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 cursor-grab">⋮⋮</span>
                  <span>Aadhar No.</span>
                </div>
              </th>
              <th className="min-w-[100px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 cursor-grab">⋮⋮</span>
                  <span>Salary Type</span>
                </div>
              </th>
              <th className="min-w-[100px] h-9 px-4 text-right text-sm font-medium text-gray-700 border-r border-gray-400">
                <div className="flex items-center justify-end gap-2">
                  <span>Salary</span>
                  <span className="text-gray-400 cursor-grab">⋮⋮</span>
                </div>
              </th>
              <th className="min-w-[80px] h-9 px-4 text-center text-sm font-medium text-gray-700 border-r border-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <span>Sunday</span>
                </div>
              </th>
              <th className="min-w-[140px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 cursor-grab">⋮⋮</span>
                  <span>Bank Account</span>
                </div>
              </th>
              <th className="min-w-[100px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 cursor-grab">⋮⋮</span>
                  <span>IFSC</span>
                </div>
              </th>
              <th className="min-w-[120px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 cursor-grab">⋮⋮</span>
                  <span>Bank Name</span>
                </div>
              </th>
              <th className="min-w-[100px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 cursor-grab">⋮⋮</span>
                  <span>Department</span>
                </div>
              </th>
              <th className="min-w-[100px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 cursor-grab">⋮⋮</span>
                  <span>Designation</span>
                </div>
              </th>
              <th className="min-w-[90px] h-9 px-4 text-left text-sm font-medium text-gray-700 border-r border-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 cursor-grab">⋮⋮</span>
                  <span>Status</span>
                </div>
              </th>
              <th
                className="min-w-[150px] h-9 px-4 text-left text-sm font-medium text-gray-700 sticky right-0 z-20 bg-gray-100 border-l border-gray-400"
                style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.15)' }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Loading state */}
            {loading && staff.length === 0 && (
              <tr>
                <td colSpan={16} className="text-center py-10">
                  <div className="flex items-center justify-center text-gray-500">
                    <svg
                      className="w-5 h-5 animate-spin mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Loading staff...
                  </div>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {staff.map((staffMember, rowIndex) => (
              <StaffTableRow
                key={staffMember._id || rowIndex}
                staff={staffMember}
                rowIndex={rowIndex}
                selectedCell={selectedCell}
                onCellClick={onCellClick}
                onOpenModal={onOpenModal}
                onOpenDetailsModal={onOpenDetailsModal}
                onStatusChange={onStatusChange}
                getCellClasses={getCellClasses}
              />
            ))}

            {/* Empty rows to fill space */}
            {!loading &&
              emptyRows.map((_, idx) => {
                const rowIndex = staff.length + idx;
                return (
                  <tr
                    key={`empty-${idx}`}
                    className={`border-b border-gray-400 hover:bg-blue-100 transition-colors ${
                      rowIndex % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'
                    }`}
                  >
                    {Array.from({ length: 15 }, (_, colIdx) => (
                      <td
                        key={colIdx}
                        className={getCellClasses(rowIndex, colIdx)}
                        onClick={() => onCellClick(rowIndex, colIdx)}
                      ></td>
                    ))}
                    <td
                      className={`h-8 px-4 sticky right-0 z-10 border-l border-gray-400 ${
                        rowIndex % 2 === 0 ? 'bg-blue-50' : 'bg-white'
                      }`}
                      style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.1)' }}
                    ></td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(StaffTable);
