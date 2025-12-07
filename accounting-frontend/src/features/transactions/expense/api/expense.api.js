// src/features/items/unit/api/expense.api.js
import resourceApiFactory from "src/services/resourceApiFactory";
const api = resourceApiFactory("/api/expense");

// keep defaults
export const listExpenses = api.list;

// Override create to support FormData
export async function createExpense(payload) {
    if (payload instanceof FormData) {
        const apiClient = require("src/services/apiClient").default;
        const res = await apiClient.post("/api/expense", payload, {
            withCredentials: true,
        });
        return res.data;
    }
    return api.create(payload);
}

export async function updateExpense(id, payload) {
    if (payload instanceof FormData) {
        const apiClient = require("src/services/apiClient").default;
        const res = await apiClient.put(`/api/expense/${id}`, payload, {
            withCredentials: true,
        });
        return res.data;
    }
    return api.update(id, payload);
}

export const deleteExpense = api.remove;
