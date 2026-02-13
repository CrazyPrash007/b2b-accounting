import React, { useState } from 'react';
import { X } from 'lucide-react';
import { usePayroll } from './usePayroll';

const CreatePayrollPeriodModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    periodName: '',
    fromDate: '',
    toDate: '',
    remarks: '',
  });

  const { createPayrollPeriod, loading } = usePayroll();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await createPayrollPeriod(formData);
      if (response.success) {
        alert('Payroll period created successfully');
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to create payroll period:', error);
      alert(error.response?.data?.message || 'Failed to create payroll period');
    }
  };

  const handleGeneratePeriodName = () => {
    if (formData.fromDate && formData.toDate) {
      const from = new Date(formData.fromDate);
      const to = new Date(formData.toDate);

      const fromMonth = from.toLocaleString('default', { month: 'short' });
      const toMonth = to.toLocaleString('default', { month: 'short' });
      const year = from.getFullYear();

      let name = '';
      if (fromMonth === toMonth) {
        name = `${fromMonth} ${year}`;
      } else {
        name = `${fromMonth} - ${toMonth} ${year}`;
      }

      setFormData((prev) => ({ ...prev, periodName: name }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 rounded-t-xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <h2 className="text-lg font-semibold text-white">Create Payroll Period</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date *
              </label>
              <input
                type="date"
                value={formData.fromDate}
                onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                onBlur={handleGeneratePeriodName}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date *
              </label>
              <input
                type="date"
                value={formData.toDate}
                onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                onBlur={handleGeneratePeriodName}
                required
                min={formData.fromDate}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Period Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Period Name *
            </label>
            <input
              type="text"
              value={formData.periodName}
              onChange={(e) => setFormData({ ...formData, periodName: e.target.value })}
              required
              placeholder="e.g., January 2026"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Auto-generated based on dates, can be customized
            </p>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              rows={3}
              placeholder="Any additional notes..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
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
              {loading ? 'Creating...' : 'Create Period'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePayrollPeriodModal;
