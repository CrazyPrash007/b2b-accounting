// src/services/apiClient.js
import axios from "axios";
import { getCurrentCompany } from "./companyContextAccessor";

export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.length
        ? import.meta.env.VITE_API_BASE_URL
        : (typeof window !== "undefined" ? window.location.origin : "");

const baseURL = API_BASE_URL;

// Main app URL for auth redirects
const MAIN_APP_URL = import.meta.env.VITE_MAIN_APP_URL || '';

// Prevent multiple redirects
let isRedirecting = false;

/**
 * Validate token format
 */
function isValidTokenFormat(token) {
    return token && /^proto-token:[0-9a-fA-F]{24}$/.test(token);
}

/**
 * Safe redirect to login (prevents multiple redirects)
 */
function safeRedirectToLogin() {
    if (isRedirecting) {
        console.log('[API] Redirect already in progress, skipping');
        return;
    }

    isRedirecting = true;

    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('accountingUser');
    localStorage.removeItem('selectedCompany');

    // Build redirect URL
    const currentPath = window.location.pathname;
    const redirectParam = currentPath !== '/' ? `&redirect_to=${encodeURIComponent(currentPath)}` : '';
    const redirectUrl = `${MAIN_APP_URL}?redirect=accounting${redirectParam}`;

    console.log('[API] Redirecting to:', redirectUrl);

    // Small delay to ensure state cleanup completes
    setTimeout(() => {
        window.location.href = redirectUrl;
    }, 100);
}

const apiClient = axios.create({
    baseURL,
    timeout: 30000,
    withCredentials: true,
    headers: {
        Accept: "application/json",
    },
});

// ---------------------------------------------------------
// ADD REQUEST INTERCEPTOR → inject auth token and selectedCompany
// ---------------------------------------------------------
apiClient.interceptors.request.use(
    config => {
        // Debug: log outgoing request body
        if (config.data) {
            console.log('[apiClient] Request body:', config.data);
            console.log('[apiClient] gstNumber in body:', config.data.gstNumber);
        }

        // Inject auth token
        const token = localStorage.getItem('token');
        if (token && isValidTokenFormat(token)) {
            config.headers.Authorization = token;

            // Also set x-owner-id for backward compatibility
            const match = token.match(/proto-token:([0-9a-fA-F]{24})$/);
            if (match) {
                config.headers['x-owner-id'] = match[1];
            }
        }

        // Inject selected company
        const company = getCurrentCompany();
        if (company) {
            config.params = config.params || {};
            config.params.accountCompanyName = company;
        }

        return config;
    },
    error => Promise.reject(error)
);

// ---------------------------------------------------------
// RESPONSE ERROR HANDLER
// ---------------------------------------------------------
apiClient.interceptors.response.use(
    res => res,
    err => {
        // Handle 401 Unauthorized - but NOT during initial auth validation
        // The AuthContext will handle redirects for auth validation
        if (err.response && err.response.status === 401) {
            // Check if this is the auth/me endpoint - don't redirect, let AuthContext handle it
            if (err.config?.url?.includes('/api/auth/')) {
                return Promise.reject(new Error('401 Authentication required'));
            }

            console.warn('[API] Authentication failed (401) - redirecting to login');
            safeRedirectToLogin();
            return Promise.reject(new Error('Session expired. Please log in again.'));
        }

        // Handle 403 Forbidden
        if (err.response && err.response.status === 403) {
            const errorCode = err.response.data?.error?.code;
            const errorMessage = err.response.data?.error?.message;

            // Check if account is blocked
            if (errorCode === 'ACCOUNT_BLOCKED') {
                console.warn('[API] Account blocked (403) - logging out');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('selectedCompany');
                alert(errorMessage || 'Your account has been blocked. Please contact support.');
                window.location.href = '/';
                return Promise.reject(new Error(errorMessage || 'Account blocked'));
            }

            console.warn('[API] Access forbidden (403)');
            return Promise.reject(new Error(errorMessage || 'Access denied. You do not have permission to perform this action.'));
        }

        if (err.response) {
            const msg = err.response.data && err.response.data.error
                ? (err.response.data.error.message || JSON.stringify(err.response.data.error))
                : err.response.statusText;
            return Promise.reject(new Error(`${err.response.status} ${msg}`));
        }

        // Network errors
        if (err.request) {
            console.warn('[API] No response from server');
            return Promise.reject(new Error("No response from server. Please check your connection."));
        }

        return Promise.reject(err);
    }
);

// ---------------------------------------------------------
// HELPER: authFetch - fetch wrapper with auth headers
// Use this for raw fetch calls that need auth
// ---------------------------------------------------------
export function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Accept': 'application/json',
        ...(options.headers || {}),
    };

    if (token && isValidTokenFormat(token)) {
        headers['Authorization'] = token;
        const match = token.match(/proto-token:([0-9a-fA-F]{24})$/);
        if (match) {
            headers['x-owner-id'] = match[1];
        }
    }

    return fetch(url, {
        ...options,
        headers,
        credentials: 'include',
    });
}

/**
 * Reset redirect flag (useful for testing or after successful navigation)
 */
export function resetRedirectFlag() {
    isRedirecting = false;
}

export default apiClient;
