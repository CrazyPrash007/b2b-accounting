import apiClient from 'src/services/apiClient';
import { getCurrentCompany } from 'src/services/companyContextAccessor';

const BASE_URL = '/api/attendance';

export const attendanceApi = {
  // Mark single attendance
  markAttendance: async (data) => {
    const response = await apiClient.post(BASE_URL, {
      ...data,
      accountCompanyName: getCurrentCompany()
    });
    return response.data;
  },

  // Bulk mark attendance
  bulkMarkAttendance: async (data) => {
    const response = await apiClient.post(`${BASE_URL}/bulk`, {
      ...data,
      accountCompanyName: getCurrentCompany()
    });
    return response.data;
  },

  // Get attendance records
  getAttendance: async (params) => {
    const response = await apiClient.get(BASE_URL, { 
      params: {
        ...params,
        accountCompanyName: getCurrentCompany()
      }
    });
    return response.data;
  },

  // Get attendance summary for a staff
  getAttendanceSummary: async (staffId, params) => {
    const response = await apiClient.get(`${BASE_URL}/summary/${staffId}`, {
      params: {
        ...params,
        accountCompanyName: getCurrentCompany()
      }
    });
    return response.data;
  },

  // Update attendance
  updateAttendance: async (id, data) => {
    const response = await apiClient.put(`${BASE_URL}/${id}`, {
      ...data,
      accountCompanyName: getCurrentCompany()
    });
    return response.data;
  },

  // Delete attendance
  deleteAttendance: async (id) => {
    const response = await apiClient.delete(`${BASE_URL}/${id}`, {
      params: { accountCompanyName: getCurrentCompany() }
    });
    return response.data;
  },

  // Auto mark absent
  autoMarkAbsent: async (data) => {
    const response = await apiClient.post(`${BASE_URL}/auto-mark-absent`, {
      ...data,
      accountCompanyName: getCurrentCompany()
    });
    return response.data;
  },

  // Get attendance config
  getAttendanceConfig: async () => {
    const response = await apiClient.get(`${BASE_URL}/config`, {
      params: { accountCompanyName: getCurrentCompany() }
    });
    return response.data;
  },

  // Update attendance config
  updateAttendanceConfig: async (data) => {
    const response = await apiClient.put(`${BASE_URL}/config`, {
      ...data,
      accountCompanyName: getCurrentCompany()
    });
    return response.data;
  },
};
