// src/features/staff/useStaff.js
import { useState, useCallback, useRef, useEffect } from 'react';
import { staffApi } from './staff.api';

export function useStaff() {
    const [staff, setStaff] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [activeStaffList, setActiveStaffList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);

    // Cancel any pending requests on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Fetch all staff with request cancellation support
    const fetchStaff = useCallback(async (params = {}) => {
        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);
        try {
            const response = await staffApi.getAll(params, abortControllerRef.current.signal);
            if (response.success) {
                setStaff(response.data);
                // Set pagination if available
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            } else {
                setError(response.message || 'Failed to fetch staff');
            }
        } catch (err) {
            // Don't set error for cancelled requests
            if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                setError(err.message || 'Error fetching staff');
                console.error('Error fetching staff:', err);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch active staff list for dropdowns
    const fetchActiveStaffList = useCallback(async (params = {}) => {
        try {
            const response = await staffApi.getActiveList(params);
            if (response.success) {
                setActiveStaffList(response.data);
            }
        } catch (err) {
            console.error('Error fetching active staff list:', err);
        }
    }, []);

    // Create new staff
    const createStaff = useCallback(async (data) => {
        setLoading(true);
        try {
            const response = await staffApi.create(data);
            if (response.success) {
                return response;
            }
            throw new Error(response.message || 'Failed to create staff');
        } catch (err) {
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Update staff
    const updateStaff = useCallback(async (id, data) => {
        setLoading(true);
        try {
            const response = await staffApi.update(id, data);
            if (response.success) {
                return response;
            }
            throw new Error(response.message || 'Failed to update staff');
        } catch (err) {
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Toggle staff status
    const toggleStaffStatus = useCallback(async (id, statusData) => {
        try {
            const response = await staffApi.toggleStatus(id, statusData);
            if (response.success) {
                return response;
            }
            throw new Error(response.message || 'Failed to update status');
        } catch (err) {
            throw err;
        }
    }, []);

    // Delete staff
    const deleteStaff = useCallback(async (id) => {
        try {
            const response = await staffApi.delete(id);
            if (response.success) {
                return response;
            }
            throw new Error(response.message || 'Failed to delete staff');
        } catch (err) {
            throw err;
        }
    }, []);

    // Get salary history
    const getSalaryHistory = useCallback(async (id) => {
        try {
            const response = await staffApi.getSalaryHistory(id);
            if (response.success) {
                return response.data;
            }
            throw new Error(response.message || 'Failed to fetch salary history');
        } catch (err) {
            throw err;
        }
    }, []);

    // Add salary increase
    const addSalaryIncrease = useCallback(async (id, data) => {
        try {
            const response = await staffApi.addSalaryIncrease(id, data);
            if (response.success) {
                return response;
            }
            throw new Error(response.message || 'Failed to add salary increase');
        } catch (err) {
            throw err;
        }
    }, []);

    return {
        staff,
        pagination,
        activeStaffList,
        loading,
        error,
        fetchStaff,
        fetchActiveStaffList,
        createStaff,
        updateStaff,
        toggleStaffStatus,
        deleteStaff,
        getSalaryHistory,
        addSalaryIncrease
    };
}
