// src/hooks/useResourceFactory.js
import { useState, useEffect, useContext } from "react";
import { CompanyContext } from "src/App";

export default function createResourceHook(api) {
    return function useResource() {
        const { selectedCompany } = useContext(CompanyContext);

        const [rows, setRows] = useState([]);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState(null);

        const normalize = (item) => ({
            ...item,
            id: item.id || item._id,  // critical for all resources
        });

        const load = async () => {
            if (!selectedCompany) return;
            setLoading(true);
            setError(null);

            try {
                const data = await api.list(selectedCompany);
                const normalized = Array.isArray(data)
                    ? data.map(normalize)
                    : [];
                setRows(normalized);
            } catch (err) {
                console.error(`Failed loading resource`, err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        useEffect(() => {
            load();
        }, [selectedCompany]);

        const create = async (payload) => {
            await api.create(payload, selectedCompany);
            return load();
        };

        const update = async (id, payload) => {
            await api.update(id, payload, selectedCompany);
            return load();
        };

        const remove = async (id) => {
            await api.remove(id, selectedCompany);
            return load();
        };

        return { rows, loading, error, reload: load, create, update, remove };
    };
}
