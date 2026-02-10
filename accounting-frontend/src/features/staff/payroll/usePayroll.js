import { useState, useCallback } from 'react';
import { payrollApi } from './payroll.api';

export const usePayroll = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createPayrollPeriod = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await payrollApi.createPayrollPeriod(data);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create payroll period');
      setLoading(false);
      throw err;
    }
  }, []);

  const getPayrollPeriods = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const result = await payrollApi.getPayrollPeriods(params);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch payroll periods');
      setLoading(false);
      throw err;
    }
  }, []);

  const getPayrollPeriod = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await payrollApi.getPayrollPeriod(id);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch payroll period');
      setLoading(false);
      throw err;
    }
  }, []);

  const deletePayrollPeriod = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await payrollApi.deletePayrollPeriod(id);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete payroll period');
      setLoading(false);
      throw err;
    }
  }, []);

  const calculatePayroll = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await payrollApi.calculatePayroll(data);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate payroll');
      setLoading(false);
      throw err;
    }
  }, []);

  const getPayrollCalculations = useCallback(async (payrollPeriodId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await payrollApi.getPayrollCalculations(payrollPeriodId);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch payroll calculations');
      setLoading(false);
      throw err;
    }
  }, []);

  const getPayrollCalculation = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await payrollApi.getPayrollCalculation(id);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch payroll calculation');
      setLoading(false);
      throw err;
    }
  }, []);

  const updatePayrollCalculation = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await payrollApi.updatePayrollCalculation(id, data);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update payroll calculation');
      setLoading(false);
      throw err;
    }
  }, []);

  const recordPayment = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await payrollApi.recordPayment(data);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
      setLoading(false);
      throw err;
    }
  }, []);

  const bulkPayment = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await payrollApi.bulkPayment(data);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process bulk payment');
      setLoading(false);
      throw err;
    }
  }, []);

  const approvePayroll = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await payrollApi.approvePayroll(id);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve payroll');
      setLoading(false);
      throw err;
    }
  }, []);

  const unlockPayroll = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await payrollApi.unlockPayroll(id);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unlock payroll');
      setLoading(false);
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    createPayrollPeriod,
    getPayrollPeriods,
    getPayrollPeriod,
    deletePayrollPeriod,
    calculatePayroll,
    getPayrollCalculations,
    getPayrollCalculation,
    updatePayrollCalculation,
    recordPayment,
    bulkPayment,
    approvePayroll,
    unlockPayroll,
  };
};
