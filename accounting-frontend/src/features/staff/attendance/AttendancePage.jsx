import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Settings, Download, Upload } from 'lucide-react';
import { useAttendance } from './useAttendance';
import { staffApi } from '../staff.api';
import AttendanceCalendar from './AttendanceCalendar';
import DailyAttendanceModal from './DailyAttendanceModal';
import CheckOutModal from './CheckOutModal';
import BulkAttendanceModal from './BulkAttendanceModal';
import AttendanceConfigModal from './AttendanceConfigModal';

const AttendancePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [checkInOutAction, setCheckInOutAction] = useState(null); // 'check-in' or 'check-out'

  const { getAttendance, autoMarkAbsent } = useAttendance();

  useEffect(() => {
    loadStaffList();
  }, []);

  useEffect(() => {
    loadAttendanceForMonth();
  }, [selectedMonth]);

  const loadStaffList = async () => {
    try {
      const response = await staffApi.getActiveList();
      if (response.success) {
        setStaffList(response.data);
      }
    } catch (error) {
      console.error('Failed to load staff list:', error);
    }
  };

  const loadAttendanceForMonth = async () => {
    setLoading(true);
    try {
      const firstDay = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const lastDay = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

      const response = await getAttendance({
        fromDate: firstDay.toISOString().split('T')[0],
        toDate: lastDay.toISOString().split('T')[0],
        limit: 1000,
      });

      if (response.success) {
        setAttendanceRecords(response.data);
      }
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = (staff = null, record = null, action = null) => {
    setSelectedStaff(staff);
    setSelectedRecord(record);
    setCheckInOutAction(action);
    setShowDailyModal(true);
  };

  const handleBulkAttendance = () => {
    setShowBulkModal(true);
  };

  const handleAutoAbsent = async () => {
    if (!confirm('This will mark all staff without attendance for the selected date as absent. Continue?')) {
      return;
    }

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await autoMarkAbsent({ date: dateStr });
      
      if (response.success) {
        alert(response.message);
        loadAttendanceForMonth();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to auto-mark absent');
    }
  };

  const handleAttendanceSuccess = () => {
    loadAttendanceForMonth();
    setShowDailyModal(false);
    setShowBulkModal(false);
    setShowCheckOutModal(false);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Attendance</h1>
          <p className="text-gray-600 mt-1">
            Manage daily attendance, leaves, and time tracking
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => handleMarkAttendance(null, null, 'check-in')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Check In
            </button>
            <button
              onClick={() => setShowCheckOutModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Check Out
            </button>
            <button
              onClick={handleBulkAttendance}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Bulk Entry
            </button>
            <button
              onClick={handleAutoAbsent}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
            >
              Auto-Mark Absent
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                viewMode === 'calendar'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              List View
            </button>
          </div>
        </div>
      </div>

      {/* Date Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected Date
            </label>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              View Month
            </label>
            <input
              type="month"
              value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-');
                setSelectedMonth(new Date(year, month - 1, 1));
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'calendar' ? (
        <AttendanceCalendar
          selectedMonth={selectedMonth}
          attendanceRecords={attendanceRecords}
          staffList={staffList}
          onDateClick={(date) => setSelectedDate(date)}
          onRecordClick={(record) => handleMarkAttendance(null, record)}
          loading={loading}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Staff</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Check In</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Check Out</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Hours</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Payable Days</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(new Date(record.date))}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {record.staffId?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            record.status === 'present'
                              ? 'bg-green-100 text-green-800'
                              : record.status === 'absent'
                              ? 'bg-red-100 text-red-800'
                              : record.status === 'leave'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {record.status}
                          {record.leaveType && ` (${record.leaveType})`}
                          {record.halfDayType && ` (${record.halfDayType})`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {record.checkInTime || '-'}
                        {record.isLateEntry && (
                          <span className="ml-1 text-red-600">⚠</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {record.checkOutTime || '-'}
                        {record.isEarlyExit && (
                          <span className="ml-1 text-orange-600">⚠</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {record.workHours ? record.workHours.toFixed(1) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {record.payableDays}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleMarkAttendance(null, record)}
                          disabled={record.isLocked}
                          className="text-blue-600 hover:text-blue-800 text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          {record.isLocked ? 'Locked' : 'Edit'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showDailyModal && (
        <DailyAttendanceModal
          isOpen={showDailyModal}
          onClose={() => setShowDailyModal(false)}
          onSuccess={handleAttendanceSuccess}
          selectedDate={selectedDate}
          selectedStaff={selectedStaff}
          selectedRecord={selectedRecord}
          staffList={staffList}
          attendanceRecords={attendanceRecords}
        />
      )}

      {showBulkModal && (
        <BulkAttendanceModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          onSuccess={handleAttendanceSuccess}
          selectedDate={selectedDate}
          staffList={staffList}
        />
      )}

      {showCheckOutModal && (
        <CheckOutModal
          isOpen={showCheckOutModal}
          onClose={() => setShowCheckOutModal(false)}
          onSuccess={handleAttendanceSuccess}
          selectedDate={selectedDate}
          staffList={staffList}
          attendanceRecords={attendanceRecords}
        />
      )}

      {showConfigModal && (
        <AttendanceConfigModal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
        />
      )}
    </div>
  );
};

export default AttendancePage;
