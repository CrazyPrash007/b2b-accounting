// src/services/apiClient.js
import axios from "axios";

const baseURL = process.env.REACT_APP_API_BASE_URL && process.env.REACT_APP_API_BASE_URL.length
    ? process.env.REACT_APP_API_BASE_URL
    : (typeof window !== "undefined" ? window.location.origin : "");

const apiClient = axios.create({
    baseURL,
    timeout: 30000,
    withCredentials: true,
    headers: {
        Accept: "application/json",
    },
});


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
