// src/features/staff/StaffPage.jsx
import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useStaff } from './useStaff';
import StaffModal from './StaffModal';
import StaffDetailsModal from './StaffDetailsModal';
import StaffToolbar from './components/StaffToolbar';
import StaffTable from './components/StaffTable';
import StaffPagination from './components/StaffPagination';
import { CompanyContext } from 'src/App';
import { exportTableToExcel } from 'src/utils/excelExport';

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

export default function StaffPage() {
    const { selectedCompany } = useContext(CompanyContext);
    const {
        staff,
        pagination,
        loading,
        fetchStaff,
        createStaff,
        updateStaff,
        deleteStaff,
        toggleStaffStatus,
    } = useStaff();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [staffToDelete, setStaffToDelete] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedCell, setSelectedCell] = useState(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedStaffForDetails, setSelectedStaffForDetails] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageLimit, setPageLimit] = useState(50);

    const accountCompanyName = selectedCompany;
    const tableContainerRef = useRef(null);
    const [visibleRows, setVisibleRows] = useState(15);

    const loadStaff = useCallback(() => {
        if (accountCompanyName) {
            fetchStaff({
                accountCompanyName,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                search: searchQuery || undefined,
                page: currentPage,
                limit: pageLimit,
            });
        }
    }, [accountCompanyName, statusFilter, searchQuery, currentPage, pageLimit, fetchStaff]);

    useEffect(() => {
        loadStaff();
    }, [loadStaff]);

    // Reset to page 1 when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);

    // Calculate visible rows based on container height
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

    const handleOpenModal = (staffMember = null) => {
        setEditingStaff(staffMember);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingStaff(null);
    };

    const handleSubmit = async (data) => {
        try {
            const submitData = {
                ...data,
                accountCompanyName,
            };

            console.log('[Staff] Submitting data:', submitData); // Debug log

            if (editingStaff) {
                await updateStaff(editingStaff._id, submitData);
            } else {
                await createStaff(submitData);
            }
            handleCloseModal();
            loadStaff();
        } catch (error) {
            console.error('Error saving staff:', error);
            console.error('Error response:', error.response?.data); // Debug log
            
            // Extract validation errors if available
            const errorMsg = error.response?.data?.errors 
                ? error.response.data.errors.join(', ')
                : error.response?.data?.message 
                || error?.message 
                || 'Failed to save staff';
            
            alert(errorMsg);
        }
    };

    const handleDeleteClick = (staffMember) => {
        setStaffToDelete(staffMember);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (staffToDelete) {
            try {
                await deleteStaff(staffToDelete._id);
                loadStaff();
            } catch (error) {
                console.error('Error deleting staff:', error);
                alert(error?.message || 'Failed to delete staff');
            }
        }
        setDeleteConfirmOpen(false);
        setStaffToDelete(null);
    };

    const handleStatusChange = async (staffMember, newStatus) => {
        try {
            await toggleStaffStatus(staffMember._id, { status: newStatus });
            loadStaff();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleOpenDetailsModal = (staffMember) => {
        setSelectedStaffForDetails(staffMember);
        setDetailsModalOpen(true);
    };

    const handleCloseDetailsModal = () => {
        setDetailsModalOpen(false);
        setSelectedStaffForDetails(null);
    };

    const handleDetailsUpdate = () => {
        loadStaff();
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleLimitChange = (newLimit) => {
        setPageLimit(newLimit);
        setCurrentPage(1); // Reset to first page when changing limit
    };

    const handleExportToExcel = () => {
        const columns = [
            { header: 'Name', key: 'name' },
            { header: "Father's Name", key: 'fatherName' },
            { header: 'Date of Birth', key: 'dateOfBirth' },
            { header: 'Date of Joining', key: 'dateOfJoining' },
            { header: 'Mobile', key: 'mobile' },
            { header: 'Father Mobile', key: 'fatherMobileNumber' },
            { header: 'Aadhar No.', key: 'aadharNumber' },
            { header: 'Salary Type', key: 'salaryType' },
            { header: 'Salary Amount', key: 'salaryAmount' },
            { header: 'Sunday Included', key: 'sundayIncluded' },
            { header: 'Bank Account', key: 'bankAccountNumber' },
            { header: 'IFSC', key: 'bankIfscCode' },
            { header: 'Bank Name', key: 'bankName' },
            { header: 'Department', key: 'department' },
            { header: 'Designation', key: 'designation' },
            { header: 'Status', key: 'status' },
        ];

        const exportData = staff.map(s => ({
            name: s.name || '-',
            fatherName: s.fatherName || '-',
            dateOfBirth: s.dateOfBirth ? formatDate(s.dateOfBirth) : '-',
            dateOfJoining: formatDate(s.dateOfJoining),
            mobile: s.mobile || '-',
            fatherMobileNumber: s.fatherMobileNumber || '-',
            aadharNumber: s.aadharNumber || '-',
            salaryType: s.salaryType || '-',
            salaryAmount: s.salaryAmount ? `₹${s.salaryAmount}` : '-',
            sundayIncluded: s.sundayIncluded ? 'Yes' : 'No',
            bankAccountNumber: s.bankAccountNumber || '-',
            bankIfscCode: s.bankIfscCode || '-',
            bankName: s.bankName || '-',
            department: s.department || '-',
            designation: s.designation || '-',
            status: s.status || '-',
        }));

        exportTableToExcel(exportData, columns, 'Staff_Report', 'Staff');
    };

    const handleCellClick = (rowIndex, colIndex) => {
        setSelectedCell({ rowIndex, colIndex });
    };

    const handleTableContainerClick = (e) => {
        if (e.target === e.currentTarget) {
            setSelectedCell(null);
        }
    };

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

    // Filter staff based on search
    const filteredStaff = staff.filter(s => {
        const matchesSearch = !searchQuery ||
            (s.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (s.fatherName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (s.mobile?.includes(searchQuery)) ||
            (s.department?.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });

    const emptyRowsCount = Math.max(0, visibleRows - filteredStaff.length);
    const emptyRows = Array.from({ length: emptyRowsCount }, (_, i) => i);

    const totalRecords = filteredStaff.length;
    const startRecord = totalRecords > 0 ? 1 : 0;
    const endRecord = totalRecords;

    // Count by status
    const activeCount = staff.filter(s => s.status === 'active').length;
    const inactiveCount = staff.filter(s => s.status === 'inactive').length;
    const terminatedCount = staff.filter(s => s.status === 'terminated').length;

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header Row */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">Staff Master</h2>
                    <button className="text-gray-400 hover:text-yellow-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </button>
                    {/* Status summary badges */}
                    {staff.length > 0 && (
                        <div className="flex items-center gap-2 ml-2">
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                Active: {activeCount}
                            </span>
                            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                Inactive: {inactiveCount}
                            </span>
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                Terminated: {terminatedCount}
                            </span>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Staff
                </button>
            </div>

            {/* Toolbar - Filter and Search Controls */}
            <StaffToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                filteredCount={filteredStaff.length}
                totalCount={staff.length}
                onExport={handleExportToExcel}
            />

            {/* Table Container - Scrollable with horizontal scroll */}
            <div
                ref={tableContainerRef}
                className="flex-1 overflow-auto px-4 pb-1"
                onClick={handleTableContainerClick}
            >
                <StaffTable
                    staff={filteredStaff}
                    loading={loading}
                    visibleRows={visibleRows}
                    selectedCell={selectedCell}
                    onCellClick={handleCellClick}
                    onOpenModal={handleOpenModal}
                    onOpenDetailsModal={handleOpenDetailsModal}
                    onStatusChange={handleStatusChange}
                    getCellClasses={getCellClasses}
                />
            </div>

            {/* Footer - Pagination */}
            <StaffPagination
                pagination={pagination || {
                    total: totalRecords,
                    page: currentPage,
                    limit: pageLimit,
                    totalPages: Math.ceil(totalRecords / pageLimit),
                    hasNextPage: currentPage < Math.ceil(totalRecords / pageLimit),
                    hasPrevPage: currentPage > 1
                }}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
            />

            {/* Staff Modal */}
            <StaffModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                onDelete={handleDeleteClick}
                editData={editingStaff}
                loading={loading}
            />

            {/* Delete Confirmation Dialog */}
            {deleteConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => e.target === e.currentTarget && setDeleteConfirmOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 rounded-t-xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                            <h3 className="text-lg font-semibold text-white">Delete Staff Member</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to permanently delete "<span className="font-semibold">{staffToDelete?.name}</span>"? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setDeleteConfirmOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Staff Details Modal */}
            <StaffDetailsModal
                isOpen={detailsModalOpen}
                onClose={handleCloseDetailsModal}
                staffData={selectedStaffForDetails}
                onUpdate={handleDetailsUpdate}
            />
        </div>
    );
}
