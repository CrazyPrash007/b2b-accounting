// src/App.jsx
import React, { createContext, useState, useEffect } from "react";
import { setCurrentCompany } from "./services/companyContextAccessor";
import apiClient from "./services/apiClient";
import AppRoutes from "./AppRoutes";

// --------------------------------------------------
// Create Global Company Context
// --------------------------------------------------
export const CompanyContext = createContext({
    selectedCompany: "",
    setSelectedCompany: () => { }
});

export default function App() {
    const [selectedCompany, setSelectedCompany] = useState("");

    // --------------------------------------------
    // 1️⃣ Load saved company from localStorage
    // --------------------------------------------
    useEffect(() => {
        const saved = localStorage.getItem("selectedCompany");

        if (saved) {
            setSelectedCompany(saved);
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
    }, []);

    // --------------------------------------------
    // 3️⃣ Update localStorage & global accessor
    // --------------------------------------------
    useEffect(() => {
        if (selectedCompany) {
            localStorage.setItem("selectedCompany", selectedCompany);
            setCurrentCompany(selectedCompany);
        }
    }, [selectedCompany]);

    return (
        <CompanyContext.Provider value={{ selectedCompany, setSelectedCompany }}>
            <AppRoutes />
        </CompanyContext.Provider>
    );
}
