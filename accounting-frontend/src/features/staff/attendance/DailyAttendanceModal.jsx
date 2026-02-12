import React, { useState, useEffect, useMemo } from 'react';
import { X, Clock, Calendar, Search } from 'lucide-react';
import { useAttendance } from './useAttendance';

const DailyAttendanceModal = ({
  isOpen,
  onClose,
  onSuccess,
  selectedDate,
  selectedStaff,
  selectedRecord,
  staffList,
  checkInOutAction,
  attendanceRecords = [],
}) => {
  // Helper function to get current time in HH:mm format
  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  // Helper function to format date for display
  const formatDateForDisplay = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const [formData, setFormData] = useState({
    staffIds: [],
    date: selectedDate.toISOString().split('T')[0],
    status: 'present',
    leaveType: null,
    halfDayType: null,
    checkInTime: getCurrentTime(),
    remarks: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);

  const { markAttendance, updateAttendance, loading } = useAttendance();

  // Get staff IDs that already have attendance for selected date
  const checkedInStaffIds = useMemo(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const checkedInRecords = attendanceRecords.filter((record) => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      return recordDate === dateStr && !record.isDeleted;
    });
    return checkedInRecords.map((record) => record.staffId?._id || record.staffId);
  }, [attendanceRecords, selectedDate]);

  // Filter staff based on search query and exclude already checked-in staff
  const filteredStaff = useMemo(() => {
    let availableStaff = staffList;

    // When creating new check-in (not editing), filter out already checked-in staff
    if (!selectedRecord) {
      availableStaff = staffList.filter(
        (staff) => !checkedInStaffIds.includes(staff._id)
      );
    }

    if (!searchQuery.trim()) return availableStaff;

    const query = searchQuery.toLowerCase();
    return availableStaff.filter(
      (staff) =>
        staff.name?.toLowerCase().includes(query) ||
        staff.department?.toLowerCase().includes(query) ||
        staff.employeeId?.toLowerCase().includes(query)
    );
  }, [staffList, searchQuery, checkedInStaffIds, selectedRecord]);

  // Get selected staff details
  const selectedStaffList = useMemo(() => {
    return staffList.filter((staff) => formData.staffIds.includes(staff._id));
  }, [staffList, formData.staffIds]);

  useEffect(() => {
    if (selectedRecord) {
      // Editing existing record - single staff only
      const staffId = selectedRecord.staffId?._id || selectedRecord.staffId;
      const staff = staffList.find((s) => s._id === staffId);

      setFormData({
        staffIds: [staffId],
        date: selectedDate.toISOString().split('T')[0],
        status: selectedRecord.status,
        leaveType: selectedRecord.leaveType,
        halfDayType: selectedRecord.halfDayType,
        checkInTime: selectedRecord.checkInTime || getCurrentTime(),
        remarks: selectedRecord.remarks || '',
      });

      if (staff) {
        setSearchQuery(staff.name);
      }
    } else if (selectedStaff) {
      // Pre-selected staff
      setFormData({
        staffIds: [selectedStaff._id],
        date: selectedDate.toISOString().split('T')[0],
        status: 'present',
        leaveType: null,
        halfDayType: null,
        checkInTime: getCurrentTime(),
        remarks: '',
      });
      setSearchQuery(selectedStaff.name);
    } else {
      // New check-in
      setFormData({
        staffIds: [],
        date: selectedDate.toISOString().split('T')[0],
        status: 'present',
        leaveType: null,
        halfDayType: null,
        checkInTime: getCurrentTime(),
        remarks: '',
      });
      setSearchQuery('');
    }
  }, [selectedRecord, selectedStaff, selectedDate]);

  const handleStaffSelect = (staff) => {
    // Toggle staff selection for multiple selection
    if (formData.staffIds.includes(staff._id)) {
      setFormData({
        ...formData,
        staffIds: formData.staffIds.filter(id => id !== staff._id)
      });
    } else {
      setFormData({
        ...formData,
        staffIds: [...formData.staffIds, staff._id]
      });
    }
  };

  const handleRemoveStaff = (staffId) => {
    setFormData({
      ...formData,
      staffIds: formData.staffIds.filter(id => id !== staffId)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: Check if at least one staff is selected
    if (!formData.staffIds || formData.staffIds.length === 0) {
      alert('❌ Validation Error: Please select at least one staff member');
      return;
    }

    // Validation: Check if status is selected
    if (!formData.status) {
      alert('❌ Validation Error: Please select attendance status');
      return;
    }

    // Validation: Check if leave type is selected when status is leave
    if (formData.status === 'leave' && !formData.leaveType) {
      alert('❌ Validation Error: Please select leave type (Paid or Unpaid)');
      return;
    }

    // Validation: Check if check-in time is provided
    if (!formData.checkInTime) {
      alert('❌ Validation Error: Please provide check-in time');
      return;
    }

    try {
      if (selectedRecord) {
        // Single update for existing record
        const submitData = {
          staffId: formData.staffIds[0],
          date: formData.date,
          status: formData.status,
          leaveType: formData.status === 'leave' ? formData.leaveType : null,
          halfDayType: formData.status === 'half-day' ? formData.halfDayType : null,
          checkInTime: (formData.status === 'present' || formData.status === 'half-day') ? formData.checkInTime : undefined,
          remarks: formData.remarks,
        };
        console.log('Updating attendance with data:', submitData);
        await updateAttendance(selectedRecord._id, submitData);
      } else {
        // Multiple staff check-in - create individual records for each staff
        const promises = formData.staffIds.map(staffId => {
          const submitData = {
            staffId: staffId,
            date: formData.date,
            status: formData.status,
            leaveType: formData.status === 'leave' ? formData.leaveType : null,
            halfDayType: formData.status === 'half-day' ? formData.halfDayType : null,
            checkInTime: (formData.status === 'present' || formData.status === 'half-day') ? formData.checkInTime : undefined,
            remarks: formData.remarks,
          };
          console.log('Creating attendance with data:', submitData);
          return markAttendance(submitData);
        });

        await Promise.all(promises);
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to save attendance:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);

      // Enhanced error handling with specific conditions
      // Backend returns errors in format: { success: false, error: { message, code, fields } }
      const errorData = error.response?.data?.error || error.response?.data || {};
      const errorMessage = errorData.message || error.response?.data?.message || 'Failed to save attendance';
      const errorStatus = error.response?.status;
      const errorFields = errorData.fields;

      // Log the full error for debugging
      console.log('Full error details:', {
        status: errorStatus,
        message: errorMessage,
        fields: errorFields,
        data: error.response?.data
      });

      if (errorStatus === 400) {
        if (errorMessage.includes('already marked') || errorMessage.includes('already exists')) {
          alert('❌ Duplicate Entry Error: One or more staff members have already checked in for this date.\n\nPlease use the edit option if you need to make changes to existing attendance records.');
        } else if (errorMessage.includes('locked')) {
          alert('❌ Locked Record Error: This attendance record is locked for payroll processing.\n\nYou cannot modify locked records. Please contact your administrator.');
        } else if (errorMessage.includes('required')) {
          alert(`❌ Missing Required Field: ${errorMessage}\n\nPlease fill in all required fields.`);
        } else if (errorMessage.includes('invalid')) {
          alert(`❌ Invalid Data: ${errorMessage}\n\nPlease check your input and try again.`);
        } else {
          // Show detailed validation error if available
          let detailsText = '';
          if (errorFields && errorFields.length > 0) {
            const fieldErrors = errorFields.map(f => `${f.field}: ${f.message}`).join('\n');
            detailsText = `\n\nField Errors:\n${fieldErrors}`;
          }
          alert(`❌ Validation Error: ${errorMessage}${detailsText}`);
        }
      } else if (errorStatus === 404) {
        alert('❌ Staff Not Found: The selected staff member does not exist or has been deleted.\n\nPlease refresh the page and try again.');
      } else if (errorStatus === 409) {
        alert('❌ Duplicate Entry: This attendance record already exists.\n\nPlease use the edit option if you need to make changes.');
      } else if (errorStatus === 500) {
        alert('❌ Server Error: An internal server error occurred while saving attendance.\n\nPlease try again later or contact support.');
      } else {
        alert(`❌ Error: ${errorMessage}`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[98vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 rounded-t-xl shrink-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <h2 className="text-base font-semibold text-white">
            {selectedRecord ? 'Edit Attendance' : 'Staff Check-In'}
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form with smooth scrolling if needed */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="px-5 py-4 space-y-3.5 overflow-y-auto flex-1">
            {/* Staff Selection - Searchable */}
            {!selectedRecord && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Staff Members <span className="text-red-500">*</span>
                  {selectedStaffList.length > 0 && (
                    <span className="ml-2 text-xs text-purple-600">({selectedStaffList.length} selected)</span>
                  )}
                </label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowStaffDropdown(true);
                      }}
                      onFocus={() => setShowStaffDropdown(true)}
                      onBlur={() => {
                        // Delay to allow dropdown click to register
                        setTimeout(() => setShowStaffDropdown(false), 200);
                      }}
                      placeholder="Search and select multiple staff..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Dropdown Results */}
                  {showStaffDropdown && filteredStaff.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredStaff.map((staff) => (
                        <button
                          key={staff._id}
                          type="button"
                          onClick={() => handleStaffSelect(staff)}
                          className={`w-full px-3 py-2 text-left hover:bg-purple-50 border-b border-gray-100 last:border-0 transition-colors flex items-center gap-2 ${
                            formData.staffIds.includes(staff._id) ? 'bg-purple-50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.staffIds.includes(staff._id)}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">{staff.name}</div>
                            <div className="text-xs text-gray-500">
                              {staff.department || 'N/A'} {staff.employeeId && `• ${staff.employeeId}`}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selected Staff Display */}
                  {selectedStaffList.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedStaffList.map((staff) => (
                        <div
                          key={staff._id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 text-purple-800 rounded-md text-xs"
                        >
                          <span className="font-medium">{staff.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveStaff(staff._id)}
                            className="hover:bg-purple-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Date - Read Only Display */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Date
              </label>
              <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-gray-900 font-medium text-sm">
                  {formatDateForDisplay(formData.date)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Auto-filled with current date</p>
            </div>

            {/* Status - Segmented Buttons */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Status <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['present', 'leave', 'half-day'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      // Clear checkInTime when switching to leave or absent
                      const newFormData = { ...formData, status };
                      if (status === 'leave' || status === 'absent') {
                        newFormData.checkInTime = '';
                      } else if (!formData.checkInTime) {
                        // Set current time if switching back to present/half-day
                        newFormData.checkInTime = getCurrentTime();
                      }
                      setFormData(newFormData);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all text-sm ${
                      formData.status === status
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'present' ? 'Present' : status === 'leave' ? 'Leave' : 'Half-Day'}
                  </button>
                ))}
              </div>
            </div>

            {/* Leave Type - Conditional */}
            {formData.status === 'leave' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Leave Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['paid', 'unpaid'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, leaveType: type })}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all text-sm ${
                        formData.leaveType === type
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type === 'paid' ? 'Paid Leave' : 'Unpaid Leave'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Half-Day Type - Conditional */}
            {formData.status === 'half-day' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Half-Day Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['paid', 'unpaid'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, halfDayType: type })}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all text-sm ${
                        formData.halfDayType === type
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type === 'paid' ? 'Paid Half-Day' : 'Unpaid Half-Day'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Check-in Time - Editable (but disabled for leave/absent) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Check-in Time {(formData.status === 'present' || formData.status === 'half-day') && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-600 pointer-events-none" />
                <input
                  type="time"
                  value={formData.checkInTime}
                  onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                  disabled={formData.status === 'leave' || formData.status === 'absent'}
                  className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm ${
                    (formData.status === 'leave' || formData.status === 'absent') ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  required={formData.status === 'present' || formData.status === 'half-day'}
                />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {(formData.status === 'leave' || formData.status === 'absent')
                  ? 'Check-in time not applicable for leave/absent status'
                  : 'Default is current time, but you can modify it'}
              </p>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Remarks
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                placeholder="Late reason, special notes, etc..."
              />
            </div>
          </div>

          {/* Actions - Fixed at bottom */}
          <div className="flex gap-2 px-5 py-3 border-t border-gray-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors font-medium text-sm"
            >
              {loading ? 'Saving...' : selectedRecord ? 'Update' : `Check In ${selectedStaffList.length > 1 ? `(${selectedStaffList.length})` : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DailyAttendanceModal;
