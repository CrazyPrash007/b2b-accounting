// src/App.jsx
import React, { createContext, useState, useEffect } from "react";
import { setCurrentCompany } from "./services/companyContextAccessor";
import apiClient from "./services/apiClient";
import AppRoutes from "./AppRoutes";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ModalProvider } from "./contexts/ModalContext";

// --------------------------------------------------
// Create Global Company Context
// --------------------------------------------------
export const CompanyContext = createContext({
    selectedCompany: "",
    setSelectedCompany: () => { },
    companyLoading: true
});

// Loading component
function LoadingScreen() {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#f5f5f5'
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: 40,
                    height: 40,
                    border: '4px solid #e0e0e0',
                    borderTopColor: '#667eea',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px'
                }} />
                <p style={{ color: '#666', fontSize: 14 }}>Loading...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );
}

// Main app content that requires auth
function AppContent() {
    const { loading, isAuthenticated, user, token } = useAuth();
    const [selectedCompany, setSelectedCompany] = useState("");
    const [companyLoading, setCompanyLoading] = useState(true);

    // Track the current user ID to detect user changes
    const currentUserId = user?.id;

    // --------------------------------------------
    // 1️⃣ Load saved company from localStorage or fetch from API
    // --------------------------------------------
    useEffect(() => {
        if (!isAuthenticated || !currentUserId) {
            setCompanyLoading(false);
            return;
        }

        async function initializeCompany() {
            setCompanyLoading(true);

            try {
                // Check if the saved company belongs to current user
                const saved = localStorage.getItem("selectedCompany");
                const savedForUser = localStorage.getItem("selectedCompanyUserId");

                // Only use saved company if it's for the same user
                if (saved && savedForUser === currentUserId) {
                    console.log('[APP] Using saved company for current user:', saved);
                    setSelectedCompany(saved);
                    setCurrentCompany(saved);
                    setCompanyLoading(false);
                    return;
                }

                // Different user or no saved company → fetch companies from backend
                if (savedForUser && savedForUser !== currentUserId) {
                    console.log('[APP] Different user detected, clearing old company selection');
                    localStorage.removeItem("selectedCompany");
                }

                // Fetch companies from backend for this user
                console.log('[APP] Fetching companies from API for user:', currentUserId);
                const res = await apiClient.get("/api/companies");

                if (res.data?.success && res.data.data?.length > 0) {
                    const firstCompany = res.data.data[0]._id;
                    console.log('[APP] Auto-selecting first company:', firstCompany);

                    setSelectedCompany(firstCompany);
                    localStorage.setItem("selectedCompany", firstCompany);
                    localStorage.setItem("selectedCompanyUserId", currentUserId);
                    setCurrentCompany(firstCompany);
                } else {
                    console.log('[APP] No companies found for user');
                    setSelectedCompany("");
                }
            } catch (err) {
                console.error("[APP] Failed to load companies:", err);
            } finally {
                setCompanyLoading(false);
            }
        }

        initializeCompany();
    }, [isAuthenticated, currentUserId]);

    // --------------------------------------------
    // 2️⃣ Update localStorage & global accessor when company changes
    // --------------------------------------------
    useEffect(() => {
        if (selectedCompany && currentUserId) {
            localStorage.setItem("selectedCompany", selectedCompany);
            localStorage.setItem("selectedCompanyUserId", currentUserId);
            setCurrentCompany(selectedCompany);
        }
    }, [selectedCompany, currentUserId]);

    // Show loading while checking auth
    if (loading) {
        return <LoadingScreen />;
    }

    // If not authenticated, the AuthContext will handle redirect
    if (!isAuthenticated) {
        return <LoadingScreen />;
    }

    // Show loading while fetching company
    if (companyLoading) {
        return <LoadingScreen />;
    }

    return (
        <CompanyContext.Provider value={{ selectedCompany, setSelectedCompany, companyLoading }}>
            <ModalProvider>
                <AppRoutes />
            </ModalProvider>
        </CompanyContext.Provider>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
