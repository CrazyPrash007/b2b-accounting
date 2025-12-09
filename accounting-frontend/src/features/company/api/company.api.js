// src/features/company/api/company.api.js
// Company API - Placeholder implementation
// These functions can be implemented when the backend endpoints are available.
// Currently returns null/empty to allow graceful degradation.

import apiClient from "src/services/apiClient";

const API_BASE = "/api/companies";

/**
 * Fetch all companies for the current user
 * @returns {Promise<Array|null>}
 */
export async function fetchCompanies() {
    try {
        if (!apiClient) return null;
        const res = await apiClient.get(API_BASE);
        const data = res?.data;
        if (data && typeof data === "object" && Array.isArray(data.data)) {
            return data.data;
        }
        if (Array.isArray(data)) {
            return data;
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Switch the active company
 * @param {string} companyId 
 * @returns {Promise<Object|null>}
 */
export async function switchCompany(companyId) {
    try {
        if (!apiClient || !companyId) return null;
        const res = await apiClient.post(`${API_BASE}/switch`, { companyId });
        return res?.data ?? null;
    } catch {
        return null;
    }
}

/**
 * Create a new company
 * @param {Object} payload 
 * @returns {Promise<Object|null>}
 */
export async function createCompany(payload) {
    try {
        if (!apiClient) return null;
        const res = await apiClient.post(API_BASE, payload);
        const data = res?.data;
        if (data && typeof data === "object" && data.data) {
            return data.data;
        }
        return data ?? null;
    } catch {
        return null;
    }
}

/**
 * Get the currently active company
 * @returns {Promise<Object|null>}
 */
export async function getActiveCompany() {
    try {
        if (!apiClient) return null;
        const res = await apiClient.get(`${API_BASE}/active`);
        const data = res?.data;
        if (data && typeof data === "object" && data.data) {
            return data.data;
        }
        return data ?? null;
    } catch {
        return null;
    }
}

// Default export as an object for optional chaining in consumers
const companyApi = {
    fetchCompanies,
    switchCompany,
    createCompany,
    getActiveCompany,
};

export default companyApi;
