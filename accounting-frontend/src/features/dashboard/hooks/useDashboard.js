// src/features/dashboard/hooks/useDashboard.js
import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import dashboardApi from '../api/dashboard.api';
import { CompanyContext } from 'src/App';

// Section names that support individual period filtering
const SECTION_NAMES = {
    BUSINESS_OPERATIONS: 'businessOperations',
    REVENUE_PROJECTIONS: 'revenueProjections',
    TOTAL_INCOME: 'totalIncome',
    REVENUE_INFLOW: 'revenueInflow',
    REVENUE_MANAGEMENT: 'revenueManagement',
    SALE_ANALYTICS: 'saleAnalytics'
};

// Cache duration in milliseconds (10 minutes)
const CACHE_DURATION = 10 * 60 * 1000;

// Cache storage
const dashboardCache = {
    data: null,
    timestamp: null,
    companyId: null
};

export default function useDashboard() {
    const { selectedCompany } = useContext(CompanyContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Section-level periods - each section has its own filter state
    const [sectionPeriods, setSectionPeriods] = useState({
        businessOperations: 'current-month',
        revenueProjections: 'current-month',
        totalIncome: 'current-month',
        revenueInflow: 'current-month',
        revenueManagement: 'current-month',
        saleAnalytics: 'current-month'
    });
    
    // Track loading state per section for individual updates
    const [sectionLoading, setSectionLoading] = useState({});
    
    // AbortController refs for cancelling ongoing requests
    const abortControllerRef = useRef(null);

    // Check if cache is valid
    const isCacheValid = useCallback((companyId) => {
        if (!dashboardCache.data || !dashboardCache.timestamp) return false;
        if (dashboardCache.companyId !== companyId) return false;
        
        const age = Date.now() - dashboardCache.timestamp;
        return age < CACHE_DURATION;
    }, []);

    // Initial load - fetch all stats with default period
    const fetchAllStats = useCallback(async (forceRefresh = false) => {
        if (!selectedCompany) {
            console.log('Waiting for company selection...');
            setLoading(true);
            return;
        }

        // Use cache if valid and not forcing refresh
        if (!forceRefresh && isCacheValid(selectedCompany)) {
            console.log('Using cached dashboard data');
            setStats(dashboardCache.data);
            setLoading(false);
            setError(null);
            return;
        }

        // Cancel any ongoing requests
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
            // Only show loading if we don't have cached data
            if (!dashboardCache.data || dashboardCache.companyId !== selectedCompany) {
                setLoading(true);
            }
            setError(null);

            console.log('Fetching fresh dashboard stats, company:', selectedCompany);

            const data = await dashboardApi.getStats('current-month');
            
            console.log('Dashboard stats received:', data);
            
            // Update cache
            dashboardCache.data = data;
            dashboardCache.timestamp = Date.now();
            dashboardCache.companyId = selectedCompany;
            
            setStats(data);
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error('Error fetching dashboard stats:', err);
            setError(err.message || 'Failed to load dashboard data');
            
            // If we have cached data, use it even if refresh failed
            if (dashboardCache.data && dashboardCache.companyId === selectedCompany) {
                console.log('Using stale cache due to fetch error');
                setStats(dashboardCache.data);
            }
        } finally {
            setLoading(false);
        }
    }, [selectedCompany, isCacheValid]);

    // Fetch stats for a specific section only (no full page reload)
    const fetchSectionStats = useCallback(async (sectionName, period) => {
        if (!selectedCompany) return;

        try {
            // Mark section as loading
            setSectionLoading(prev => ({ ...prev, [sectionName]: true }));

            const response = await dashboardApi.getSectionStats(sectionName, period);
            
            // Update only the specific section data without affecting others
            setStats(prev => {
                if (!prev) return prev;
                
                const updated = { ...prev };
                
                // Map section names to their data keys in stats
                switch (sectionName) {
                    case SECTION_NAMES.BUSINESS_OPERATIONS:
                        updated.businessOperations = response.data;
                        break;
                    case SECTION_NAMES.REVENUE_PROJECTIONS:
                        updated.revenueProjections = response.data;
                        break;
                    case SECTION_NAMES.TOTAL_INCOME:
                        updated.totalIncome = response.data;
                        break;
                    case SECTION_NAMES.REVENUE_INFLOW:
                        updated.revenueInflow = response.data;
                        break;
                    case SECTION_NAMES.REVENUE_MANAGEMENT:
                        updated.revenueManagement = response.data;
                        break;
                    case SECTION_NAMES.SALE_ANALYTICS:
                        updated.topSalesItems = response.data;
                        break;
                }
                
                return updated;
            });
        } catch (err) {
            console.error(`Error fetching ${sectionName} stats:`, err);
            // Don't set global error for section updates
        } finally {
            setSectionLoading(prev => ({ ...prev, [sectionName]: false }));
        }
    }, [selectedCompany]);

    // Change period for a specific section (section-level filtering)
    const changeSectionPeriod = useCallback((sectionName, newPeriod) => {
        // Update the section's period state
        setSectionPeriods(prev => ({
            ...prev,
            [sectionName]: newPeriod
        }));
        
        // Fetch only that section's data with the new period
        fetchSectionStats(sectionName, newPeriod);
    }, [fetchSectionStats]);

    // Initial load
    useEffect(() => {
        fetchAllStats();
        
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [fetchAllStats]);

    const refresh = () => {
        fetchAllStats(true); // Force refresh, bypass cache
    };

    return {
        stats,
        loading,
        error,
        sectionPeriods,
        sectionLoading,
        refresh,
        changeSectionPeriod,
        SECTION_NAMES
    };
}
