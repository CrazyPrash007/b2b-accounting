import React, { useState } from 'react';
import { X } from 'lucide-react';
import { usePayroll } from './usePayroll';

const EditDeductionsModal = ({ isOpen, onClose, calculation, onSuccess }) => {
  const [formData, setFormData] = useState({
    overtimePay: calculation.overtimePay || 0,
    bonuses: calculation.bonuses || 0,
    allowances: calculation.allowances || 0,
    advanceDeduction: calculation.advanceDeduction || 0,
    otherDeductions: calculation.otherDeductions || 0,
    remarks: calculation.remarks || '',
  });

  const { updatePayrollCalculation, loading } = usePayroll();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await updatePayrollCalculation(calculation._id, formData);
      if (response.success) {
        alert('Payroll updated successfully');
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to update payroll:', error);
      alert(error.response?.data?.message || 'Failed to update payroll');
    }
  };

  const calculateTotals = () => {
    const additions =
      parseFloat(formData.overtimePay || 0) +
      parseFloat(formData.bonuses || 0) +
      parseFloat(formData.allowances || 0);

    const deductions =
      parseFloat(formData.advanceDeduction || 0) + parseFloat(formData.otherDeductions || 0);

    const netSalary = calculation.finalSalary + additions - deductions;

    return { additions, deductions, netSalary };
  };

  const { additions, deductions, netSalary } = calculateTotals();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 rounded-t-xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div>
          <h2 className="text-lg font-semibold text-white">Edit Salary Components</h2>
          <p className="text-sm text-white/80 mt-1">{calculation.staffId?.name}</p>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded">
          <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Base Salary Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Calculated Salary (Based on Attendance):</span>
              <span className="font-semibold">{formatCurrency(calculation.finalSalary)}</span>
            </div>
            <div className="text-xs text-gray-500">
              {calculation.attendanceSummary?.totalPayableDays?.toFixed(1) || '0.0'} payable days
            </div>
          </div>

          {/* Additions */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Additions</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overtime Pay
                </label>
                <input
                  type="number"
                  value={formData.overtimePay}
                  onChange={(e) =>
                    setFormData({ ...formData, overtimePay: parseFloat(e.target.value) || 0 })
                  }
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bonuses</label>
                <input
                  type="number"
                  value={formData.bonuses}
                  onChange={(e) =>
                    setFormData({ ...formData, bonuses: parseFloat(e.target.value) || 0 })
                  }
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allowances</label>
                <input
                  type="number"
                  value={formData.allowances}
                  onChange={(e) =>
                    setFormData({ ...formData, allowances: parseFloat(e.target.value) || 0 })
                  }
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-between text-sm mt-3 pt-3 border-t border-gray-300">
              <span className="font-medium text-gray-700">Total Additions:</span>
              <span className="font-semibold text-green-600">{formatCurrency(additions)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Deductions</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advance Deduction
                </label>
                <input
                  type="number"
                  value={formData.advanceDeduction}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      advanceDeduction: parseFloat(e.target.value) || 0,
                    })
                  }
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Other Deductions
                </label>
                <input
                  type="number"
                  value={formData.otherDeductions}
                  onChange={(e) =>
                    setFormData({ ...formData, otherDeductions: parseFloat(e.target.value) || 0 })
                  }
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-between text-sm mt-3 pt-3 border-t border-gray-300">
              <span className="font-medium text-gray-700">Total Deductions:</span>
              <span className="font-semibold text-red-600">{formatCurrency(deductions)}</span>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              rows={3}
              placeholder="Any notes about additions or deductions..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Net Salary */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900">Net Salary:</span>
              <span className="text-2xl font-bold text-blue-600">{formatCurrency(netSalary)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Updating...' : 'Update Salary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDeductionsModal;
