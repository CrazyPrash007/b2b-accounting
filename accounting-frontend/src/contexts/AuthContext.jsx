// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

const AuthContext = createContext(null);

// Main app URL for redirects
const MAIN_APP_URL = import.meta.env.VITE_MAIN_APP_URL;

// Extract token from URL hash (e.g., #token=proto-token:123...)
function getTokenFromHash() {
    try {
        const hash = window.location.hash;
        if (!hash || !hash.includes('token=')) {
            return null;
        }
        
        // Match token parameter from hash
        const tokenMatch = hash.match(/[#&]token=([^&]+)/);
        if (tokenMatch && tokenMatch[1]) {
            const token = decodeURIComponent(tokenMatch[1]);
            // Validate token format (proto-token:ObjectId)
            if (token.match(/^proto-token:[0-9a-fA-F]{24}$/)) {
                return token;
            }
            console.warn('[AUTH] Invalid token format in URL hash:', token);
        }
    } catch (err) {
        console.error('[AUTH] Error parsing token from hash:', err);
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
    
    // Track if we've already attempted auth validation to prevent loops
    const authAttemptedRef = React.useRef(false);

    // Validate auth on mount
    useEffect(() => {
        // Prevent multiple validation attempts
        if (authAttemptedRef.current) {
            return;
        }
        authAttemptedRef.current = true;
        
        async function validateAuth() {
<<<<<<< HEAD
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

=======
>>>>>>> upstream/trial
            try {
                // First, check if token is passed via URL hash (from main app redirect)
                const hashToken = getTokenFromHash();
                let tokenToUse = hashToken;
                
                if (hashToken) {
                    console.log('[AUTH] Token received from URL hash');
                    // Store the token from URL
                    localStorage.setItem('token', hashToken);
                    // Clear the hash from URL without reload (do this immediately)
                    window.history.replaceState(null, '', window.location.pathname + window.location.search);
                } else {
                    // Try to get token from localStorage
                    tokenToUse = localStorage.getItem('token');
                }
                
                if (!tokenToUse) {
                    console.warn('[AUTH] No token found - redirecting to login');
                    setAuth({ token: null, user: null, loading: false, error: 'No token' });
                    // Add a small delay before redirect to prevent race conditions
                    setTimeout(redirectToLogin, 500);
                    return;
                }

                console.log('[AUTH] Validating token...');
                
                // Validate token and get user info
                const response = await apiClient.get('/api/auth/me');

                if (response.data?.success && response.data?.data) {
                    const user = response.data.data;
                    console.log('[AUTH] Validation successful, user:', user.name);
                    localStorage.setItem('accountingUser', JSON.stringify(user));
                    setAuth({ token: tokenToUse, user, loading: false, error: null });
                } else {
                    throw new Error('Invalid response from auth endpoint');
                }
            } catch (err) {
                console.error('[AUTH] Validation failed:', err.message);
                
                // Check if it's a network error vs auth error
<<<<<<< HEAD
                const isNetworkError = err.message?.includes('No response') ||
                    err.message?.includes('Network') ||
                    err.message?.includes('ECONNREFUSED');

=======
                const isNetworkError = err.message?.includes('No response') || 
                                       err.message?.includes('Network') ||
                                       err.message?.includes('ECONNREFUSED') ||
                                       err.code === 'ECONNREFUSED' ||
                                       err.code === 'ERR_NETWORK';
                
>>>>>>> upstream/trial
                if (isNetworkError) {
                    console.warn('[AUTH] Network error - attempting to use cached data');
                    // Backend might be down - try to use cached user if available
                    const cachedUser = JSON.parse(localStorage.getItem('accountingUser') || 'null');
                    const cachedToken = localStorage.getItem('token');
                    
                    if (cachedUser && cachedToken) {
                        console.log('[AUTH] Using cached user:', cachedUser.name);
                        setAuth({ token: cachedToken, user: cachedUser, loading: false, error: null });
                        return;
                    }
                }
<<<<<<< HEAD

                // Only clear token for actual auth failures (401)
=======
                
                // Only clear and redirect for actual auth failures (401)
>>>>>>> upstream/trial
                if (err.message?.includes('401')) {
                    console.warn('[AUTH] 401 Unauthorized - clearing credentials');
                    localStorage.removeItem('token');
                    localStorage.removeItem('accountingUser');
                    setAuth({ token: null, user: null, loading: false, error: err.message });
                    setTimeout(redirectToLogin, 500);
                    return;
                }
                
                // For other errors, don't redirect immediately - user might refresh
                console.warn('[AUTH] Non-401 error - keeping current state');
                const cachedUser = JSON.parse(localStorage.getItem('accountingUser') || 'null');
                const cachedToken = localStorage.getItem('token');
                
                if (cachedUser && cachedToken) {
                    setAuth({ token: cachedToken, user: cachedUser, loading: false, error: null });
                } else {
                    setAuth({ token: null, user: null, loading: false, error: err.message });
                    setTimeout(redirectToLogin, 1000);
                }
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
        console.log('[AUTH] Redirecting to main app login');
        // Clear any existing timers to prevent multiple redirects
        const currentPath = window.location.pathname;
        const redirectParam = currentPath !== '/' ? `&redirect_to=${encodeURIComponent(currentPath)}` : '';
        // Redirect to main app login page with accounting redirect marker
        window.location.href = `${MAIN_APP_URL}?redirect=accounting${redirectParam}`;
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
