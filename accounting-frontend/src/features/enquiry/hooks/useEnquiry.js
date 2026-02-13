// src/features/enquiry/hooks/useEnquiry.js
import { useState, useEffect, useContext, useCallback } from "react";
import { CompanyContext } from "src/App";
import enquiryApi from "src/features/enquiry/api/enquiry.api";

export default function useEnquiry() {
    const context = useContext(CompanyContext);
    const selectedCompany = context?.selectedCompany || "";

    const [myEnquiries, setMyEnquiries] = useState([]);
    const [publicEnquiries, setPublicEnquiries] = useState([]);
    const [vendorEnquiries, setVendorEnquiries] = useState([]);
    const [myResponses, setMyResponses] = useState([]);
    const [websiteEnquiries, setWebsiteEnquiries] = useState([]);
    const [registeredVendors, setRegisteredVendors] = useState([]);
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

    // Load vendor-targeted enquiries
    const loadVendorEnquiries = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);

        try {
            const data = await enquiryApi.listVendorEnquiries(params);
            const normalized = Array.isArray(data) ? data.map(normalize) : [];
            setVendorEnquiries(normalized);
        } catch (err) {
            console.error('[useEnquiry] Failed loading vendor enquiries', err);
            setError(err);
            setVendorEnquiries([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load user's responses to enquiries
    const loadMyResponses = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);

        try {
            const data = await enquiryApi.listMyResponses(params);
            const normalized = Array.isArray(data) ? data.map(normalize) : [];
            setMyResponses(normalized);
        } catch (err) {
            console.error('[useEnquiry] Failed loading my responses', err);
            setError(err);
            setMyResponses([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load website enquiries (from marketing website)
    const loadWebsiteEnquiries = useCallback(async (params = {}) => {
        if (!selectedCompany) {
            setWebsiteEnquiries([]);
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const data = await enquiryApi.listWebsite(selectedCompany, params);
            const normalized = Array.isArray(data) ? data.map(normalize) : [];
            setWebsiteEnquiries(normalized);
        } catch (err) {
            console.error('[useEnquiry] Failed loading website enquiries', err);
            setError(err);
            setWebsiteEnquiries([]);
        } finally {
            setLoading(false);
        }
    }, [selectedCompany]);

    // Load registered vendors (for vendor selection)
    const loadRegisteredVendors = useCallback(async (search = '') => {
        if (!selectedCompany) {
            setRegisteredVendors([]);
            return [];
        }

        try {
            const data = await enquiryApi.getRegisteredVendors(selectedCompany, search);
            const normalized = Array.isArray(data) ? data.map(normalize) : [];
            setRegisteredVendors(normalized);
            return normalized;
        } catch (err) {
            console.error('[useEnquiry] Failed loading registered vendors', err);
            setRegisteredVendors([]);
            return [];
        }
    }, [selectedCompany]);

    // Get responses for a specific enquiry with filtering/sorting
    const getEnquiryResponses = useCallback(async (enquiryId, params = {}) => {
        try {
            const data = await enquiryApi.getEnquiryResponses(enquiryId, params);
            return data;
        } catch (err) {
            console.error('[useEnquiry] Failed loading enquiry responses', err);
            throw err;
        }
    }, []);

    // Load all data on mount
    useEffect(() => {
        loadMyEnquiries();
        loadPublicEnquiries();
        loadVendorEnquiries();
        loadMyResponses();
        loadWebsiteEnquiries();
    }, [loadMyEnquiries, loadPublicEnquiries, loadVendorEnquiries, loadMyResponses, loadWebsiteEnquiries]);

    // Create enquiry
    const create = useCallback(async (payload) => {
        if (!selectedCompany) throw new Error("No company selected");
        await enquiryApi.create(payload, selectedCompany);
        return loadMyEnquiries();
    }, [selectedCompany, loadMyEnquiries]);

    // Remove enquiry
    const remove = useCallback(async (id) => {
        if (!selectedCompany) throw new Error("No company selected");
        await enquiryApi.remove(id, selectedCompany);
        return loadMyEnquiries();
    }, [selectedCompany, loadMyEnquiries]);

    // Permanently delete website enquiry
    const removeWebsiteEnquiry = useCallback(async (id) => {
        if (!selectedCompany) throw new Error("No company selected");
        await enquiryApi.removeWebsiteEnquiry(id, selectedCompany);
        return loadWebsiteEnquiries();
    }, [selectedCompany, loadWebsiteEnquiries]);

    // Respond to enquiry
    const respond = useCallback(async (id, payload) => {
        await enquiryApi.respond(id, payload);
        // Reload public, vendor enquiries and my responses
        await Promise.all([
            loadPublicEnquiries(),
            loadVendorEnquiries(),
            loadMyResponses()
        ]);
    }, [loadPublicEnquiries, loadVendorEnquiries, loadMyResponses]);

    // Close enquiry
    const close = useCallback(async (id, closureReason = '') => {
        if (!selectedCompany) throw new Error("No company selected");
        await enquiryApi.close(id, selectedCompany, closureReason);
        return loadMyEnquiries();
    }, [selectedCompany, loadMyEnquiries]);

    // Mark response as viewed
    const markResponseViewed = useCallback(async (enquiryId, responseId) => {
        await enquiryApi.markResponseViewed(enquiryId, responseId);
        return loadMyEnquiries();
    }, [loadMyEnquiries]);

    // Select/Accept a response
    const selectResponse = useCallback(async (enquiryId, responseId, selectionNote = '') => {
        if (!selectedCompany) throw new Error("No company selected");
        await enquiryApi.selectResponse(enquiryId, responseId, selectedCompany, selectionNote);
        return loadMyEnquiries();
    }, [selectedCompany, loadMyEnquiries]);

    // Reload all lists
    const reload = useCallback(() => {
        loadMyEnquiries();
        loadPublicEnquiries();
        loadVendorEnquiries();
        loadMyResponses();
        loadWebsiteEnquiries();
    }, [loadMyEnquiries, loadPublicEnquiries, loadVendorEnquiries, loadMyResponses, loadWebsiteEnquiries]);

    return {
        myEnquiries,
        publicEnquiries,
        vendorEnquiries,
        myResponses,
        websiteEnquiries,
        registeredVendors,
        loading,
        error,
        reload,
        loadMyEnquiries,
        loadPublicEnquiries,
        loadVendorEnquiries,
        loadMyResponses,
        loadWebsiteEnquiries,
        loadRegisteredVendors,
        getEnquiryResponses,
        create,
        remove,
        removeWebsiteEnquiry,
        respond,
        close,
        markResponseViewed,
        selectResponse
    };
}
