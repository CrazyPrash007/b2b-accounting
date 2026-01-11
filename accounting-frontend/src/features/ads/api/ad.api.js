// src/features/ads/api/ad.api.js
import apiClient from "src/services/apiClient";

const BASE = "/api/ads";

const adApi = {
    // Get targeting options (categories, positions, states, dimensions)
    async getTargetingOptions() {
        const res = await apiClient.get(`${BASE}/targeting-options`);
        return res?.data?.data || {};
    },

    // Get user's ad stats for a company
    async getMyStats(companyId) {
        const res = await apiClient.get(`${BASE}/my-stats`, {
            params: { companyId }
        });
        return res?.data?.data || {};
    },

    // List user's own ads for a company
    async listMyAds(companyId, params = {}) {
        const res = await apiClient.get(`${BASE}/my`, {
            params: { companyId, ...params }
        });
        return res?.data || { data: [], pagination: {} };
    },

    // Create new ad
    async create(data, companyId) {
        const res = await apiClient.post(BASE, { ...data, companyId });
        return res?.data;
    },

    // Get single ad
    async getOne(id, companyId) {
        const res = await apiClient.get(`${BASE}/${id}`, {
            params: { companyId }
        });
        return res?.data?.data || null;
    },

    // Update ad
    async update(id, data, companyId) {
        const res = await apiClient.put(`${BASE}/${id}`, { ...data, companyId });
        return res?.data;
    },

    // Delete ad
    async remove(id, companyId) {
        const res = await apiClient.delete(`${BASE}/${id}`, {
            params: { companyId }
        });
        return res?.data;
    },

    // Stop ad
    async stop(id, companyId) {
        const res = await apiClient.patch(`${BASE}/${id}/stop`, { companyId });
        return res?.data;
    },

    // Reactivate ad
    async reactivate(id, companyId) {
        const res = await apiClient.patch(`${BASE}/${id}/reactivate`, { companyId });
        return res?.data;
    }
};

export default adApi;
