// src/features/dashboard/hooks/useDashboard.js
import { useState, useEffect, useCallback } from 'react';
import dashboardApi from '../api/dashboard.api';

export default function useDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('current-month');
    const [customDateRange, setCustomDateRange] = useState({ start: null, end: null });

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('Fetching dashboard stats with period:', period);
            
            const data = await dashboardApi.getStats(
                period,
                customDateRange.start,
                customDateRange.end
            );
            
            console.log('Dashboard stats received:', data);
            setStats(data);
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [period, customDateRange]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const refresh = () => {
        fetchStats();
    };

    const changePeriod = (newPeriod) => {
        setPeriod(newPeriod);
    };

    const setCustomRange = (start, end) => {
        setCustomDateRange({ start, end });
        setPeriod('custom');
    };

    return {
        stats,
        loading,
        error,
        period,
        refresh,
        changePeriod,
        setCustomRange
    };
}
