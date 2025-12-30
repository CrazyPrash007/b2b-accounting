// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../services/apiClient';

const AuthContext = createContext(null);

// Main app URL for redirects
const MAIN_APP_URL =
    import.meta.env.VITE_MAIN_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');

// Constants for retry logic
const MAX_AUTH_RETRIES = 3;
const AUTH_RETRY_DELAY = 1000; // ms

/**
 * Extract token from URL - supports both hash and query params
 * Hash is preferred for security (not sent to server in logs)
 */
function getTokenFromUrl() {
    try {
        // First try hash (preferred method)
        const hash = window.location.hash;
        if (hash && hash.includes('token=')) {
            const tokenMatch = hash.match(/[#&]token=([^&]+)/);
            if (tokenMatch && tokenMatch[1]) {
                const token = decodeURIComponent(tokenMatch[1]);
                if (isValidTokenFormat(token)) {
                    console.log('[AUTH] Token extracted from URL hash');
                    return token;
                }
                console.warn('[AUTH] Invalid token format in URL hash');
            }
        }

        // Fallback to query params (for compatibility)
        const urlParams = new URLSearchParams(window.location.search);
        const queryToken = urlParams.get('token');
        if (queryToken) {
            const token = decodeURIComponent(queryToken);
            if (isValidTokenFormat(token)) {
                console.log('[AUTH] Token extracted from URL query');
                return token;
            }
            console.warn('[AUTH] Invalid token format in URL query');
        }
    } catch (err) {
        console.error('[AUTH] Error parsing token from URL:', err);
    }
    return null;
}

/**
 * Validate token format: "proto-token:<24-char-hex>"
 */
function isValidTokenFormat(token) {
    return token && /^proto-token:[0-9a-fA-F]{24}$/.test(token);
}

/**
 * Clear token from URL without reload
 */
function clearTokenFromUrl() {
    try {
        const url = new URL(window.location.href);
        url.hash = '';
        url.searchParams.delete('token');
        window.history.replaceState(null, '', url.pathname + url.search);
    } catch (err) {
        console.warn('[AUTH] Could not clear token from URL:', err);
    }
}

/**
 * Helper to safely store token in localStorage with verification
 */
async function safeSetToken(token) {
    return new Promise((resolve) => {
        try {
            localStorage.setItem('token', token);
            // Verify it was stored correctly
            setTimeout(() => {
                const stored = localStorage.getItem('token');
                resolve(stored === token);
            }, 50);
        } catch (err) {
            console.error('[AUTH] Failed to store token:', err);
            resolve(false);
        }
    });
}

/**
 * Sleep helper for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Redirect to main app login
 */
function redirectToLogin() {
    const currentPath = window.location.pathname;
    const redirectParam = currentPath !== '/' ? `&redirect_to=${encodeURIComponent(currentPath)}` : '';
    const redirectUrl = `${MAIN_APP_URL}?redirect=accounting${redirectParam}`;

    console.log('[AUTH] Redirecting to:', redirectUrl);
    window.location.href = redirectUrl;
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

    // Track initialization state
    const initRef = useRef({
        attempted: false,
        inProgress: false
    });

    /**
     * Validate auth token with retry logic
     */
    const validateAuthWithRetry = useCallback(async (token, retryCount = 0) => {
        try {
            console.log(`[AUTH] Validating token (attempt ${retryCount + 1}/${MAX_AUTH_RETRIES})`);

            // Ensure token is set before making request
            localStorage.setItem('token', token);

            const response = await apiClient.get('/api/auth/me');

            if (response.data?.success && response.data?.data) {
                const user = response.data.data;
                console.log('[AUTH] Validation successful, user:', user.name);
                return { success: true, user };
            } else {
                throw new Error('Invalid response from auth endpoint');
            }
        } catch (err) {
            console.warn(`[AUTH] Validation attempt ${retryCount + 1} failed:`, err.message);

            // Check if we should retry
            const isNetworkError =
                err.message?.includes('No response') ||
                err.message?.includes('Network') ||
                err.message?.includes('ECONNREFUSED') ||
                err.message?.includes('timeout') ||
                err.code === 'ECONNREFUSED' ||
                err.code === 'ERR_NETWORK';

            // Retry on network errors, not on 401/403
            if (isNetworkError && retryCount < MAX_AUTH_RETRIES - 1) {
                console.log(`[AUTH] Network error, retrying in ${AUTH_RETRY_DELAY}ms...`);
                await sleep(AUTH_RETRY_DELAY * (retryCount + 1)); // Exponential backoff
                return validateAuthWithRetry(token, retryCount + 1);
            }

            return { success: false, error: err.message, isNetworkError };
        }
    }, []);

    /**
     * Main auth initialization
     */
    useEffect(() => {
        // Check if there's a new token in URL - this should ALWAYS be processed
        const urlToken = getTokenFromUrl();
        const storedToken = localStorage.getItem('token');

        // If URL has a token that's different from stored, always re-init (new user login)
        const isNewTokenFromUrl = urlToken && urlToken !== storedToken;

        // Prevent multiple simultaneous init attempts, BUT allow if new token from URL
        if (!isNewTokenFromUrl && (initRef.current.attempted || initRef.current.inProgress)) {
            return;
        }

        initRef.current.inProgress = true;
        initRef.current.attempted = true;

        async function initializeAuth() {
            try {
                // Step 1: Try to get token from URL (from main app redirect)
                let tokenToUse = urlToken;

                if (tokenToUse) {
                    // NEW USER LOGIN - Clear old user's data first!
                    if (tokenToUse !== storedToken) {
                        console.log('[AUTH] New token detected - clearing old user data');
                        localStorage.removeItem('accountingUser');
                        localStorage.removeItem('selectedCompany');
                    }

                    // Store token and clear from URL
                    const stored = await safeSetToken(tokenToUse);
                    if (!stored) {
                        console.error('[AUTH] Failed to store token from URL');
                    }
                    clearTokenFromUrl();
                } else {
                    // Try localStorage
                    tokenToUse = storedToken;
                }

                // Step 2: Check if we have a token at all
                if (!tokenToUse || !isValidTokenFormat(tokenToUse)) {
                    console.warn('[AUTH] No valid token found');
                    setAuth({ token: null, user: null, loading: false, error: 'No token' });

                    // Small delay to allow any pending operations to complete
                    await sleep(300);
                    redirectToLogin();
                    return;
                }

                // Step 3: Validate the token with retry logic
                const result = await validateAuthWithRetry(tokenToUse);

                if (result.success) {
                    // Success! Store user and update state
                    localStorage.setItem('accountingUser', JSON.stringify(result.user));
                    setAuth({
                        token: tokenToUse,
                        user: result.user,
                        loading: false,
                        error: null
                    });
                } else if (result.isNetworkError) {
                    // Network error - try to use cached data
                    const cachedUser = JSON.parse(localStorage.getItem('accountingUser') || 'null');

                    if (cachedUser) {
                        console.log('[AUTH] Using cached user due to network error:', cachedUser.name);
                        setAuth({
                            token: tokenToUse,
                            user: cachedUser,
                            loading: false,
                            error: null
                        });
                    } else {
                        // No cache, show error but don't redirect immediately
                        setAuth({
                            token: tokenToUse,
                            user: null,
                            loading: false,
                            error: 'Network error - please refresh'
                        });
                    }
                } else {
                    // Auth failure (401/403) - clear and redirect
                    console.warn('[AUTH] Authentication failed - clearing credentials');
                    localStorage.removeItem('token');
                    localStorage.removeItem('accountingUser');
                    setAuth({ token: null, user: null, loading: false, error: result.error });

                    await sleep(500);
                    redirectToLogin();
                }
            } catch (err) {
                console.error('[AUTH] Unexpected error during init:', err);
                setAuth({
                    token: null,
                    user: null,
                    loading: false,
                    error: 'Initialization error'
                });
            } finally {
                initRef.current.inProgress = false;
            }
        }

        initializeAuth();
    }, [validateAuthWithRetry]);

    // Sync token to localStorage when it changes
    useEffect(() => {
        if (auth.token && isValidTokenFormat(auth.token)) {
            localStorage.setItem('token', auth.token);
        }
    }, [auth.token]);

    /**
     * Logout user
     */
    const logout = useCallback(() => {
        // Clear ALL auth-related localStorage items from BOTH apps
        // Accounting app items
        localStorage.removeItem('token');
        localStorage.removeItem('accountingUser');
        localStorage.removeItem('selectedCompany');
        localStorage.removeItem('selectedCompanyUserId');
        // Main app items (cross-app cleanup)
        localStorage.removeItem('user');
        localStorage.removeItem('companyCount');

        // Reset the init ref so next login will re-initialize
        initRef.current.attempted = false;
        initRef.current.inProgress = false;

        setAuth({ token: null, user: null, loading: false, error: null });
        redirectToLogin();
    }, []);    /**
     * Manually retry authentication (for error recovery)
     */
    const retryAuth = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            redirectToLogin();
            return;
        }

        setAuth(prev => ({ ...prev, loading: true, error: null }));

        const result = await validateAuthWithRetry(token);

        if (result.success) {
            localStorage.setItem('accountingUser', JSON.stringify(result.user));
            setAuth({ token, user: result.user, loading: false, error: null });
        } else {
            setAuth(prev => ({ ...prev, loading: false, error: result.error }));
        }
    }, [validateAuthWithRetry]);

    const value = {
        auth,
        user: auth.user,
        token: auth.token,
        loading: auth.loading,
        error: auth.error,
        isAuthenticated: !!auth.token && !!auth.user,
        logout,
        redirectToLogin,
        retryAuth
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
