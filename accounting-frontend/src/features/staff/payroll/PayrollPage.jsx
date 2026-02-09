import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, FileText, Lock, Unlock, Plus, Trash2 } from 'lucide-react';
import { usePayroll } from './usePayroll';
import CreatePayrollPeriodModal from './CreatePayrollPeriodModal';
import PayrollCalculationsView from './PayrollCalculationsView';
import PayslipModal from './PayslipModal';

const PayrollPage = () => {
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedCalculation, setSelectedCalculation] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    getPayrollPeriods,
    calculatePayroll,
    approvePayroll,
    unlockPayroll,
    deletePayrollPeriod,
  } = usePayroll();

  useEffect(() => {
    loadPayrollPeriods();
  }, []);

  const loadPayrollPeriods = async () => {
    setLoading(true);
    try {
      const response = await getPayrollPeriods({ limit: 100 });
      if (response.success) {
        setPeriods(response.data);
      }
    } catch (error) {
      console.error('Failed to load payroll periods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculatePayroll = async (periodId) => {
    if (!confirm('This will calculate payroll for all active staff. Continue?')) {
      return;
    }

    try {
      const response = await calculatePayroll({
        payrollPeriodId: periodId,
        staffIds: [], // Empty = all active staff
      });

      if (response.success) {
        alert(`Payroll calculated successfully for ${response.data.calculations.length} staff`);
        loadPayrollPeriods();
        if (selectedPeriod && selectedPeriod._id === periodId) {
          const updatedPeriod = periods.find((p) => p._id === periodId);
          setSelectedPeriod(updatedPeriod);
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to calculate payroll');
    }
  };

  const handleApprovePayroll = async (periodId) => {
    if (
      !confirm(
        'This will lock all attendance records for this period and approve payroll. This action cannot be undone easily. Continue?'
      )
    ) {
      return;
    }

    try {
      const response = await approvePayroll(periodId);
      if (response.success) {
        alert('Payroll approved and locked successfully');
        loadPayrollPeriods();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve payroll');
    }
  };

  const handleUnlockPayroll = async (periodId) => {
    if (
      !confirm(
        'This will unlock the payroll period and attendance records. Use this only if corrections are needed. Continue?'
      )
    ) {
      return;
    }

    try {
      const response = await unlockPayroll(periodId);
      if (response.success) {
        alert('Payroll unlocked successfully');
        loadPayrollPeriods();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to unlock payroll');
    }
  };

  const handleDeletePeriod = async (periodId) => {
    if (!confirm('Are you sure you want to delete this payroll period? This cannot be undone.')) {
      return;
    }

    try {
      const response = await deletePayrollPeriod(periodId);
      if (response.success) {
        alert('Payroll period deleted successfully');
        loadPayrollPeriods();
        if (selectedPeriod && selectedPeriod._id === periodId) {
          setSelectedPeriod(null);
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete payroll period');
    }
  };

  const handleViewPayslip = (calculation) => {
    setSelectedCalculation(calculation);
    setShowPayslipModal(true);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      calculated: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      paid: 'bg-purple-100 text-purple-800',
      closed: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badges[status] || badges.draft}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600 mt-1">
            Manage salary periods, calculations, and payments
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Payroll Period
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payroll Periods List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Payroll Periods</h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : periods.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No payroll periods found
                </div>
              ) : (
                periods.map((period) => (
                  <div
                    key={period._id}
                    onClick={() => setSelectedPeriod(period)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedPeriod?._id === period._id
                        ? 'bg-blue-50 border-l-4 border-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{period.periodName}</h4>
                      {getStatusBadge(period.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {formatDate(period.fromDate)} - {formatDate(period.toDate)}
                    </p>
                    <div className="text-xs text-gray-500">
                      {period.totalStaff} Staff • {formatCurrency(period.totalPayableSalary || 0)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Payroll Details */}
        <div className="lg:col-span-2">
          {selectedPeriod ? (
            <div className="space-y-6">
              {/* Period Summary Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedPeriod.periodName}
                    </h2>
                    <p className="text-gray-600">
                      {formatDate(selectedPeriod.fromDate)} - {formatDate(selectedPeriod.toDate)}
                    </p>
                  </div>
                  {getStatusBadge(selectedPeriod.status)}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedPeriod.status === 'draft' && (
                    <>
                      <button
                        onClick={() => handleCalculatePayroll(selectedPeriod._id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <DollarSign className="w-4 h-4" />
                        Calculate Payroll
                      </button>
                      <button
                        onClick={() => handleDeletePeriod(selectedPeriod._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </>
                  )}
                  {selectedPeriod.status === 'calculated' && (
                    <>
                      <button
                        onClick={() => handleCalculatePayroll(selectedPeriod._id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        Recalculate
                      </button>
                      <button
                        onClick={() => handleApprovePayroll(selectedPeriod._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <Lock className="w-4 h-4" />
                        Approve & Lock
                      </button>
                    </>
                  )}
                  {(selectedPeriod.status === 'approved' || selectedPeriod.status === 'paid') && (
                    <button
                      onClick={() => handleUnlockPayroll(selectedPeriod._id)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
                    >
                      <Unlock className="w-4 h-4" />
                      Unlock (Admin)
                    </button>
                  )}
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Total Staff</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedPeriod.totalStaff || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Payable Amount</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(selectedPeriod.totalPayableSalary || 0)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Paid Amount</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedPeriod.totalPaidSalary || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payroll Calculations */}
              {(selectedPeriod.status === 'calculated' ||
                selectedPeriod.status === 'approved' ||
                selectedPeriod.status === 'paid') && (
                <PayrollCalculationsView
                  periodId={selectedPeriod._id}
                  onViewPayslip={handleViewPayslip}
                  onRefresh={loadPayrollPeriods}
                />
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Period Selected
              </h3>
              <p className="text-gray-600">
                Select a payroll period from the list to view details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreatePayrollPeriodModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadPayrollPeriods();
          }}
        />
      )}

      {showPayslipModal && selectedCalculation && (
        <PayslipModal
          isOpen={showPayslipModal}
          onClose={() => setShowPayslipModal(false)}
          calculation={selectedCalculation}
        />
      )}
    </div>
  );
};

export default PayrollPage;
