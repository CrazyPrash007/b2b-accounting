// src/features/staff/StaffPage.jsx
import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useStaff } from './useStaff';
import StaffModal from './StaffModal';
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

    const accountCompanyName = selectedCompany;
    const tableContainerRef = useRef(null);
    const [visibleRows, setVisibleRows] = useState(15);

    const loadStaff = useCallback(() => {
        if (accountCompanyName) {
            fetchStaff({
                accountCompanyName,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                search: searchQuery || undefined,
            });
        }
    }, [accountCompanyName, statusFilter, searchQuery, fetchStaff]);

    useEffect(() => {
        loadStaff();
    }, [loadStaff]);

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

            if (editingStaff) {
                await updateStaff(editingStaff._id, submitData);
            } else {
                await createStaff(submitData);
            }
            handleCloseModal();
            loadStaff();
        } catch (error) {
            console.error('Error saving staff:', error);
            alert(error?.message || 'Failed to save staff');
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

    const handleExportToExcel = () => {
        const columns = [
            { header: 'Name', key: 'name' },
            { header: "Father's Name", key: 'fatherName' },
            { header: 'Date of Birth', key: 'dateOfBirth' },
            { header: 'Date of Joining', key: 'dateOfJoining' },
            { header: 'Mobile', key: 'mobile' },
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
            <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by name, mobile, department..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="terminated">Terminated</option>
                    </select>

                    {/* Results count */}
                    <span className="text-sm text-gray-600">
                        {filteredStaff.length} of {staff.length} staff
                    </span>
                </div>

                <button
                    onClick={handleExportToExcel}
                    className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded text-sm"
                    title="Export to Excel"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export to Excel
                </button>
            </div>

            {/* Table Container - Scrollable with horizontal scroll */}
            <div
                ref={tableContainerRef}
                className="flex-1 overflow-auto px-4 pb-1"
                onClick={handleTableContainerClick}
            >
                <div className="border border-gray-400 rounded overflow-hidden h-full">
                    <div className="overflow-x-auto h-full">
                        <table className="min-w-[2200px] w-full border-collapse text-sm" style={{ borderSpacing: 0 }}>
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
                                    <th className="min-w-[100px] h-9 px-4 text-left text-sm font-medium text-gray-700 sticky right-0 z-20 bg-gray-100 border-l border-gray-400" style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.15)' }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Loading state */}
                                {loading && filteredStaff.length === 0 && (
                                    <tr>
                                        <td colSpan={16} className="text-center py-10">
                                            <div className="flex items-center justify-center text-gray-500">
                                                <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Loading staff...
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {/* Data rows */}
                                {filteredStaff.map((s, rowIndex) => (
                                    <tr
                                        key={s._id || rowIndex}
                                        className={`border-b border-gray-400 hover:bg-blue-100 transition-colors cursor-pointer ${rowIndex % 2 === 0 ? 'bg-blue-50/40' : 'bg-white'}`}
                                        onClick={() => handleOpenModal(s)}
                                    >
                                        <td
                                            className={getCellClasses(rowIndex, 0) + " text-left text-blue-600 font-medium"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 0); handleOpenModal(s); }}
                                        >
                                            {s.name}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 1) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 1); }}
                                        >
                                            {s.fatherName || "-"}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 2) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 2); }}
                                        >
                                            {formatDate(s.dateOfBirth)}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 3) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 3); }}
                                        >
                                            {formatDate(s.dateOfJoining)}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 4) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 4); }}
                                        >
                                            {s.mobile || "-"}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 5) + " text-left text-gray-600 font-mono"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 5); }}
                                        >
                                            {s.aadharNumber || "-"}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 6) + " text-left text-gray-600 capitalize"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 6); }}
                                        >
                                            {s.salaryType}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 7) + " text-right text-gray-900 font-medium"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 7); }}
                                        >
                                            {formatCurrency(s.salaryAmount)}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 8) + " text-center"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 8); }}
                                        >
                                            {s.salaryType === 'monthly' ? (
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${s.sundayIncluded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                    {s.sundayIncluded ? 'Yes' : 'No'}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 9) + " text-left text-gray-600 font-mono"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 9); }}
                                        >
                                            {s.bankAccountNumber || "-"}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 10) + " text-left text-gray-600 font-mono uppercase"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 10); }}
                                        >
                                            {s.bankIfscCode || "-"}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 11) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 11); }}
                                        >
                                            {s.bankName || "-"}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 12) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 12); }}
                                        >
                                            {s.department || "-"}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 13) + " text-left text-gray-600"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 13); }}
                                        >
                                            {s.designation || "-"}
                                        </td>
                                        <td
                                            className={getCellClasses(rowIndex, 14) + " text-left"}
                                            onClick={(e) => { e.stopPropagation(); handleCellClick(rowIndex, 14); }}
                                        >
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${statusColors[s.status] || ''}`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className={`h-8 px-4 text-left sticky right-0 z-10 border-l border-gray-400 ${rowIndex % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`} style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.1)' }} onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleOpenModal(s); }}
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
                                                            {s.status !== 'active' && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(s, 'active'); }}
                                                                    className="w-full text-left px-3 py-1.5 text-sm text-green-700 hover:bg-green-50"
                                                                >
                                                                    Set Active
                                                                </button>
                                                            )}
                                                            {s.status !== 'inactive' && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(s, 'inactive'); }}
                                                                    className="w-full text-left px-3 py-1.5 text-sm text-yellow-700 hover:bg-yellow-50"
                                                                >
                                                                    Set Inactive
                                                                </button>
                                                            )}
                                                            {s.status !== 'terminated' && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(s, 'terminated'); }}
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
                                ))}

                                {/* Empty rows to fill space */}
                                {!loading && emptyRows.map((_, idx) => {
                                    const rowIndex = filteredStaff.length + idx;
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
                                            <td className={getCellClasses(rowIndex, 14)} onClick={() => handleCellClick(rowIndex, 14)}></td>
                                            <td className={`h-8 px-4 sticky right-0 z-10 border-l border-gray-400 ${rowIndex % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`} style={{ boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.1)' }}></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-200 text-sm text-blue-600 bg-white">
                {totalRecords > 0 ? `${startRecord}-${endRecord} of ${totalRecords} Records` : '0 Records'}
            </div>

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
        </div>
    );
}
