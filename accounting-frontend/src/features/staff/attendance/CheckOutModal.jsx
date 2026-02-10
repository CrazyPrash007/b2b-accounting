import React, { useState, useEffect, useMemo } from 'react';
import { X, Clock, Calendar, Search, LogOut, AlertCircle } from 'lucide-react';
import { useAttendance } from './useAttendance';

const CheckOutModal = ({
  isOpen,
  onClose,
  onSuccess,
  selectedDate,
  staffList,
  attendanceRecords,
}) => {
  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  const formatDateForDisplay = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const todayStr = selectedDate.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    staffId: '',
    checkOutTime: getCurrentTime(),
    status: 'present',
    remarks: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);

  const { updateAttendance, loading } = useAttendance();

  // Get today's checked-in staff who haven't checked out
  const checkedInRecords = useMemo(() => {
    return attendanceRecords.filter((record) => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      return (
        recordDate === todayStr &&
        record.checkInTime &&
        !record.checkOutTime &&
        !record.isDeleted &&
        !record.isLocked &&
        (record.status === 'present' || record.status === 'half-day')
      );
    });
  }, [attendanceRecords, todayStr]);

  // Build list of staff eligible for checkout
  const eligibleStaff = useMemo(() => {
    return checkedInRecords.map((record) => {
      const staffId = record.staffId?._id || record.staffId;
      const staff = staffList.find((s) => s._id === staffId);
      return {
        ...staff,
        _id: staffId,
        name: staff?.name || record.staffId?.name || 'Unknown',
        department: staff?.department || record.staffId?.department || '',
        employeeId: staff?.employeeId || '',
        checkInTime: record.checkInTime,
        attendanceRecordId: record._id,
        status: record.status,
      };
    });
  }, [checkedInRecords, staffList]);

  // Filter eligible staff by search
  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return eligibleStaff;
    const query = searchQuery.toLowerCase();
    return eligibleStaff.filter(
      (staff) =>
        staff.name?.toLowerCase().includes(query) ||
        staff.department?.toLowerCase().includes(query) ||
        staff.employeeId?.toLowerCase().includes(query)
    );
  }, [eligibleStaff, searchQuery]);

  // Selected staff details
  const selectedStaffData = useMemo(() => {
    return eligibleStaff.find((s) => s._id === formData.staffId);
  }, [eligibleStaff, formData.staffId]);

  // Update status when staff is selected to match their check-in status
  useEffect(() => {
    if (selectedStaffData?.status && formData.status !== selectedStaffData.status) {
      setFormData(prev => ({
        ...prev,
        status: selectedStaffData.status
      }));
    }
  }, [selectedStaffData]);

  // Calculate working hours live
  const workingHours = useMemo(() => {
    if (!selectedStaffData?.checkInTime || !formData.checkOutTime) return null;
    const [inH, inM] = selectedStaffData.checkInTime.split(':').map(Number);
    const [outH, outM] = formData.checkOutTime.split(':').map(Number);
    const inMinutes = inH * 60 + inM;
    const outMinutes = outH * 60 + outM;
    if (outMinutes <= inMinutes) return null;
    const diff = outMinutes - inMinutes;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}h ${mins}m`;
  }, [selectedStaffData, formData.checkOutTime]);

  const handleStaffSelect = (staff) => {
    setFormData({
      ...formData,
      staffId: staff._id,
      status: staff.status || 'present',
    });
    setSearchQuery(staff.name);
    setShowStaffDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: Check if staff is selected
    if (!formData.staffId) {
      alert('❌ Validation Error: Please select a staff member');
      return;
    }

    // Validation: Check if check-in record exists
    if (!selectedStaffData) {
      alert('❌ Record Not Found: No check-in record found for this staff member today.\n\nThe staff member must check in first before checking out.');
      return;
    }

    // Validation: Check if check-out time is provided
    if (!formData.checkOutTime) {
      alert('❌ Validation Error: Please provide check-out time');
      return;
    }

    // Validation: Check if check-out time is after check-in time
    if (selectedStaffData.checkInTime) {
      const [inH, inM] = selectedStaffData.checkInTime.split(':').map(Number);
      const [outH, outM] = formData.checkOutTime.split(':').map(Number);
      const inMinutes = inH * 60 + inM;
      const outMinutes = outH * 60 + outM;

      if (outMinutes <= inMinutes) {
        alert('❌ Validation Error: Check-out time must be after check-in time.\n\nCheck-in: ' + selectedStaffData.checkInTime + '\nCurrent check-out: ' + formData.checkOutTime);
        return;
      }
    }

    try {
      const submitData = {
        checkOutTime: formData.checkOutTime,
        status: formData.status,
        remarks: formData.remarks || undefined,
      };

      await updateAttendance(selectedStaffData.attendanceRecordId, submitData);
      onSuccess();
    } catch (error) {
      console.error('Failed to check out:', error);

      // Enhanced error handling with specific conditions
      // Backend returns errors in format: { success: false, error: { message, code, fields } }
      const errorData = error.response?.data?.error || error.response?.data || {};
      const errorMessage = errorData.message || error.response?.data?.message || 'Failed to save check-out';
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
        if (errorMessage.includes('locked')) {
          alert('❌ Locked Record Error: This attendance record is locked for payroll processing.\n\nYou cannot modify locked records. Please contact your administrator.');
        } else if (errorMessage.includes('required')) {
          alert(`❌ Missing Required Field: ${errorMessage}\n\nPlease fill in all required fields.`);
        } else if (errorMessage.includes('invalid')) {
          alert(`❌ Invalid Data: ${errorMessage}\n\nPlease check your input and try again.`);
        } else if (errorMessage.includes('already checked out')) {
          alert('❌ Already Checked Out: This staff member has already checked out for today.\n\nPlease refresh the page to see the latest data.');
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
        alert('❌ Record Not Found: The attendance record was not found.\n\nIt may have been deleted. Please refresh the page and try again.');
      } else if (errorStatus === 409) {
        alert('❌ Duplicate Entry: The staff member has already checked out.\n\nPlease refresh the page to see the latest data.');
      } else if (errorStatus === 500) {
        alert('❌ Server Error: An internal server error occurred while saving check-out.\n\nPlease try again later or contact support.');
      } else {
        alert(`❌ Error: ${errorMessage}`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[98vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 rounded-t-xl shrink-0"
          style={{
            background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
          }}
        >
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Staff Check-Out
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="px-5 py-4 space-y-3.5 overflow-y-auto flex-1">
            {/* Staff Selection - only checked-in staff */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Staff Member <span className="text-red-500">*</span>
                <span className="ml-2 text-xs text-gray-500">
                  ({eligibleStaff.length} checked-in)
                </span>
              </label>

              {eligibleStaff.length === 0 ? (
                <div className="flex items-center gap-2 px-3 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  No staff members are currently checked in for today, or all have already checked out.
                </div>
              ) : (
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
                      placeholder="Search checked-in staff..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Dropdown */}
                  {showStaffDropdown && filteredStaff.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredStaff.map((staff) => (
                        <button
                          key={staff._id}
                          type="button"
                          onClick={() => handleStaffSelect(staff)}
                          className={`w-full px-3 py-2 text-left hover:bg-red-50 border-b border-gray-100 last:border-0 transition-colors flex items-center justify-between ${
                            formData.staffId === staff._id ? 'bg-red-50' : ''
                          }`}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">
                              {staff.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {staff.department || 'N/A'}{' '}
                              {staff.employeeId && `• ${staff.employeeId}`}
                            </div>
                          </div>
                          <div className="text-xs text-green-600 font-medium">
                            In: {staff.checkInTime}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selected Staff Card */}
                  {formData.staffId && selectedStaffData && !showStaffDropdown && (
                    <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {selectedStaffData.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {selectedStaffData.department || 'N/A'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, staffId: '' });
                            setSearchQuery('');
                            setShowStaffDropdown(true);
                          }}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Date - Read Only */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Date
              </label>
              <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-gray-900 font-medium text-sm">
                  {formatDateForDisplay(todayStr)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Auto-filled with current date
              </p>
            </div>

            {/* Check-in Time - Display Only */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Check-in Time
              </label>
              {selectedStaffData ? (
                <div className="flex items-center px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <Clock className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-gray-900 font-medium text-sm">
                    {selectedStaffData.checkInTime}
                  </span>
                </div>
              ) : (
                <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <Clock className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-500 text-sm">
                    Select a staff member to view check-in time
                  </span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-0.5">
                Fetched from today's attendance record
              </p>
            </div>

            {/* Check-out Time - Editable */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Check-out Time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-600 pointer-events-none" />
                <input
                  type="time"
                  value={formData.checkOutTime}
                  onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  required
                />
                {workingHours && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {workingHours}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Default is current time, but you can modify it
              </p>
            </div>

            {/* Status - Read Only (from check-in) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Status
                <span className="ml-2 text-xs text-gray-500">
                  (from check-in)
                </span>
              </label>
              {selectedStaffData ? (
                <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    formData.status === 'present'
                      ? 'bg-green-100 text-green-800'
                      : formData.status === 'half-day'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                  }`}>
                    {formData.status === 'present'
                      ? 'Present'
                      : formData.status === 'leave'
                        ? 'Leave'
                        : 'Half-Day'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-gray-500 text-sm">
                    Select a staff member to view status
                  </span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-0.5">
                Auto-set from check-in record
              </p>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Remarks
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm"
                placeholder="Early exit reason, special notes, etc..."
              />
            </div>
          </div>

          {/* Actions */}
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
              disabled={loading || eligibleStaff.length === 0}
              className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors font-medium text-sm"
            >
              {loading ? 'Saving...' : 'Check Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckOutModal;
