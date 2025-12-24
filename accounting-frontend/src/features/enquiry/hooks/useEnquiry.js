// src/features/enquiry/hooks/useEnquiry.js
import { useState, useEffect, useContext, useCallback } from "react";
import { CompanyContext } from "src/App";
import enquiryApi from "src/features/enquiry/api/enquiry.api";

export default function useEnquiry() {
    const context = useContext(CompanyContext);
    const selectedCompany = context?.selectedCompany || "";

    const [myEnquiries, setMyEnquiries] = useState([]);
    const [publicEnquiries, setPublicEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const normalize = (item) => ({
        ...item,
        id: item.id || item._id,
    });

    // Load user's own enquiries
    const loadMyEnquiries = useCallback(async (params = {}) => {
        if (!selectedCompany) {
            setMyEnquiries([]);
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const data = await enquiryApi.listMy(selectedCompany, params);
            const normalized = Array.isArray(data) ? data.map(normalize) : [];
            setMyEnquiries(normalized);
        } catch (err) {
            console.error('[useEnquiry] Failed loading my enquiries', err);
            setError(err);
            setMyEnquiries([]);
        } finally {
            setLoading(false);
        }
    }, [selectedCompany]);

    // Load public enquiries
    const loadPublicEnquiries = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);

        try {
            const data = await enquiryApi.listPublic(params);
            const normalized = Array.isArray(data) ? data.map(normalize) : [];
            setPublicEnquiries(normalized);
        } catch (err) {
            console.error('[useEnquiry] Failed loading public enquiries', err);
            setError(err);
            setPublicEnquiries([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load both on mount
    useEffect(() => {
        loadMyEnquiries();
        loadPublicEnquiries();
    }, [loadMyEnquiries, loadPublicEnquiries]);

    // Create enquiry
    const create = useCallback(async (payload) => {
        if (!selectedCompany) throw new Error("No company selected");
        await enquiryApi.create(payload, selectedCompany);
        return loadMyEnquiries();
    }, [selectedCompany, loadMyEnquiries]);

    // Update enquiry
    const update = useCallback(async (id, payload) => {
        if (!selectedCompany) throw new Error("No company selected");
        await enquiryApi.update(id, payload, selectedCompany);
        return loadMyEnquiries();
    }, [selectedCompany, loadMyEnquiries]);

    // Remove enquiry
    const remove = useCallback(async (id) => {
        if (!selectedCompany) throw new Error("No company selected");
        await enquiryApi.remove(id, selectedCompany);
        return loadMyEnquiries();
    }, [selectedCompany, loadMyEnquiries]);

    // Respond to enquiry
    const respond = useCallback(async (id, payload) => {
        await enquiryApi.respond(id, payload);
        return loadPublicEnquiries();
    }, [loadPublicEnquiries]);

    // Close enquiry
    const close = useCallback(async (id) => {
        if (!selectedCompany) throw new Error("No company selected");
        await enquiryApi.close(id, selectedCompany);
        return loadMyEnquiries();
    }, [selectedCompany, loadMyEnquiries]);

    // Reload both lists
    const reload = useCallback(() => {
        loadMyEnquiries();
        loadPublicEnquiries();
    }, [loadMyEnquiries, loadPublicEnquiries]);

    return {
        myEnquiries,
        publicEnquiries,
        loading,
        error,
        reload,
        loadMyEnquiries,
        loadPublicEnquiries,
        create,
        update,
        remove,
        respond,
        close
    };
}
