// src/services/apiClient.js
import axios from "axios";
import { getCurrentCompany } from "./companyContextAccessor";

export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.length
        ? import.meta.env.VITE_API_BASE_URL
        : (typeof window !== "undefined" ? window.location.origin : "");

const baseURL = API_BASE_URL;

// Main app URL for auth redirects
const MAIN_APP_URL = import.meta.env.VITE_MAIN_APP_URL;

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
        // Inject auth token
        const token = localStorage.getItem('token');
        if (token) {
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

            console.warn('Authentication failed - redirecting to login');
            localStorage.removeItem('token');
            localStorage.removeItem('accountingUser');
            localStorage.removeItem('selectedCompany');
            window.location.href = `${MAIN_APP_URL}?redirect=accounting`;
            return Promise.reject(new Error('Session expired. Please log in again.'));
        }

        if (err.response) {
            const msg = err.response.data && err.response.data.error
                ? (err.response.data.error.message || JSON.stringify(err.response.data.error))
                : err.response.statusText;
            return Promise.reject(new Error(`${err.response.status} ${msg}`));
        }
        if (err.request) return Promise.reject(new Error("No response from server"));
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

    if (token) {
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

export default apiClient;
