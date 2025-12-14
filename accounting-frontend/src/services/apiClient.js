// src/services/apiClient.js
import axios from "axios";
import { getCurrentCompany } from "./companyContextAccessor";

const baseURL =
    import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.length
        ? import.meta.env.VITE_API_BASE_URL
        : (typeof window !== "undefined" ? window.location.origin : "");

const apiClient = axios.create({
    baseURL,
    timeout: 30000,
    withCredentials: true,
    headers: {
        Accept: "application/json",
    },
});

// ---------------------------------------------------------
// ADD REQUEST INTERCEPTOR → inject selectedCompany globally
// ---------------------------------------------------------
apiClient.interceptors.request.use(
    config => {
        const company = getCurrentCompany();

        if (company) {
            // Ensure params object exists
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

export default apiClient;
