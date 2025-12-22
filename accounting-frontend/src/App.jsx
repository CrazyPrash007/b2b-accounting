// src/App.jsx
import React, { createContext, useState, useEffect } from "react";
import { setCurrentCompany } from "./services/companyContextAccessor";
import apiClient from "./services/apiClient";
import AppRoutes from "./AppRoutes";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// --------------------------------------------------
// Create Global Company Context
// --------------------------------------------------
export const CompanyContext = createContext({
    selectedCompany: "",
    setSelectedCompany: () => { }
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
    const { loading, isAuthenticated, redirectToLogin } = useAuth();
    const [selectedCompany, setSelectedCompany] = useState("");

    // --------------------------------------------
    // 1️⃣ Load saved company from localStorage
    // --------------------------------------------
    useEffect(() => {
        if (!isAuthenticated) return;

        const saved = localStorage.getItem("selectedCompany");

        if (saved) {
            setSelectedCompany(saved);
            setCurrentCompany(saved); // Also set the global accessor
            return;
        }

        // --------------------------------------------------
        // 2️⃣ If no saved company → fetch companies from backend
        // --------------------------------------------------
        async function loadDefaultCompany() {
            try {
                const res = await apiClient.get("/api/companies");

                if (res.data?.success && res.data.data?.length > 0) {
                    const firstCompany = res.data.data[0]._id;

                    setSelectedCompany(firstCompany);
                    localStorage.setItem("selectedCompany", firstCompany);
                    setCurrentCompany(firstCompany);
                }
            } catch (err) {
                console.error("Failed to load companies:", err);
            }
        }

        loadDefaultCompany();
    }, [isAuthenticated]);

    // --------------------------------------------
    // 3️⃣ Update localStorage & global accessor
    // --------------------------------------------
    useEffect(() => {
        if (selectedCompany) {
            localStorage.setItem("selectedCompany", selectedCompany);
            setCurrentCompany(selectedCompany);
        }
    }, [selectedCompany]);

    // Show loading while checking auth
    if (loading) {
        return <LoadingScreen />;
    }

    // If not authenticated, the AuthContext will handle redirect
    if (!isAuthenticated) {
        return <LoadingScreen />;
    }

    return (
        <CompanyContext.Provider value={{ selectedCompany, setSelectedCompany }}>
            <AppRoutes />
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
