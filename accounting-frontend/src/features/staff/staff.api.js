// src/features/staff/staff.api.js
import apiClient from 'src/services/apiClient';

const BASE_URL = '/api/staff';

export const staffApi = {
    // Get all staff with optional abort signal for request cancellation
    getAll: async (params = {}, signal = null) => {
        const config = { params };
        if (signal) {
            config.signal = signal;
        }
        const response = await apiClient.get(BASE_URL, config);
        return response.data;
    },

    // Get active staff list for dropdowns
    getActiveList: async (params = {}, signal = null) => {
        const config = { params };
        if (signal) {
            config.signal = signal;
        }
        const response = await apiClient.get(`${BASE_URL}/active`, config);
        return response.data;
    },

    // Get single staff by ID
    getById: async (id) => {
        const response = await apiClient.get(`${BASE_URL}/${id}`);
        return response.data;
    },

    // Create new staff
    create: async (data) => {
        const response = await apiClient.post(BASE_URL, data);
        return response.data;
    },

    // Update staff
    update: async (id, data) => {
        const response = await apiClient.put(`${BASE_URL}/${id}`, data);
        return response.data;
    },

    // Toggle staff status
    toggleStatus: async (id, statusData) => {
        const response = await apiClient.patch(`${BASE_URL}/${id}/status`, statusData);
        return response.data;
    },

    // Delete staff
    delete: async (id) => {
        const response = await apiClient.delete(`${BASE_URL}/${id}`);
        return response.data;
    },

    // Get salary history
    getSalaryHistory: async (id) => {
        const response = await apiClient.get(`${BASE_URL}/${id}/salary-history`);
        return response.data;
    },

    // Add salary increase
    addSalaryIncrease: async (id, data) => {
        const response = await apiClient.post(`${BASE_URL}/${id}/salary-increase`, data);
        return response.data;
    },

    // Get current salary
    getCurrentSalary: async (id, asOfDate = null) => {
        const params = asOfDate ? { asOfDate } : {};
        const response = await apiClient.get(`${BASE_URL}/${id}/current-salary`, { params });
        return response.data;
    }
};
