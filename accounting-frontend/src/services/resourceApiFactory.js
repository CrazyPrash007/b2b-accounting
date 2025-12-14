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
            return res?.data?.data || [];
        },

        // CREATE
        async create(payload, accountCompanyName) {
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
