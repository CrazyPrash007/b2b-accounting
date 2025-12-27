// src/features/enquiry/api/enquiry.api.js
import apiClient from "src/services/apiClient";

const BASE = "/api/enquiries";

const enquiryApi = {
    // List user's own enquiries
    async listMy(accountCompanyName, params = {}) {
        const res = await apiClient.get(`${BASE}/my`, {
            params: { accountCompanyName, ...params }
        });
        return res?.data?.data || [];
    },

    // List public enquiries (others' open enquiries)
    async listPublic(params = {}) {
        const res = await apiClient.get(`${BASE}/public`, {
            params
        });
        return res?.data?.data || [];
    },

    // Get single enquiry
    async getOne(id) {
        const res = await apiClient.get(`${BASE}/${id}`);
        return res?.data?.data;
    },

    // Create new enquiry
    async create(payload, accountCompanyName) {
        const res = await apiClient.post(BASE, {
            ...payload,
            accountCompanyName,
        });
        return res?.data?.data;
    },

    // Update enquiry
    async update(id, payload, accountCompanyName) {
        const res = await apiClient.put(`${BASE}/${id}`, {
            ...payload,
            accountCompanyName
        });
        return res?.data?.data;
    },

    // Delete enquiry (soft delete)
    async remove(id, accountCompanyName) {
        const res = await apiClient.delete(`${BASE}/${id}`, {
            params: { accountCompanyName }
        });
        return res?.data?.data;
    },

    // Respond to an enquiry
    async respond(id, payload) {
        const res = await apiClient.post(`${BASE}/${id}/respond`, payload);
        return res?.data?.data;
    },

    // Close an enquiry
    async close(id, accountCompanyName) {
        const res = await apiClient.patch(`${BASE}/${id}/close`, null, {
            params: { accountCompanyName }
        });
        return res?.data?.data;
    }
};

export default enquiryApi;
