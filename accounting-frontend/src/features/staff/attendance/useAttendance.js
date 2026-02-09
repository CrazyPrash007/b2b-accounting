import { useState, useCallback } from 'react';
import { attendanceApi } from './attendance.api';

export const useAttendance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const markAttendance = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await attendanceApi.markAttendance(data);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark attendance');
      setLoading(false);
      throw err;
    }
  }, []);

  const bulkMarkAttendance = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await attendanceApi.bulkMarkAttendance(data);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark bulk attendance');
      setLoading(false);
      throw err;
    }
  }, []);

  const getAttendance = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const result = await attendanceApi.getAttendance(params);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance');
      setLoading(false);
      throw err;
    }
  }, []);

  const getAttendanceSummary = useCallback(async (staffId, params) => {
    setLoading(true);
    setError(null);
    try {
      const result = await attendanceApi.getAttendanceSummary(staffId, params);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance summary');
      setLoading(false);
      throw err;
    }
  }, []);

  const updateAttendance = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await attendanceApi.updateAttendance(id, data);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update attendance');
      setLoading(false);
      throw err;
    }
  }, []);

  const deleteAttendance = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await attendanceApi.deleteAttendance(id);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete attendance');
      setLoading(false);
      throw err;
    }
  }, []);

  const autoMarkAbsent = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await attendanceApi.autoMarkAbsent(data);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to auto-mark absent');
      setLoading(false);
      throw err;
    }
  }, []);

  const getAttendanceConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await attendanceApi.getAttendanceConfig();
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance config');
      setLoading(false);
      throw err;
    }
  }, []);

  const updateAttendanceConfig = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await attendanceApi.updateAttendanceConfig(data);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update attendance config');
      setLoading(false);
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    markAttendance,
    bulkMarkAttendance,
    getAttendance,
    getAttendanceSummary,
    updateAttendance,
    deleteAttendance,
    autoMarkAbsent,
    getAttendanceConfig,
    updateAttendanceConfig,
  };
};
