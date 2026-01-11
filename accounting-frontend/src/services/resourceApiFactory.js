// src/services/resourceApiFactory.js
import apiClient from "src/services/apiClient";

export default function createResourceApi(resourceBasePath) {
    const BASE = resourceBasePath; // e.g., "/api/bank", "/api/unit"

    return {
        // LIST
        async list(accountCompanyName) {
            const res = await apiClient.get(BASE, {
                params: { accountCompanyName }
            });
            // Return the full response structure with data and meta
            if (res?.data && typeof res.data === 'object') {
                return {
                    data: res.data.data || [],
                    meta: res.data.meta || {}
                };
            }
            // Fallback for legacy responses
            return { data: res?.data || [], meta: {} };
        },

        // CREATE
        async create(payload, accountCompanyName) {
            console.log('[resourceApiFactory] create payload:', payload);
            console.log('[resourceApiFactory] gstNumber in payload:', payload.gstNumber);
            const res = await apiClient.post(BASE, {
                ...payload,
                accountCompanyName,
            });
            return res?.data?.data;
        },

        // UPDATE
        async update(id, payload, accountCompanyName) {
            const res = await apiClient.put(`${BASE}/${id}`, {
                ...payload,
                accountCompanyName
            });
            return res?.data?.data;
        },

        // DELETE
        async remove(id, accountCompanyName) {
            const res = await apiClient.delete(`${BASE}/${id}`, {
                params: { accountCompanyName }
            });
            return res?.data?.data;
        }
    };
}
