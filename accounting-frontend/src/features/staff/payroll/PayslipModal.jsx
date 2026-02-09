import React from 'react';
import { X, Download, Printer } from 'lucide-react';

const PayslipModal = ({ isOpen, onClose, calculation }) => {
  if (!isOpen || !calculation) return null;

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

  const handlePrint = () => {
    window.print();
  };

  const staff = calculation.staffId || {};
  const attendance = calculation.attendanceSummary || {};
  const period = calculation.payrollPeriodId || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 rounded-t-xl print:hidden" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <h2 className="text-lg font-semibold text-white">Salary Slip</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded">
            <X className="w-5 h-5" />
            </button>
          </div>
      </div>

      {/* Payslip Content */}
      <div className="p-8 print:p-4 overflow-y-auto flex-1">
          {/* Company Header */}
          <div className="text-center mb-6 border-b-2 border-gray-300 pb-4">
            <h1 className="text-2xl font-bold text-gray-900">Salary Slip</h1>
            <p className="text-gray-600 mt-1">
              For the period: {formatDate(calculation.fromDate)} - {formatDate(calculation.toDate)}
            </p>
            {period.periodName && (
              <p className="text-sm text-gray-500">{period.periodName}</p>
            )}
          </div>

          {/* Employee Details */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Employee Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="text-gray-600 w-32">Name:</span>
                  <span className="font-medium">{staff.name || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Department:</span>
                  <span className="font-medium">{staff.department || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Designation:</span>
                  <span className="font-medium">{staff.designation || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Mobile:</span>
                  <span className="font-medium">{staff.mobile || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Bank Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="text-gray-600 w-32">Bank:</span>
                  <span className="font-medium">{staff.bankName || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Account No:</span>
                  <span className="font-medium">{staff.bankAccountNumber || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">IFSC:</span>
                  <span className="font-medium">{staff.bankIfscCode || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">UPI ID:</span>
                  <span className="font-medium">{staff.upiId || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Attendance Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Working Days:</span>
                <span className="ml-2 font-medium">{attendance.totalWorkingDays || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Present Days:</span>
                <span className="ml-2 font-medium text-green-600">
                  {attendance.presentDays || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Absent Days:</span>
                <span className="ml-2 font-medium text-red-600">{attendance.absentDays || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Paid Leaves:</span>
                <span className="ml-2 font-medium">{attendance.paidLeaveDays || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Unpaid Leaves:</span>
                <span className="ml-2 font-medium">{attendance.unpaidLeaveDays || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Half Days:</span>
                <span className="ml-2 font-medium">
                  {(attendance.paidHalfDays || 0) + (attendance.unpaidHalfDays || 0)}
                </span>
              </div>
              <div className="col-span-3 pt-2 border-t border-gray-300">
                <span className="text-gray-900 font-semibold">Total Payable Days:</span>
                <span className="ml-2 font-bold text-blue-600">
                  {attendance.totalPayableDays?.toFixed(1) || '0.0'}
                </span>
              </div>
            </div>
          </div>

          {/* Salary Breakdown */}
          {calculation.hasSalaryIncrease && calculation.salaryBreakdown && (
            <div className="mb-6 border border-gray-300 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Salary Breakdown (Multiple Rates Applied)
              </h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Period</th>
                    <th className="px-3 py-2 text-right">Salary</th>
                    <th className="px-3 py-2 text-right">Days</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {calculation.salaryBreakdown.map((breakdown, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">
                        {formatDate(breakdown.fromDate)} - {formatDate(breakdown.toDate)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatCurrency(breakdown.salaryAmount)}
                      </td>
                      <td className="px-3 py-2 text-right">{breakdown.payableDays?.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right">
                        {formatCurrency(breakdown.calculatedAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Salary Calculation */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Earnings */}
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Earnings</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Basic Salary:</span>
                  <span className="font-medium">{formatCurrency(calculation.finalSalary)}</span>
                </div>
                {calculation.overtimePay > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Overtime Pay:</span>
                    <span className="font-medium">{formatCurrency(calculation.overtimePay)}</span>
                  </div>
                )}
                {calculation.bonuses > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bonuses:</span>
                    <span className="font-medium">{formatCurrency(calculation.bonuses)}</span>
                  </div>
                )}
                {calculation.allowances > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Allowances:</span>
                    <span className="font-medium">{formatCurrency(calculation.allowances)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-300 font-semibold">
                  <span>Gross Earnings:</span>
                  <span className="text-green-600">
                    {formatCurrency(
                      calculation.finalSalary + (calculation.totalAdditions || 0)
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">
                Deductions
              </h3>
              <div className="space-y-2 text-sm">
                {calculation.latePenaltyAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Late Penalty:</span>
                    <span className="font-medium">
                      {formatCurrency(calculation.latePenaltyAmount)}
                    </span>
                  </div>
                )}
                {calculation.advanceDeduction > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Advance Deduction:</span>
                    <span className="font-medium">
                      {formatCurrency(calculation.advanceDeduction)}
                    </span>
                  </div>
                )}
                {calculation.otherDeductions > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Other Deductions:</span>
                    <span className="font-medium">
                      {formatCurrency(calculation.otherDeductions)}
                    </span>
                  </div>
                )}
                {(calculation.totalDeductions || 0) === 0 && (
                  <div className="text-gray-500 text-center py-2">No deductions</div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-300 font-semibold">
                  <span>Total Deductions:</span>
                  <span className="text-red-600">
                    {formatCurrency(calculation.totalDeductions || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Salary */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Net Salary:</span>
              <span className="text-3xl font-bold text-blue-600">
                {formatCurrency(calculation.netSalary)}
              </span>
            </div>
          </div>

          {/* Payment Details */}
          {calculation.paymentStatus !== 'pending' && (
            <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Paid Amount:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {formatCurrency(calculation.paidAmount || 0)}
                  </span>
                </div>
                {calculation.paymentDate && (
                  <div>
                    <span className="text-gray-600">Payment Date:</span>
                    <span className="ml-2 font-medium">
                      {formatDate(calculation.paymentDate)}
                    </span>
                  </div>
                )}
                {calculation.paymentMode && (
                  <div>
                    <span className="text-gray-600">Payment Mode:</span>
                    <span className="ml-2 font-medium uppercase">{calculation.paymentMode}</span>
                  </div>
                )}
                {calculation.paymentReference && (
                  <div>
                    <span className="text-gray-600">Reference:</span>
                    <span className="ml-2 font-medium">{calculation.paymentReference}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Remarks */}
          {calculation.remarks && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Remarks:</h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{calculation.remarks}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t border-gray-300">
            <p>This is a computer-generated payslip and does not require a signature.</p>
            <p className="mt-1">
              Generated on: {formatDate(new Date())}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayslipModal;
