import React from 'react';

const AttendanceCalendar = ({
  selectedMonth,
  attendanceRecords,
  staffList,
  onDateClick,
  onRecordClick,
  loading,
}) => {
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty slots for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getAttendanceForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return attendanceRecords.filter((record) => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      return recordDate === dateStr;
    });
  };

  const getAttendanceSummary = (records) => {
    const summary = {
      present: 0,
      absent: 0,
      leave: 0,
      halfDay: 0,
    };

    records.forEach((record) => {
      if (record.status === 'present') summary.present++;
      else if (record.status === 'absent') summary.absent++;
      else if (record.status === 'leave') summary.leave++;
      else if (record.status === 'half-day') summary.halfDay++;
    });

    return summary;
  };

  const days = getDaysInMonth(selectedMonth);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Month Display */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading attendance...</div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-700 py-2"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dayAttendance = getAttendanceForDate(date);
            const summary = getAttendanceSummary(dayAttendance);
            const isToday = date.getTime() === today.getTime();
            const isPast = date < today;

            return (
              <div
                key={date.toISOString()}
                onClick={() => onDateClick(date)}
                className={`
                  aspect-square border rounded-lg p-2 cursor-pointer transition-all
                  ${isToday ? 'border-blue-500 border-2 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
                  ${isPast ? 'bg-gray-50' : 'bg-white'}
                `}
              >
                <div className="h-full flex flex-col">
                  {/* Date number */}
                  <div
                    className={`text-sm font-medium mb-1 ${
                      isToday ? 'text-blue-600' : 'text-gray-900'
                    }`}
                  >
                    {date.getDate()}
                  </div>

                  {/* Attendance summary */}
                  {dayAttendance.length > 0 ? (
                    <div className="flex-1 flex flex-col gap-0.5 text-xs">
                      {summary.present > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-gray-600">{summary.present}P</span>
                        </div>
                      )}
                      {summary.absent > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-gray-600">{summary.absent}A</span>
                        </div>
                      )}
                      {summary.leave > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-gray-600">{summary.leave}L</span>
                        </div>
                      )}
                      {summary.halfDay > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          <span className="text-gray-600">{summary.halfDay}H</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-xs text-gray-400">-</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-700">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-700">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-700">Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-gray-700">Half-Day</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
