// src/layouts/TopBar.jsx
import React, { useState, useRef, useEffect, useContext } from "react";
import { CompanyContext } from "src/App";
import companyApi from "src/features/company/api/company.api";
import { setCurrentCompany } from "src/services/companyContextAccessor";

// Lazy import AddCompanyForm
let AddCompanyForm = null;
const loadAddCompanyForm = async () => {
    if (!AddCompanyForm) {
        const mod = await import("src/features/company/components/AddCompanyForm");
        AddCompanyForm = mod.default;
    }
    return AddCompanyForm;
};

export default function TopBar() {
    const { selectedCompany, setSelectedCompany } = useContext(CompanyContext);

    const [companies, setCompanies] = useState([]);
    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
    const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
    const [AddCompanyFormComponent, setAddCompanyFormComponent] = useState(null);

    const companyDropdownRef = useRef(null);

    // ---------------------------------------------------------
    // 1️⃣ LOAD COMPANIES ON MOUNT
    // ---------------------------------------------------------
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            const list = await companyApi.fetchCompanies();
            const arr = Array.isArray(list) ? list : [];

            if (cancelled) return;
            setCompanies(arr);

            // If nothing selected yet → auto-select first
            if (!selectedCompany && arr.length > 0) {
                const firstId = arr[0]._id;
                setSelectedCompany(firstId);
                setCurrentCompany(firstId);

            }
        };

        load();
        return () => (cancelled = true);
    }, []);

    // ---------------------------------------------------------
    // 2️⃣ ON COMPANY CHANGE → update global context + global accessor
    // ---------------------------------------------------------
    useEffect(() => {
        if (selectedCompany) {
            setCurrentCompany(selectedCompany);
            localStorage.setItem("selectedCompany", selectedCompany);
        }
    }, [selectedCompany]);

    // ---------------------------------------------------------
    // 3️⃣ SWITCH COMPANY
    // ---------------------------------------------------------
    const handleSwitchCompany = (company) => {
        const id = company._id;

        setSelectedCompany(id);
        setCurrentCompany(id);
        localStorage.setItem("selectedCompany", id);

        setShowCompanyDropdown(false);
    };


    // ---------------------------------------------------------
    // Add Company Modal
    // ---------------------------------------------------------
    const handleOpenAddCompany = async () => {
        setShowCompanyDropdown(false);
        const Form = await loadAddCompanyForm();
        setAddCompanyFormComponent(() => Form);
        setIsAddCompanyOpen(true);
    };

    const handleCompanyCreated = (newCompany) => {
        setCompanies((prev) => [...prev, newCompany]);
        setSelectedCompany(newCompany._id);
        setIsAddCompanyOpen(false);
        setAddCompanyFormComponent(null);
    };

    // Close dropdown on outside click
    useEffect(() => {
        function onClick(e) {
            if (
                companyDropdownRef.current &&
                !companyDropdownRef.current.contains(e.target)
            ) {
                setShowCompanyDropdown(false);
            }
        }
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    // ---------------------------------------------------------
    // UI HELPERS
    // ---------------------------------------------------------
    const getUserInitial = () => {
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            return user?.name?.[0]?.toUpperCase() || "U";
        } catch {
            return "U";
        }
    };

    const handleGoToChat = () => {
        window.location.href = "/dashboard";
    };

    const selectedCompanyObj = companies.find(c => c._id === selectedCompany);
    const selectedCompanyName = selectedCompanyObj?.companyName || "Select Company";

    return (
        <>
            <div
                style={{
                    background: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
                    padding: "8px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: 50,
                }}
            >
                {/* LEFT AREA */}
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <img
                        src="/assets/jpg/logo.jpg"
                        alt="Logo"
                        style={{ height: 34, borderRadius: 4, cursor: "pointer" }}
                        onClick={handleGoToChat}
                    />

                    {/* COMPANY DROPDOWN */}
                    <div ref={companyDropdownRef} style={{ position: "relative" }}>
                        <button
                            onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                            style={{
                                background: "rgba(255,255,255,0.15)",
                                borderRadius: 6,
                                padding: "6px 12px",
                                border: "1px solid rgba(255,255,255,0.3)",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                minWidth: 140,
                            }}
                        >
                            <span
                                style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {selectedCompanyName}
                            </span>

                            <svg width="14" height="14" fill="#fff">
                                <path d="M7 10l5-5H2z"></path>
                            </svg>
                        </button>

                        {showCompanyDropdown && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    marginTop: 4,
                                    background: "#fff",
                                    borderRadius: 8,
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                    minWidth: 220,
                                    zIndex: 100,
                                }}
                            >
                                {companies.map((c) => {
                                    const id = c._id;
                                    const active = selectedCompany === id;
                                    return (
                                        <div
                                            key={c._id}
                                            onClick={() => handleSwitchCompany(c)}
                                            style={{
                                                padding: "10px 16px",
                                                cursor: "pointer",
                                                background: active ? "#eef2ff" : "#fff",
                                                borderLeft: active
                                                    ? "3px solid #667eea"
                                                    : "3px solid transparent",
                                            }}
                                        >
                                            {c.companyName || c.name}
                                        </div>
                                    );
                                })}

                                <div
                                    onClick={handleOpenAddCompany}
                                    style={{
                                        padding: "12px 16px",
                                        cursor: "pointer",
                                        borderTop: "1px solid #eee",
                                        color: "#667eea",
                                        fontWeight: 500,
                                    }}
                                >
                                    + Add Company
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT USER ICON */}
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.2)",
                        border: "2px solid rgba(255,255,255,0.5)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {getUserInitial()}
                </div>
            </div>

            {/* Add Company Modal */}
            {isAddCompanyOpen && AddCompanyFormComponent && (
                <AddCompanyFormComponent
                    onCreated={handleCompanyCreated}
                    onCancel={() => setIsAddCompanyOpen(false)}
                    createCompanyFn={companyApi.createCompany}
                />
            )}
        </>
    );
}
