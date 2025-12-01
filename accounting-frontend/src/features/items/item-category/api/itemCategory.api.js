
let apiClient = null;
try {
    apiClient = require("src/services/apiClient").default;
} catch (err) {
    apiClient = null;
}

const BASE = "/api/item-categories";

export async function listItemCategories(params = {}) {
    if (apiClient) {
        const res = await apiClient.get(BASE, { params });
        return res.data;
    } else {
        // fallback fetch
        const q = new URLSearchParams(params).toString();
        const res = await fetch(`${BASE}${q ? `?${q}` : ""}`, { credentials: "same-origin" });
        if (!res.ok) throw new Error("Failed to fetch item categories");
        return res.json();
    }
}

export async function createItemCategory(payload) {
    if (apiClient) {
        const res = await apiClient.post(BASE, payload);
        return res.data;
    } else {
        const res = await fetch(BASE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create item category");
        return res.json();
    }
}

export async function updateItemCategory(id, payload) {
    if (apiClient) {
        const res = await apiClient.put(`${BASE}/${id}`, payload);
        return res.data;
    } else {
        const res = await fetch(`${BASE}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update item category");
        return res.json();
    }
}

export async function deleteItemCategory(id) {
    if (apiClient) {
        const res = await apiClient.delete(`${BASE}/${id}`);
        return res.data;
    } else {
        const res = await fetch(`${BASE}/${id}`, {
            method: "DELETE",
            credentials: "same-origin",
        });
        if (!res.ok) throw new Error("Failed to delete item category");
        return res.json();
    }
}
