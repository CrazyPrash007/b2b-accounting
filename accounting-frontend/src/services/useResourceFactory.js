// src/hooks/useResourceFactory.js
import { useState, useEffect, useContext, useCallback } from "react";
import { CompanyContext } from "src/App";

export default function createResourceHook(api) {
    return function useResource() {
        const context = useContext(CompanyContext);
        const selectedCompany = context?.selectedCompany || "";

        const [rows, setRows] = useState([]);
        const [loading, setLoading] = useState(true); // Start with loading=true
        const [error, setError] = useState(null);

        const normalize = (item) => ({
            ...item,
            id: item.id || item._id,  // critical for all resources
        });

        const load = useCallback(async () => {
            if (!selectedCompany) {
                console.log('[useResourceFactory] No company selected, clearing rows');
                setRows([]);
                setLoading(false);
                return;
            }
            console.log('[useResourceFactory] Loading data for company:', selectedCompany);
            setLoading(true);
            setError(null);

            try {
                const data = await api.list(selectedCompany);
                console.log('[useResourceFactory] Loaded data:', data?.length, 'items');
                const normalized = Array.isArray(data)
                    ? data.map(normalize)
                    : [];
                setRows(normalized);
            } catch (err) {
                console.error(`[useResourceFactory] Failed loading resource`, err);
                setError(err);
                setRows([]);
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

        return { rows, loading, error, reload: load, create, update, remove };
    };
}
