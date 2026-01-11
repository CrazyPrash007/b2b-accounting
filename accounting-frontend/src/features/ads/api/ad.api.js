// src/features/ads/api/ad.api.js
import apiClient from "src/services/apiClient";

const BASE = "/api/ads";

const adApi = {
    // Get targeting options (categories, positions, states, dimensions)
    async getTargetingOptions() {
        const res = await apiClient.get(`${BASE}/targeting-options`);
        return res?.data?.data || {};
    },

    // Get user's ad stats
    async getMyStats() {
        const res = await apiClient.get(`${BASE}/my-stats`);
        return res?.data?.data || {};
    },

    // List user's own ads
    async listMyAds(params = {}) {
        const res = await apiClient.get(`${BASE}/my`, { params });
        return res?.data || { data: [], pagination: {} };
    },

    // Create new ad
    async create(data) {
        const res = await apiClient.post(BASE, data);
        return res?.data;
    },

    // Get single ad
    async getOne(id) {
        const res = await apiClient.get(`${BASE}/${id}`);
        return res?.data?.data || null;
    },

    // Update ad
    async update(id, data) {
        const res = await apiClient.put(`${BASE}/${id}`, data);
        return res?.data;
    },

    // Delete ad
    async remove(id) {
        const res = await apiClient.delete(`${BASE}/${id}`);
        return res?.data;
    },

    // Stop ad
    async stop(id) {
        const res = await apiClient.patch(`${BASE}/${id}/stop`);
        return res?.data;
    },

    // Reactivate ad
    async reactivate(id) {
        const res = await apiClient.patch(`${BASE}/${id}/reactivate`);
        return res?.data;
    }
};

export default adApi;
