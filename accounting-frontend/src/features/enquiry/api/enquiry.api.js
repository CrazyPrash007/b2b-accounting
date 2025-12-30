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
    // Pass userState to filter by enquiry targetStates
    async listPublic(params = {}) {
        const res = await apiClient.get(`${BASE}/public`, {
            params
        });
        return res?.data?.data || [];
    },

    // List vendor-targeted enquiries (enquiries sent specifically to user)
    async listVendorEnquiries(params = {}) {
        const res = await apiClient.get(`${BASE}/vendor`, {
            params
        });
        return res?.data?.data || [];
    },

    // List user's responses to enquiries
    async listMyResponses(params = {}) {
        const res = await apiClient.get(`${BASE}/my-responses`, {
            params
        });
        return res?.data?.data || [];
    },

    // Get registered vendors (for vendor selection in enquiry creation)
    async getRegisteredVendors(accountCompanyName, search = '') {
        const res = await apiClient.get(`${BASE}/registered-vendors`, {
            params: { accountCompanyName, search }
        });
        return res?.data?.data || [];
    },

    // Get single enquiry
    async getOne(id) {
        const res = await apiClient.get(`${BASE}/${id}`);
        return res?.data?.data;
    },

    // Get responses for an enquiry with filtering/sorting
    async getEnquiryResponses(id, params = {}) {
        const res = await apiClient.get(`${BASE}/${id}/responses`, {
            params
        });
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
    async close(id, accountCompanyName, closureReason = '') {
        const res = await apiClient.patch(`${BASE}/${id}/close`, 
            { closureReason },
            { params: { accountCompanyName } }
        );
        return res?.data?.data;
    },

    // Mark response as viewed
    async markResponseViewed(enquiryId, responseId) {
        const res = await apiClient.patch(`${BASE}/${enquiryId}/responses/${responseId}/viewed`);
        return res?.data?.data;
    },

    // Select/Accept a response (rejects all other responses)
    async selectResponse(enquiryId, responseId, accountCompanyName, selectionNote = '') {
        const res = await apiClient.patch(
            `${BASE}/${enquiryId}/responses/${responseId}/select`,
            { selectionNote },
            { params: { accountCompanyName } }
        );
        return res?.data?.data;
    }
};

export default enquiryApi;
