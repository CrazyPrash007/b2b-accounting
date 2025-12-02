// src/services/useResourceFactory.js
import { useEffect, useState, useCallback } from "react";

export default function createUseResource(api, storageKey) {
    return function useResource({ useLocalFallback = true } = {}) {
        const [rows, setRows] = useState([]);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState(null);

        const load = useCallback(async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await api.list();
                setRows(Array.isArray(data) ? data : []);
                if (useLocalFallback && storageKey) {
                    localStorage.setItem(storageKey, JSON.stringify(Array.isArray(data) ? data : []));
                }
            } catch (err) {
                if (useLocalFallback && storageKey) {
                    const saved = localStorage.getItem(storageKey);
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
        }, [api, useLocalFallback, storageKey]);

        useEffect(() => {
            load();
        }, [load]);

        const create = useCallback(
            async (payload) => {
                const tempId = `temp_${Date.now()}`;
                const temp = { id: tempId, ...payload, createdAt: new Date().toISOString() };
                setRows((s) => [temp, ...s]);

                try {
                    const created = await api.create(payload);
                    setRows((s) => s.map((r) => (r.id === tempId ? created : r)));
                    if (useLocalFallback && storageKey) localStorage.setItem(storageKey, JSON.stringify([created, ...rows]));
                    return created;
                } catch (err) {
                    console.error(`${storageKey} create error details:`, err);
                    setRows((s) => s.filter((r) => r.id !== tempId));
                    throw err;
                }
            },
            [api, rows, useLocalFallback, storageKey]
        );

        const update = useCallback(
            async (id, payload) => {
                const prev = rows;
                setRows((s) => s.map((r) => (r.id === id ? { ...r, ...payload } : r)));
                try {
                    const updated = await api.update(id, payload);
                    setRows((s) => s.map((r) => (r.id === id ? updated : r)));
                    if (useLocalFallback && storageKey) localStorage.setItem(storageKey, JSON.stringify(rows));
                    return updated;
                } catch (err) {
                    setRows(prev);
                    throw err;
                }
            },
            [api, rows, useLocalFallback, storageKey]
        );

        const remove = useCallback(
            async (id) => {
                const prev = rows;
                setRows((s) => s.filter((r) => r.id !== id));
                try {
                    await api.remove(id);
                    if (useLocalFallback && storageKey) localStorage.setItem(storageKey, JSON.stringify(rows.filter((r) => r.id !== id)));
                    return true;
                } catch (err) {
                    setRows(prev);
                    throw err;
                }
            },
            [api, rows, useLocalFallback, storageKey]
        );

        return { rows, loading, error, reload: load, create, update, remove };
    };
}
