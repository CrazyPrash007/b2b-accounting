// src/features/staff/StaffDetailsModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { staffApi } from './staff.api';
import SalaryIncreaseModal from './SalaryIncreaseModal';

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0';
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

export default function StaffDetailsModal({ isOpen, onClose, staffData, onUpdate }) {
    const [salaryHistory, setSalaryHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSalaryIncreaseModal, setShowSalaryIncreaseModal] = useState(false);
    const [increaseSalaryLoading, setIncreaseSalaryLoading] = useState(false);

    const fetchSalaryHistory = useCallback(async () => {
        if (!staffData?._id) return;

        setLoading(true);
        try {
            const response = await staffApi.getSalaryHistory(staffData._id);
            if (response.success) {
                setSalaryHistory(response.data.history || []);
            }
        } catch (error) {
            console.error('Error fetching salary history:', error);
        } finally {
            setLoading(false);
        }
    }, [staffData?._id]);

    useEffect(() => {
        if (isOpen && staffData?._id) {
            fetchSalaryHistory();
        }
    }, [isOpen, fetchSalaryHistory, staffData?._id]);

    const handleSalaryIncrease = async (increaseData) => {
        setIncreaseSalaryLoading(true);
        try {
            const response = await staffApi.addSalaryIncrease(staffData._id, increaseData);
            if (response.success) {
                setShowSalaryIncreaseModal(false);
                await fetchSalaryHistory();
                if (onUpdate) {
                    onUpdate();
                }
            } else {
                alert(response.message || 'Failed to add salary increase');
            }
        } catch (error) {
            console.error('Error adding salary increase:', error);
            alert(error.message || 'Failed to add salary increase');
        } finally {
            setIncreaseSalaryLoading(false);
        }
    };

    if (!isOpen) return null;

    // Find initial salary (first entry or current if no history)
    const initialSalary = salaryHistory.length > 0 
        ? salaryHistory[0].previousSalary 
        : staffData?.salaryAmount || 0;

    // Sort salary history by effective date (most recent first)
    const sortedHistory = [...salaryHistory].sort(
        (a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate)
    );

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => e.target === e.currentTarget && onClose()}>
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-6 py-4 rounded-t-xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <h3 className="text-lg font-semibold text-white">
                            Staff Details
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="p-6 space-y-6 overflow-y-auto flex-1">
                        {/* Personal Information */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">Personal Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Name</div>
                                    <div className="text-sm font-medium text-gray-900">{staffData?.name || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Father's Name</div>
                                    <div className="text-sm text-gray-900">{staffData?.fatherName || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Date of Birth</div>
                                    <div className="text-sm text-gray-900">{formatDate(staffData?.dateOfBirth)}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Date of Joining</div>
                                    <div className="text-sm text-gray-900">{formatDate(staffData?.dateOfJoining)}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Mobile Number</div>
                                    <div className="text-sm text-gray-900">{staffData?.mobile || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Father Mobile Number</div>
                                    <div className="text-sm text-gray-900">{staffData?.fatherMobileNumber || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Email</div>
                                    <div className="text-sm text-gray-900">{staffData?.email || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Status</div>
                                    <div>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${statusColors[staffData?.status] || ''}`}>
                                            {staffData?.status || '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Department & Role */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">Department & Role</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Department</div>
                                    <div className="text-sm text-gray-900">{staffData?.department || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Designation</div>
                                    <div className="text-sm text-gray-900">{staffData?.designation || '-'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Salary Information */}
                        <div>
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-800">Salary Information</h4>
                                <button
                                    onClick={() => setShowSalaryIncreaseModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Increase Salary
                                </button>
                            </div>

                            {/* Current Salary */}
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200 mb-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-xs text-gray-600 mb-1">Initial Salary</div>
                                        <div className="text-lg font-bold text-gray-900">{formatCurrency(initialSalary)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-600 mb-1">Total Increases</div>
                                        <div className="text-lg font-bold text-green-600">
                                            {salaryHistory.length > 0 
                                                ? formatCurrency(salaryHistory.reduce((sum, h) => sum + h.increaseAmount, 0))
                                                : formatCurrency(0)
                                            }
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-600 mb-1">Current Salary</div>
                                        <div className="text-xl font-bold text-blue-600">{formatCurrency(staffData?.salaryAmount || 0)}</div>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-blue-200 grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-gray-600 mb-1">Salary Type</div>
                                        <div className="text-sm font-medium text-gray-900 capitalize">{staffData?.salaryType || '-'}</div>
                                    </div>
                                    {staffData?.salaryType === 'monthly' && (
                                        <div>
                                            <div className="text-xs text-gray-600 mb-1">Sunday Included</div>
                                            <div className="text-sm font-medium text-gray-900">{staffData?.sundayIncluded ? 'Yes' : 'No'}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Salary History */}
                            <div>
                                <h5 className="text-sm font-semibold text-gray-700 mb-2">Salary Increase History</h5>
                                {loading ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <svg className="w-6 h-6 animate-spin mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Loading salary history...
                                    </div>
                                ) : sortedHistory.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-sm">No salary increases yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {sortedHistory.map((record, index) => (
                                            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                                {formatDate(record.effectiveDate)}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-4 mt-2">
                                                            <div>
                                                                <div className="text-xs text-gray-500">Previous</div>
                                                                <div className="text-sm font-medium text-gray-700">{formatCurrency(record.previousSalary)}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xs text-gray-500">Increase</div>
                                                                <div className="text-sm font-semibold text-green-600">+{formatCurrency(record.increaseAmount)}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xs text-gray-500">New Salary</div>
                                                                <div className="text-sm font-bold text-blue-600">{formatCurrency(record.newSalary)}</div>
                                                            </div>
                                                        </div>
                                                        {record.remarks && (
                                                            <div className="mt-2 text-xs text-gray-600 italic">
                                                                <span className="font-medium">Note:</span> {record.remarks}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bank Information */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">Bank Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Bank Account Number</div>
                                    <div className="text-sm font-mono text-gray-900">{staffData?.bankAccountNumber || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">IFSC Code</div>
                                    <div className="text-sm font-mono text-gray-900 uppercase">{staffData?.bankIfscCode || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Bank Name</div>
                                    <div className="text-sm text-gray-900">{staffData?.bankName || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">UPI ID</div>
                                    <div className="text-sm text-gray-900">{staffData?.upiId || '-'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Salary Increase Modal */}
            <SalaryIncreaseModal
                isOpen={showSalaryIncreaseModal}
                onClose={() => setShowSalaryIncreaseModal(false)}
                onSubmit={handleSalaryIncrease}
                staffData={staffData}
                loading={increaseSalaryLoading}
            />
        </>
    );
}
