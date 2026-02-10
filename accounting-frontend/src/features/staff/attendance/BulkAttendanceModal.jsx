import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAttendance } from './useAttendance';

const BulkAttendanceModal = ({ isOpen, onClose, onSuccess, selectedDate, staffList }) => {
  const [date, setDate] = useState(selectedDate.toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState(
    staffList.map((staff) => ({
      staffId: staff._id,
      staffName: staff.name,
      status: 'present',
      leaveType: null,
      halfDayType: 'paid',
      checkInTime: '',
      checkOutTime: '',
      remarks: '',
    }))
  );

  const { bulkMarkAttendance, loading } = useAttendance();

  const handleStatusChange = (index, field, value) => {
    const newData = [...attendanceData];
    newData[index][field] = value;
    setAttendanceData(newData);
  };

  const handleSetAllStatus = (status) => {
    const newData = attendanceData.map((record) => ({
      ...record,
      status,
    }));
    setAttendanceData(newData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const attendanceRecords = attendanceData.map((record) => ({
        staffId: record.staffId,
        status: record.status,
        leaveType: record.status === 'leave' ? record.leaveType : null,
        halfDayType: record.status === 'half-day' ? record.halfDayType : null,
        checkInTime: record.checkInTime || null,
        checkOutTime: record.checkOutTime || null,
        remarks: record.remarks,
      }));

      await bulkMarkAttendance({
        date,
        attendanceRecords,
      });

      alert('Bulk attendance marked successfully');
      onSuccess();
    } catch (error) {
      console.error('Failed to mark bulk attendance:', error);
      alert(error.response?.data?.message || 'Failed to mark bulk attendance');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bulk Attendance Entry</h2>
            <p className="text-sm text-gray-600 mt-1">Mark attendance for multiple staff at once</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Date Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-4 flex gap-2">
            <span className="text-sm text-gray-700 font-medium">Quick Set All:</span>
            <button
              type="button"
              onClick={() => handleSetAllStatus('present')}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Present
            </button>
            <button
              type="button"
              onClick={() => handleSetAllStatus('absent')}
              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Absent
            </button>
            <button
              type="button"
              onClick={() => handleSetAllStatus('leave')}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Leave
            </button>
          </div>

          {/* Staff Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Staff Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Check In</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Check Out</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendanceData.map((record, index) => (
                  <tr key={record.staffId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {record.staffName}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={record.status}
                        onChange={(e) => handleStatusChange(index, 'status', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="leave">Leave</option>
                        <option value="half-day">Half-Day</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {record.status === 'leave' && (
                        <select
                          value={record.leaveType || ''}
                          onChange={(e) => handleStatusChange(index, 'leaveType', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select</option>
                          <option value="paid">Paid</option>
                          <option value="unpaid">Unpaid</option>
                        </select>
                      )}
                      {record.status === 'half-day' && (
                        <select
                          value={record.halfDayType || 'paid'}
                          onChange={(e) => handleStatusChange(index, 'halfDayType', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="paid">Paid</option>
                          <option value="unpaid">Unpaid</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        value={record.checkInTime}
                        onChange={(e) => handleStatusChange(index, 'checkInTime', e.target.value)}
                        disabled={record.status === 'absent' || record.status === 'leave'}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        value={record.checkOutTime}
                        onChange={(e) => handleStatusChange(index, 'checkOutTime', e.target.value)}
                        disabled={record.status === 'absent' || record.status === 'leave'}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={record.remarks}
                        onChange={(e) => handleStatusChange(index, 'remarks', e.target.value)}
                        placeholder="Optional"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
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
              {loading ? 'Processing...' : 'Mark Attendance for All'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkAttendanceModal;
