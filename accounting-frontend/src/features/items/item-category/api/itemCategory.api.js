let apiClient = null;
try {
    apiClient = require("src/services/apiClient").default;
} catch (err) {
    apiClient = null;
}

const BASE = "/api/item-categories";
const API_URL = import.meta.env.VITE_API_BASE_URL;

const FULL_BASE = (API_URL && API_URL.length)
    ? `${API_URL}${BASE}`
    : BASE;

/**
 * If backend returns { success, data, meta }, return data.
 * Also normalize Mongo _id -> id for objects/arrays.
 */
function unwrapAndNormalize(body) {
    const payload = (body && typeof body === "object" && body.hasOwnProperty("data")) ? body.data : body;

    if (Array.isArray(payload)) {
        return payload.map(normalizeDoc);
    } else if (payload && typeof payload === "object") {
        return normalizeDoc(payload);
    }
    return payload;
}

function normalizeDoc(doc) {
    if (!doc || typeof doc !== "object") return doc;
    // keep existing id if present; else map _id to id
    const id = doc.id || doc._id || (doc._id ? String(doc._id) : undefined);
    // shallow clone, keep _id also if needed
    return { ...doc, id };
}

export async function listItemCategories(params = {}) {
    if (apiClient) {
        const res = await apiClient.get(FULL_BASE, { params });
        return unwrapAndNormalize(res.data);
    } else {
        const q = new URLSearchParams(params).toString();
        const res = await fetch(`${FULL_BASE}${q ? `?${q}` : ""}`, { credentials: "same-origin" });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Failed to fetch item categories: ${res.status} ${txt}`);
        }
        const body = await res.json();
        return unwrapAndNormalize(body);
    }
}

export async function createItemCategory(payload) {

    if (apiClient) {
        const res = await apiClient.post(FULL_BASE, payload);
        return unwrapAndNormalize(res.data);
    } else {
        const res = await fetch(FULL_BASE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Failed to create item category: ${res.status} ${txt}`);
        }
        const body = await res.json();
        console.log("Creating item category. Using base:", apiClient ? apiClient.defaults.baseURL : FULL_BASE, "payload:", payload);

        return unwrapAndNormalize(body);
    }
}

export async function updateItemCategory(id, payload) {
    if (!id) throw new Error("id required for update");
    if (apiClient) {
        const res = await apiClient.put(`${FULL_BASE}/${id}`, payload);
        return unwrapAndNormalize(res.data);
    } else {
        const res = await fetch(`${FULL_BASE}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Failed to update item category: ${res.status} ${txt}`);
        }
        const body = await res.json();
        return unwrapAndNormalize(body);
    }
}

export async function deleteItemCategory(id) {
    if (!id) throw new Error("id required for delete");
    if (apiClient) {
        const res = await apiClient.delete(`${FULL_BASE}/${id}`);
        return unwrapAndNormalize(res.data);
    } else {
        const res = await fetch(`${FULL_BASE}/${id}`, {
            method: "DELETE",
            credentials: "same-origin",
        });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Failed to delete item category: ${res.status} ${txt}`);
        }
        const body = await res.json();
        return unwrapAndNormalize(body);
    }
}
