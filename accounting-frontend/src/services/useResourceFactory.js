// src/hooks/useResourceFactory.js
import { useState, useEffect, useContext, useCallback } from "react";
import { CompanyContext } from "src/App";

export default function createResourceHook(api) {
    return function useResource() {
        const context = useContext(CompanyContext);
        const selectedCompany = context?.selectedCompany || "";

        const [rows, setRows] = useState([]);
        const [meta, setMeta] = useState({});
        const [loading, setLoading] = useState(true); // Start with loading=true
        const [error, setError] = useState(null);

        const normalize = (item) => ({
            ...item,
            id: item.id || item._id,  // critical for all resources
        });

        const load = useCallback(async () => {
            if (!selectedCompany) {
                setRows([]);
                setMeta({});
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await api.list(selectedCompany);
                // Check if response has data and meta structure
                if (response && typeof response === 'object' && 'data' in response) {
                    const normalized = Array.isArray(response.data)
                        ? response.data.map(normalize)
                        : [];
                    setRows(normalized);
                    setMeta(response.meta || {});
                } else {
                    // Legacy format: direct array
                    const normalized = Array.isArray(response)
                        ? response.map(normalize)
                        : [];
                    setRows(normalized);
                    setMeta({});
                }
            } catch (err) {
                setError(err);
                setRows([]);
                setMeta({});
            } finally {
                setLoading(false);
            }
        }, [selectedCompany]);

        useEffect(() => {
            load();
        }, [load]);

        const create = useCallback(async (payload) => {
            if (!selectedCompany) throw new Error("No company selected");
            await api.create(payload, selectedCompany);
            return load();
        }, [selectedCompany, load]);

        const update = useCallback(async (id, payload) => {
            if (!selectedCompany) throw new Error("No company selected");
            await api.update(id, payload, selectedCompany);
            return load();
        }, [selectedCompany, load]);

        const remove = useCallback(async (id) => {
            if (!selectedCompany) throw new Error("No company selected");
            await api.remove(id, selectedCompany);
            return load();
        }, [selectedCompany, load]);

        return { rows, meta, loading, error, reload: load, create, update, remove };
    };
}
