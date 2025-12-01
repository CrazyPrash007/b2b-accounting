// useItemCategories.js
import { useEffect, useState, useCallback } from "react";
import * as api from "../api/itemCategory.api";

/**
 * useItemCategories
 * - loads list on mount
 * - provides create/update/delete with optimistic UI
 * - simple error & loading states
 *
 * Note: you can later swap internal storage/caching to react-query or SWR.
 */

const STORAGE_KEY = "munim_item_categories_v1_demo";

export default function useItemCategories({ useLocalFallback = true } = {}) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.listItemCategories();
            setRows(Array.isArray(data) ? data : []);
            // keep a local fallback copy for offline/dev
            if (useLocalFallback) localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(data) ? data : []));
        } catch (err) {
            // if API fails and fallback allowed, read from localStorage
            if (useLocalFallback) {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    setRows(JSON.parse(saved));
                    setError(null);
                } else {
                    setError(err);
                }
            } else {
                setError(err);
            }
        } finally {
            setLoading(false);
        }
    }, [useLocalFallback]);

    useEffect(() => {
        load();
    }, [load]);

    const create = useCallback(
        async (payload) => {
            // optimistic id (temporary) - server will return real id
            const tempId = `temp_${Date.now()}`;
            const temp = { id: tempId, ...payload, createdAt: new Date().toISOString() };
            setRows((s) => [temp, ...s]);

            try {
                const created = await api.createItemCategory(payload);
                // replace temp with created (match by tempId if server returns id)
                setRows((s) => s.map((r) => (r.id === tempId ? created : r)));
                // update fallback
                if (useLocalFallback) localStorage.setItem(STORAGE_KEY, JSON.stringify([created, ...rows]));
                return created;
            } catch (err) {
                // rollback optimistic
                setRows((s) => s.filter((r) => r.id !== tempId));
                throw err;
            }
        },
        [useLocalFallback, rows]
    );

    const update = useCallback(
        async (id, payload) => {
            // optimistic update
            const prev = rows;
            setRows((s) => s.map((r) => (r.id === id ? { ...r, ...payload } : r)));
            try {
                const updated = await api.updateItemCategory(id, payload);
                setRows((s) => s.map((r) => (r.id === id ? updated : r)));
                if (useLocalFallback) localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
                return updated;
            } catch (err) {
                // rollback
                setRows(prev);
                throw err;
            }
        },
        [rows, useLocalFallback]
    );

    const remove = useCallback(
        async (id) => {
            const prev = rows;
            setRows((s) => s.filter((r) => r.id !== id));
            try {
                await api.deleteItemCategory(id);
                if (useLocalFallback) localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.filter((r) => r.id !== id)));
                return true;
            } catch (err) {
                setRows(prev);
                throw err;
            }
        },
        [rows, useLocalFallback]
    );

    return { rows, loading, error, reload: load, create, update, remove };
}
