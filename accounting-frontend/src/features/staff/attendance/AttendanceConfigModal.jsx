import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAttendance } from './useAttendance';

const AttendanceConfigModal = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState({
    workingDaysPerMonth: 30,
    standardWorkStartTime: '09:00',
    standardWorkEndTime: '18:00',
    lateEntryThresholdMinutes: 15,
    earlyExitThresholdMinutes: 15,
    lateMarksToHalfDay: 3,
    halfDaysToFullDay: 2,
    autoAbsentCutoffTime: '23:59',
    enableAutoAbsent: true,
    weeklyOffDays: [0], // Sunday
  });

  const { getAttendanceConfig, updateAttendanceConfig, loading } = useAttendance();

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      const response = await getAttendanceConfig();
      if (response.success && response.data) {
        setConfig(response.data);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateAttendanceConfig(config);
      alert('Attendance configuration updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update config:', error);
      alert(error.response?.data?.message || 'Failed to update configuration');
    }
  };

  const toggleWeeklyOff = (day) => {
    setConfig((prev) => ({
      ...prev,
      weeklyOffDays: prev.weeklyOffDays.includes(day)
        ? prev.weeklyOffDays.filter((d) => d !== day)
        : [...prev.weeklyOffDays, day],
    }));
  };

  const weekDays = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Attendance Configuration</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Working Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Working Days Per Month *
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={config.workingDaysPerMonth}
              onChange={(e) =>
                setConfig({ ...config, workingDaysPerMonth: parseInt(e.target.value) })
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used for calculating daily salary rate from monthly salary
            </p>
          </div>

          {/* Work Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standard Work Start Time
              </label>
              <input
                type="time"
                value={config.standardWorkStartTime}
                onChange={(e) => setConfig({ ...config, standardWorkStartTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standard Work End Time
              </label>
              <input
                type="time"
                value={config.standardWorkEndTime}
                onChange={(e) => setConfig({ ...config, standardWorkEndTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Late/Early Thresholds */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Late Entry Threshold (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={config.lateEntryThresholdMinutes}
                onChange={(e) =>
                  setConfig({ ...config, lateEntryThresholdMinutes: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Early Exit Threshold (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={config.earlyExitThresholdMinutes}
                onChange={(e) =>
                  setConfig({ ...config, earlyExitThresholdMinutes: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Penalty Rules */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Late Marks to Half-Day Deduction
              </label>
              <input
                type="number"
                min="1"
                value={config.lateMarksToHalfDay}
                onChange={(e) =>
                  setConfig({ ...config, lateMarksToHalfDay: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                e.g., 3 late entries = 0.5 day deduction
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Half-Days to Full Day Deduction
              </label>
              <input
                type="number"
                min="1"
                value={config.halfDaysToFullDay}
                onChange={(e) =>
                  setConfig({ ...config, halfDaysToFullDay: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                e.g., 2 half-day penalties = 1 full day deduction
              </p>
            </div>
          </div>

          {/* Auto-Absent Settings */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                checked={config.enableAutoAbsent}
                onChange={(e) => setConfig({ ...config, enableAutoAbsent: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700">
                Enable Auto-Mark Absent
              </label>
            </div>

            {config.enableAutoAbsent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-Absent Cutoff Time
                </label>
                <input
                  type="time"
                  value={config.autoAbsentCutoffTime}
                  onChange={(e) =>
                    setConfig({ ...config, autoAbsentCutoffTime: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Time after which staff without attendance will be marked absent
                </p>
              </div>
            )}
          </div>

          {/* Weekly Off Days */}
          <div className="border-t border-gray-200 pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Weekly Off Days
            </label>
            <div className="grid grid-cols-2 gap-2">
              {weekDays.map((day) => (
                <div key={day.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.weeklyOffDays.includes(day.value)}
                    onChange={() => toggleWeeklyOff(day.value)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">{day.label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
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
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceConfigModal;
