import apiClient from 'src/services/apiClient';
import { getCurrentCompany } from 'src/services/companyContextAccessor';

const BASE_URL = '/api/payroll';

/** Merge accountCompanyName into POST/PUT body */
const withCompany = (data = {}) => ({
  ...data,
  accountCompanyName: data.accountCompanyName || getCurrentCompany(),
});

export const payrollApi = {
  // Payroll Period endpoints
  createPayrollPeriod: async (data) => {
    const response = await apiClient.post(`${BASE_URL}/periods`, withCompany(data));
    return response.data;
  },

  getPayrollPeriods: async (params) => {
    const response = await apiClient.get(`${BASE_URL}/periods`, { params });
    return response.data;
  },

  getPayrollPeriod: async (id) => {
    const response = await apiClient.get(`${BASE_URL}/periods/${id}`);
    return response.data;
  },

  deletePayrollPeriod: async (id) => {
    const response = await apiClient.delete(`${BASE_URL}/periods/${id}`);
    return response.data;
  },

  // Payroll Calculation endpoints
  calculatePayroll: async (data) => {
    const response = await apiClient.post(`${BASE_URL}/calculate`, withCompany(data));
    return response.data;
  },

  getPayrollCalculations: async (payrollPeriodId) => {
    const response = await apiClient.get(`${BASE_URL}/calculations/${payrollPeriodId}`);
    return response.data;
  },

  getPayrollCalculation: async (id) => {
    const response = await apiClient.get(`${BASE_URL}/calculation/${id}`);
    return response.data;
  },

  updatePayrollCalculation: async (id, data) => {
    const response = await apiClient.put(`${BASE_URL}/calculations/${id}`, withCompany(data));
    return response.data;
  },

  // Payment endpoints
  recordPayment: async (data) => {
    const response = await apiClient.post(`${BASE_URL}/payment`, withCompany(data));
    return response.data;
  },

  bulkPayment: async (data) => {
    const response = await apiClient.post(`${BASE_URL}/bulk-payment`, withCompany(data));
    return response.data;
  },

  // Approval and locking
  approvePayroll: async (id) => {
    const response = await apiClient.post(`${BASE_URL}/approve/${id}`, withCompany());
    return response.data;
  },

  unlockPayroll: async (id) => {
    const response = await apiClient.post(`${BASE_URL}/unlock/${id}`, withCompany());
    return response.data;
  },
};
