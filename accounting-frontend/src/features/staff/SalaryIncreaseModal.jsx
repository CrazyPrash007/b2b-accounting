// src/features/staff/SalaryIncreaseModal.jsx
import React, { useState, useEffect } from 'react';

const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function SalaryIncreaseModal({ isOpen, onClose, onSubmit, staffData, loading }) {
    const [formData, setFormData] = useState({
        effectiveDate: new Date().toISOString().split('T')[0],
        increaseAmount: '',
        remarks: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            // Reset form when opening
            setFormData({
                effectiveDate: new Date().toISOString().split('T')[0],
                increaseAmount: '',
                remarks: ''
            });
            setErrors({});
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.effectiveDate) {
            newErrors.effectiveDate = 'Effective date is required';
        }

        if (!formData.increaseAmount || parseFloat(formData.increaseAmount) <= 0) {
            newErrors.increaseAmount = 'Increase amount must be greater than 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            const submitData = {
                effectiveDate: formData.effectiveDate,
                increaseAmount: parseFloat(formData.increaseAmount),
                remarks: formData.remarks
            };
            onSubmit(submitData);
        }
    };

    if (!isOpen) return null;

    const currentSalary = staffData?.salaryAmount || 0;
    const increaseAmount = parseFloat(formData.increaseAmount) || 0;
    const newSalary = currentSalary + increaseAmount;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 rounded-t-xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <h3 className="text-lg font-semibold text-white">
                        Increase Salary
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

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Staff Info */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-sm text-gray-600 mb-1">Staff Member</div>
                        <div className="text-lg font-semibold text-gray-900">{staffData?.name}</div>
                        <div className="text-sm text-gray-600 mt-2">Current Salary</div>
                        <div className="text-xl font-bold text-blue-600">{formatCurrency(currentSalary)}</div>
                    </div>

                    {/* Effective Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Effective Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="effectiveDate"
                            value={formData.effectiveDate}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.effectiveDate ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.effectiveDate && <p className="text-xs text-red-500 mt-1">{errors.effectiveDate}</p>}
                    </div>

                    {/* Increase Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Salary Increase Amount (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="increaseAmount"
                            value={formData.increaseAmount}
                            onChange={handleChange}
                            placeholder="Enter increase amount"
                            min="0"
                            step="0.01"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.increaseAmount ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.increaseAmount && <p className="text-xs text-red-500 mt-1">{errors.increaseAmount}</p>}
                    </div>

                    {/* New Salary Preview */}
                    {formData.increaseAmount && parseFloat(formData.increaseAmount) > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-gray-600">New Salary</div>
                                    <div className="text-xl font-bold text-green-600">{formatCurrency(newSalary)}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-600">Increase</div>
                                    <div className="text-lg font-semibold text-green-600">+{formatCurrency(increaseAmount)}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Remarks */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Remarks (Optional)
                        </label>
                        <textarea
                            name="remarks"
                            value={formData.remarks}
                            onChange={handleChange}
                            placeholder="Enter any additional notes..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            Apply Increase
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
