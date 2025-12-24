// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

const AuthContext = createContext(null);

// Main app URL for redirects
const MAIN_APP_URL = import.meta.env.VITE_MAIN_APP_URL;

// Extract token from URL hash (e.g., #token=proto-token:123...)
function getTokenFromHash() {
    const hash = window.location.hash;
    if (hash && hash.includes('token=')) {
        const tokenMatch = hash.match(/token=([^&]+)/);
        if (tokenMatch) {
            return decodeURIComponent(tokenMatch[1]);
        }
    }
    return null;
}

export function AuthProvider({ children }) {
    const [auth, setAuth] = useState(() => {
        // Initialize from localStorage
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('accountingUser') || 'null');
            return { token, user, loading: true, error: null };
        } catch {
            return { token: null, user: null, loading: true, error: null };
        }
    });

    // Validate auth on mount
    useEffect(() => {
        async function validateAuth() {
            // First, check if token is passed via URL hash (from main app redirect)
            const hashToken = getTokenFromHash();
            if (hashToken) {
                // Store the token from URL and clear the hash
                localStorage.setItem('token', hashToken);
                // Clear the hash from URL without reload
                window.history.replaceState(null, '', window.location.pathname);
            }

            const token = hashToken || localStorage.getItem('token');

            if (!token) {
                // No token - redirect to main app login
                setAuth({ token: null, user: null, loading: false, error: 'No token' });
                redirectToLogin();
                return;
            }

            try {
                // Validate token and get user info
                const response = await apiClient.get('/api/auth/me');

                if (response.data?.success && response.data?.data) {
                    const user = response.data.data;
                    localStorage.setItem('accountingUser', JSON.stringify(user));
                    setAuth({ token, user, loading: false, error: null });
                } else {
                    throw new Error('Invalid response from auth endpoint');
                }
            } catch (err) {
                console.error('Auth validation failed:', err);
                // Check if it's a network error vs auth error
                const isNetworkError = err.message?.includes('No response') ||
                    err.message?.includes('Network') ||
                    err.message?.includes('ECONNREFUSED');

                if (isNetworkError) {
                    // Backend might be down - try to use cached user if available
                    const cachedUser = JSON.parse(localStorage.getItem('accountingUser') || 'null');
                    if (cachedUser) {
                        console.warn('Using cached user due to network error');
                        setAuth({ token, user: cachedUser, loading: false, error: null });
                        return;
                    }
                }

                // Only clear token for actual auth failures (401)
                if (err.message?.includes('401')) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('accountingUser');
                }
                setAuth({ token: null, user: null, loading: false, error: err.message });
                redirectToLogin();
            }
        }

        validateAuth();
    }, []);

    // Sync token to localStorage
    useEffect(() => {
        if (auth.token) {
            localStorage.setItem('token', auth.token);
        }
    }, [auth.token]);

    const redirectToLogin = () => {
        // Redirect to main app login page
        window.location.href = `${MAIN_APP_URL}?redirect=accounting`;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('accountingUser');
        localStorage.removeItem('selectedCompany');
        setAuth({ token: null, user: null, loading: false, error: null });
        redirectToLogin();
    };

    const value = {
        auth,
        user: auth.user,
        token: auth.token,
        loading: auth.loading,
        isAuthenticated: !!auth.token && !!auth.user,
        logout,
        redirectToLogin
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook for using auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
