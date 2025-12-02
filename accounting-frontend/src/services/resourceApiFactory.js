// src/services/resourceApiFactory.js
let apiClient = null;
try {
    apiClient = require("src/services/apiClient").default;
} catch (err) {
    apiClient = null;
}

const API_URL = import.meta.env.VITE_API_BASE_URL || "";


function resourceApiFactory(resourcePath) {
    const BASE = resourcePath;
    const FULL_BASE = (API_URL && API_URL.length) ? `${API_URL.replace(/\/$/, "")}${BASE}` : BASE;

    function unwrap(body) {
        const payload = (body && typeof body === "object" && body.hasOwnProperty("data")) ? body.data : body;
        if (Array.isArray(payload)) return payload.map(normalizeDoc);
        if (payload && typeof payload === "object") return normalizeDoc(payload);
        return payload;
    }

    function normalizeDoc(doc) {
        if (!doc || typeof doc !== "object") return doc;
        const id = doc.id || doc._id || (doc._id ? String(doc._id) : undefined);
        return { ...doc, id };
    }

    return {
        async list(params = {}) {
            if (apiClient) {
                const res = await apiClient.get(BASE, { params });
                return unwrap(res.data);
            } else {
                const q = new URLSearchParams(params).toString();
                const res = await fetch(`${FULL_BASE}${q ? `?${q}` : ""}`, { credentials: "same-origin" });
                if (!res.ok) throw new Error(`Failed to fetch ${BASE}: ${res.status}`);
                const body = await res.json();
                return unwrap(body);
            }
        },

        async create(payload) {
            if (apiClient) {
                const res = await apiClient.post(BASE, payload);
                return unwrap(res.data);
            } else {
                const res = await fetch(FULL_BASE, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "same-origin",
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error(`Failed to create ${BASE}: ${res.status}`);
                const body = await res.json();
                return unwrap(body);
            }
        },

        async update(id, payload) {
            if (!id) throw new Error("id required for update");
            if (apiClient) {
                const res = await apiClient.put(`${BASE}/${id}`, payload);
                return unwrap(res.data);
            } else {
                const res = await fetch(`${FULL_BASE}/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "same-origin",
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error(`Failed to update ${BASE}/${id}: ${res.status}`);
                const body = await res.json();
                return unwrap(body);
            }
        },

        async remove(id) {
            if (!id) throw new Error("id required for delete");
            if (apiClient) {
                const res = await apiClient.delete(`${BASE}/${id}`);
                return unwrap(res.data);
            } else {
                const res = await fetch(`${FULL_BASE}/${id}`, {
                    method: "DELETE",
                    credentials: "same-origin",
                });
                if (!res.ok) throw new Error(`Failed to delete ${BASE}/${id}: ${res.status}`);
                const body = await res.json();
                return unwrap(body);
            }
        },
    };
}

export default resourceApiFactory;
