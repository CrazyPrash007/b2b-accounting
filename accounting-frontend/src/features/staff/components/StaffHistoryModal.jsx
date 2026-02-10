// StaffHistoryModal.jsx - Complete staff history view (attendance, payroll, salary history)
import React, { useState, useEffect, useContext } from "react";
import { CompanyContext } from "src/App";
import apiClient from "src/services/apiClient";

/**
 * StaffHistoryModal - Display complete staff history
 * Shows attendance records, payroll calculations, and salary increase history
 */
export default function StaffHistoryModal({ isOpen, onClose, staff }) {
    const context = useContext(CompanyContext);
    const selectedCompany = context?.selectedCompany || "";

    const [historyData, setHistoryData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("attendance");
    
    // Date filters - view-level only
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [allAttendance, setAllAttendance] = useState([]);
    const [allPayroll, setAllPayroll] = useState([]);
    const [filteredAttendance, setFilteredAttendance] = useState([]);
    const [filteredPayroll, setFilteredPayroll] = useState([]);

    useEffect(() => {
        if (isOpen && staff && selectedCompany) {
            fetchData();
        }
        
        async function fetchData() {
            setLoading(true);
            setError(null);
            
            try {
                const params = {
                    accountCompanyName: selectedCompany
                };
                
                const response = await apiClient.get(`/api/staff/${staff._id || staff.id}/complete-history`, {
                    params
                });

                if (response?.data?.success && response.data.data) {
                    const data = response.data.data;
                    console.log('Staff history data received:', data);
                    console.log('Attendance records sample:', data.attendanceRecords?.[0]);
                    setHistoryData(data);
                    setAllAttendance(data.attendanceRecords || []);
                    setAllPayroll(data.payrollCalculations || []);
                    setFilteredAttendance(data.attendanceRecords || []);
                    setFilteredPayroll(data.payrollCalculations || []);
                }
            } catch (err) {
                console.error("Failed to fetch staff history:", err);
                setError(err?.response?.data?.message || "Failed to load staff history");
            } finally {
                setLoading(false);
            }
        }
    }, [isOpen, staff, selectedCompany]);

    // Apply date filter
    useEffect(() => {
        if (!fromDate && !toDate) {
            setFilteredAttendance(allAttendance);
            setFilteredPayroll(allPayroll);
            return;
        }
        
        const filterByDate = (records, dateField = 'date') => {
            return records.filter(r => {
                const recordDate = new Date(r[dateField]);
                if (fromDate && toDate) {
                    const from = new Date(fromDate);
                    const to = new Date(toDate);
                    to.setHours(23, 59, 59, 999);
                    return recordDate >= from && recordDate <= to;
                } else if (fromDate) {
                    return recordDate >= new Date(fromDate);
                } else if (toDate) {
                    const to = new Date(toDate);
                    to.setHours(23, 59, 59, 999);
                    return recordDate <= to;
                }
                return true;
            });
        };

        setFilteredAttendance(filterByDate(allAttendance, 'date'));
        setFilteredPayroll(filterByDate(allPayroll, 'fromDate'));
    }, [fromDate, toDate, allAttendance, allPayroll]);

    const handleClearFilter = () => {
        setFromDate("");
        setToDate("");
        setFilteredAttendance(allAttendance);
        setFilteredPayroll(allPayroll);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return "-";
        // checkInTime/checkOutTime are stored as "HH:mm" strings (24-hour format)
        // Convert to 12-hour format with AM/PM for better readability
        try {
            const [hours, minutes] = timeStr.split(':');
            const hour = parseInt(hours, 10);
            const isAM = hour < 12;
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            const period = isAM ? 'AM' : 'PM';
            return `${displayHour}:${minutes} ${period}`;
        } catch {
            // If parsing fails, return original string
            return timeStr;
        }
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return "-";
        return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    const getStatusBadge = (status) => {
        const badges = {
            present: 'bg-green-100 text-green-800',
            absent: 'bg-red-100 text-red-800',
            'half-day': 'bg-yellow-100 text-yellow-800',
            leave: 'bg-blue-100 text-blue-800',
            holiday: 'bg-purple-100 text-purple-800',
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const getPaymentStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            partial: 'bg-orange-100 text-orange-800',
            paid: 'bg-green-100 text-green-800',
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    if (!isOpen) return null;

    const staffName = staff?.name || "Staff Member";
    const attendanceSummary = historyData?.attendanceSummary || {};
    const salarySummary = historyData?.salarySummary || {};
    const salaryHistory = historyData?.staff?.salaryHistory || [];

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">{staffName}</h1>
                            <p className="text-sm text-gray-500">Complete History</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {staff?.department && (
                            <span className="text-sm text-gray-600">
                                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {staff.department}
                            </span>
                        )}
                        {staff?.designation && (
                            <span className="text-sm text-gray-600">
                                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {staff.designation}
                            </span>
                        )}
                        {staff?.mobile && (
                            <span className="text-sm text-gray-600">
                                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {staff.mobile}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Current Salary</p>
                        <p className="text-xl font-semibold text-blue-700">
                            {formatCurrency(historyData?.staff?.salaryAmount || 0)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 capitalize">
                            {historyData?.staff?.salaryType || 'monthly'}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Total Attendance</p>
                        <p className="text-xl font-semibold text-green-700">{attendanceSummary.totalPresent || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">{attendanceSummary.totalRecords || 0} records</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Total Earned</p>
                        <p className="text-xl font-semibold text-indigo-700">{formatCurrency(salarySummary.totalEarned || 0)}</p>
                        <p className="text-xs text-gray-400 mt-1">{salarySummary.totalPayrolls || 0} payrolls</p>
                    </div>
                    <div className={`rounded-lg p-4 border border-gray-200 shadow-sm ${salarySummary.totalPending > 0 ? 'bg-orange-50' : 'bg-white'}`}>
                        <p className="text-sm text-gray-500 mb-1">Pending Payment</p>
                        <p className={`text-xl font-semibold ${salarySummary.totalPending > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                            {formatCurrency(salarySummary.totalPending || 0)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {salarySummary.totalPending > 0 ? 'Unpaid' : 'All settled'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="px-6 py-3 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {(fromDate || toDate) && (
                        <div className="mt-5">
                            <button
                                onClick={handleClearFilter}
                                className="px-4 py-1.5 bg-gray-500 text-white text-sm font-medium rounded hover:bg-gray-600 transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-gray-200">
                <div className="flex gap-1">
                    {[
                        { key: 'attendance', label: 'Attendance', count: filteredAttendance.length },
                        { key: 'payroll', label: 'Payroll', count: filteredPayroll.length },
                        { key: 'salary', label: 'Salary History', count: salaryHistory.length },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                                    ? 'text-blue-600 border-blue-600'
                                    : 'text-gray-500 border-transparent hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto px-6 py-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-red-500">{error}</div>
                    </div>
                ) : (
                    <>
                        {/* Attendance Tab */}
                        {activeTab === 'attendance' && (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                {filteredAttendance.length === 0 ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-gray-500">No attendance records found</div>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Check In</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Check Out</th>
                                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Late Entry</th>
                                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Early Exit</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Payable Days</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {filteredAttendance.map((record, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                                                        {formatDate(record.date)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(record.status)}`}>
                                                            {record.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">
                                                        {formatTime(record.checkInTime)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">
                                                        {formatTime(record.checkOutTime)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {record.isLateEntry ? (
                                                            <span className="text-red-600">✓</span>
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {record.isEarlyExit ? (
                                                            <span className="text-orange-600">✓</span>
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-700">
                                                        {record.payableDays?.toFixed(1) || '0.0'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {record.remarks || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {/* Payroll Tab */}
                        {activeTab === 'payroll' && (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                {filteredPayroll.length === 0 ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-gray-500">No payroll records found</div>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Period</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Duration</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Base Salary</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Payable Days</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Net Salary</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Paid Amount</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Payment Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {filteredPayroll.map((record, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                                        {record.payrollPeriodId?.periodName || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">
                                                        {formatDate(record.fromDate)} - {formatDate(record.toDate)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right text-gray-700">
                                                        {formatCurrency(record.baseSalary)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-700">
                                                        {record.attendanceSummary?.totalPayableDays?.toFixed(1) || '0.0'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-semibold text-blue-700">
                                                        {formatCurrency(record.netSalary)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                                                        {formatCurrency(record.paidAmount || 0)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getPaymentStatusBadge(record.paymentStatus)}`}>
                                                            {record.paymentStatus}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">
                                                        {formatDate(record.paymentDate)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {/* Salary History Tab */}
                        {activeTab === 'salary' && (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                {salaryHistory.length === 0 ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-gray-500">No salary increase history found</div>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Effective Date</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Previous Salary</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Increase Amount</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">New Salary</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {[...salaryHistory].reverse().map((record, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                                        {formatDate(record.effectiveDate)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right text-gray-700">
                                                        {formatCurrency(record.previousSalary)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                                                        +{formatCurrency(record.increaseAmount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-semibold text-blue-700">
                                                        {formatCurrency(record.newSalary)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {record.remarks || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
