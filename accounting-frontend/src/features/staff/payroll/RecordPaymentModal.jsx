import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { usePayroll } from './usePayroll';
import apiClient from 'src/services/apiClient';

const RecordPaymentModal = ({ isOpen, onClose, calculation, onSuccess }) => {
  const [formData, setFormData] = useState({
    paidAmount: calculation.netSalary - (calculation.paidAmount || 0),
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'bank-transfer',
    paymentReference: '',
    remarks: '',
    bankId: '',
  });

  const [banks, setBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  const { recordPayment, loading } = usePayroll();

  // Fetch bank accounts
  useEffect(() => {
    const fetchBanks = async () => {
      setLoadingBanks(true);
      try {
        const response = await apiClient.get('/api/bank');
        const bankData = response.data?.data || response.data || [];
        setBanks(Array.isArray(bankData) ? bankData.filter(b => b.isActive !== false) : []);
      } catch (error) {
        console.error('Failed to fetch banks:', error);
      } finally {
        setLoadingBanks(false);
      }
    };
    fetchBanks();
  }, []);

  const isBankPayment = formData.paymentMode !== 'cash';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isBankPayment && !formData.bankId) {
      alert('Please select a bank account for non-cash payments');
      return;
    }

    try {
      const payload = {
        payrollCalculationId: calculation._id,
        paidAmount: formData.paidAmount,
        paymentDate: formData.paymentDate,
        paymentMode: formData.paymentMode,
        paymentReference: formData.paymentReference,
        remarks: formData.remarks,
      };
      if (isBankPayment && formData.bankId) {
        payload.bankId = formData.bankId;
      }

      const response = await recordPayment(payload);

      if (response.success) {
        alert('Payment recorded successfully');
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to record payment:', error);
      alert(error.response?.data?.message || 'Failed to record payment');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen) return null;

  const remainingAmount = calculation.netSalary - (calculation.paidAmount || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 rounded-t-xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div>
          <h2 className="text-lg font-semibold text-white">Record Payment</h2>
          <p className="text-sm text-white/80 mt-1">{calculation.staffId?.name}</p>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded">
          <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Net Salary:</span>
              <span className="font-medium">{formatCurrency(calculation.netSalary)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Already Paid:</span>
              <span className="font-medium">{formatCurrency(calculation.paidAmount || 0)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-300">
              <span className="text-gray-900 font-medium">Remaining:</span>
              <span className="font-bold text-green-600">{formatCurrency(remainingAmount)}</span>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount *
            </label>
            <input
              type="number"
              value={formData.paidAmount}
              onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) })}
              required
              min="0"
              max={remainingAmount}
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date *
            </label>
            <input
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Mode *
            </label>
            <select
              value={formData.paymentMode}
              onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value, bankId: '' })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cash">Cash</option>
              <option value="bank-transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          {/* Bank Account Selection (shown for non-cash payments) */}
          {isBankPayment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Account *
              </label>
              {loadingBanks ? (
                <p className="text-sm text-gray-500">Loading banks...</p>
              ) : banks.length === 0 ? (
                <p className="text-sm text-red-500">No bank accounts found. Please add a bank account first.</p>
              ) : (
                <select
                  value={formData.bankId}
                  onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Bank Account</option>
                  {banks.map((bank) => (
                    <option key={bank._id} value={bank._id}>
                      {bank.accountDisplayName || bank.bankName} {bank.accountNumber ? `(${bank.accountNumber})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Payment Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Reference
            </label>
            <input
              type="text"
              value={formData.paymentReference}
              onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
              placeholder="Transaction ID, Cheque No., etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              rows={2}
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
              disabled={loading || (isBankPayment && !formData.bankId)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordPaymentModal;
