import React, { useState, useEffect } from 'react';
import { FileText, IndianRupee, Edit, CheckSquare } from 'lucide-react';
import { usePayroll } from './usePayroll';
import RecordPaymentModal from './RecordPaymentModal';
import EditDeductionsModal from './EditDeductionsModal';
import BulkPaymentModal from './BulkPaymentModal';

const PayrollCalculationsView = ({ periodId, onViewPayslip, onRefresh }) => {
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false);
  const [selectedCalculation, setSelectedCalculation] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const { getPayrollCalculations } = usePayroll();

  useEffect(() => {
    if (periodId) {
      loadCalculations();
    }
  }, [periodId]);

  const loadCalculations = async () => {
    setLoading(true);
    try {
      const response = await getPayrollCalculations(periodId);
      if (response.success) {
        setCalculations(response.data);
      }
    } catch (error) {
      console.error('Failed to load calculations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = (calculation) => {
    setSelectedCalculation(calculation);
    setShowPaymentModal(true);
  };

  const handleEditDeductions = (calculation) => {
    setSelectedCalculation(calculation);
    setShowEditModal(true);
  };

  const unpaidCalculations = calculations.filter(c => c.paymentStatus !== 'paid');

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === unpaidCalculations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unpaidCalculations.map(c => c._id)));
    }
  };

  const selectedCalculations = calculations.filter(c => selectedIds.has(c._id) && c.paymentStatus !== 'paid');

  const handleBulkPay = () => {
    if (selectedCalculations.length === 0) {
      alert('Please select at least one unpaid staff member');
      return;
    }
    setShowBulkPaymentModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-orange-100 text-orange-800',
      paid: 'bg-green-100 text-green-800',
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badges[status] || badges.pending}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">Loading calculations...</p>
      </div>
    );
  }

  if (calculations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No salary calculations found</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Bulk actions toolbar */}
        {unpaidCalculations.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <CheckSquare className={`w-4 h-4 ${selectedIds.size === unpaidCalculations.length && unpaidCalculations.length > 0 ? 'text-blue-600' : ''}`} />
                {selectedIds.size === unpaidCalculations.length && unpaidCalculations.length > 0 ? 'Deselect All' : 'Select All Unpaid'}
              </button>
              {selectedIds.size > 0 && (
                <span className="text-sm text-gray-500">({selectedIds.size} selected)</span>
              )}
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkPay}
                className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <IndianRupee className="w-4 h-4" />
                Pay Selected ({selectedIds.size})
              </button>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === unpaidCalculations.length && unpaidCalculations.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Staff</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Dept</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Base Salary
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Payable Days
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Net Salary
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Paid</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {calculations.map((calc) => (
                <tr key={calc._id} className={`hover:bg-gray-50 ${selectedIds.has(calc._id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-3 py-3 text-center">
                    {calc.paymentStatus !== 'paid' ? (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(calc._id)}
                        onChange={() => toggleSelect(calc._id)}
                        className="rounded border-gray-300"
                      />
                    ) : (
                      <span className="text-green-500 text-xs">&#10003;</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {calc.staffId?.name || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {calc.staffId?.department || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {formatCurrency(calc.baseSalary)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {calc.attendanceSummary?.totalPayableDays?.toFixed(1) || '0.0'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                    {formatCurrency(calc.netSalary)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">
                    {formatCurrency(calc.paidAmount || 0)}
                  </td>
                  <td className="px-4 py-3">{getPaymentStatusBadge(calc.paymentStatus)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onViewPayslip(calc)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Payslip"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      {!calc.isLocked && (
                        <button
                          onClick={() => handleEditDeductions(calc)}
                          className="text-orange-600 hover:text-orange-800"
                          title="Edit Deductions/Bonuses"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {calc.paymentStatus !== 'paid' && (
                        <button
                          onClick={() => handleRecordPayment(calc)}
                          className="text-green-600 hover:text-green-800"
                          title="Record Payment"
                        >
                          <IndianRupee className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showPaymentModal && selectedCalculation && (
        <RecordPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          calculation={selectedCalculation}
          onSuccess={() => {
            setShowPaymentModal(false);
            loadCalculations();
            onRefresh();
          }}
        />
      )}

      {showEditModal && selectedCalculation && (
        <EditDeductionsModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          calculation={selectedCalculation}
          onSuccess={() => {
            setShowEditModal(false);
            loadCalculations();
            onRefresh();
          }}
        />
      )}

      {showBulkPaymentModal && selectedCalculations.length > 0 && (
        <BulkPaymentModal
          isOpen={showBulkPaymentModal}
          onClose={() => setShowBulkPaymentModal(false)}
          calculations={selectedCalculations}
          periodId={periodId}
          onSuccess={() => {
            setShowBulkPaymentModal(false);
            setSelectedIds(new Set());
            loadCalculations();
            onRefresh();
          }}
        />
      )}
    </>
  );
};

export default PayrollCalculationsView;
