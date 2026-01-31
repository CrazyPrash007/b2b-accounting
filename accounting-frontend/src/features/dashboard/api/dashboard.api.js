// src/features/dashboard/api/dashboard.api.js
import apiClient from "src/services/apiClient";
import { getCurrentCompany } from "src/services/companyContextAccessor";

const dashboardApi = {
    /**
     * Get dashboard statistics
     * @param {string} period - 'current-month', 'last-month', 'current-year', 'last-year', 'all-time', 'custom'
     * @param {string} startDate - Custom start date (for period='custom')
     * @param {string} endDate - Custom end date (for period='custom')
     * @returns {Promise} Dashboard stats
     */
    getStats: async (period = 'current-month', startDate = null, endDate = null) => {
        const companyId = getCurrentCompany();
        
        console.log('Dashboard API - Company ID:', companyId);
        
        if (!companyId) {
            throw new Error('No company selected');
        }

        const params = {
            companyId: companyId,
            period
        };

        if (period === 'custom' && startDate && endDate) {
            params.startDate = startDate;
            params.endDate = endDate;
        }

        console.log('Dashboard API - Request params:', params);

        try {
            const response = await apiClient.get('/api/dashboard/stats', { params });
            console.log('Dashboard API - Response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Dashboard API - Error:', error);
            throw error;
        }
    },

    /**
     * Get stats for a specific dashboard section (section-level filtering)
     * @param {string} sectionName - Section name: businessOperations, revenueProjections, totalIncome, revenueInflow, revenueManagement, saleAnalytics
     * @param {string} period - Filter period
     * @param {string} startDate - Custom start date
     * @param {string} endDate - Custom end date
     * @returns {Promise} Section-specific stats
     */
    getSectionStats: async (sectionName, period = 'current-month', startDate = null, endDate = null) => {
        const companyId = getCurrentCompany();
        
        if (!companyId) {
            throw new Error('No company selected');
        }

        const params = {
            companyId: companyId,
            period
        };

        if (period === 'custom' && startDate && endDate) {
            params.startDate = startDate;
            params.endDate = endDate;
        }

        try {
            const response = await apiClient.get(`/api/dashboard/section/${sectionName}`, { params });
            return response.data;
        } catch (error) {
            console.error(`Dashboard Section API Error (${sectionName}):`, error);
            throw error;
        }
    }
};

export default dashboardApi;
