// src/features/items/unit/api/income.api.js
import resourceApiFactory from "src/services/resourceApiFactory";
const api = resourceApiFactory("/api/income");

// keep defaults
export const listIncomes = api.list;

// Override create to support FormData
export async function createIncome(payload) {
    if (payload instanceof FormData) {
        // assume apiClient is available from resourceApiFactory internals:
        const apiClient = require("src/services/apiClient").default;
        const res = await apiClient.post("/api/income", payload, {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
        });
        return res.data;
    }
    return api.create(payload);
}

export async function updateIncome(id, payload) {
    if (payload instanceof FormData) {
        const apiClient = require("src/services/apiClient").default;
        const res = await apiClient.put(`/api/income/${id}`, payload, {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
        });
        return res.data;
    }
    return api.update(id, payload);
}

export const deleteIncome = api.remove;
