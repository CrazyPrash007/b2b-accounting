// src/layouts/TopBar.jsx
import React, { useState, useRef, useEffect, useContext } from "react";
import { CompanyContext } from "src/App";
import { useAuth } from "src/contexts/AuthContext";
import companyApi from "src/features/company/api/company.api";
import { setCurrentCompany } from "src/services/companyContextAccessor";

// Main app URL for navigation
const MAIN_APP_URL = import.meta.env.VITE_MAIN_APP_URL || 'http://localhost:5173';

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
    const { user, logout } = useAuth();

    const [companies, setCompanies] = useState([]);
    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
    const [AddCompanyFormComponent, setAddCompanyFormComponent] = useState(null);

    const companyDropdownRef = useRef(null);
    const userDropdownRef = useRef(null);

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

    // Close dropdowns on outside click
    useEffect(() => {
        function onClick(e) {
            if (
                companyDropdownRef.current &&
                !companyDropdownRef.current.contains(e.target)
            ) {
                setShowCompanyDropdown(false);
            }
            if (
                userDropdownRef.current &&
                !userDropdownRef.current.contains(e.target)
            ) {
                setShowUserDropdown(false);
            }
        }
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    // ---------------------------------------------------------
    // UI HELPERS
    // ---------------------------------------------------------
    const getUserInitial = () => {
        if (user?.name) {
            return user.name[0].toUpperCase();
        }
        return "U";
    };

    const handleGoToChat = () => {
        // Navigate back to main app dashboard
        window.location.href = `${MAIN_APP_URL}/dashboard`;
    };

    const handleLogout = () => {
        setShowUserDropdown(false);
        logout();
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
                        title="Back to Chat"
                    />

                    {/* Back to Chat Button */}
                    <button
                        onClick={handleGoToChat}
                        style={{
                            background: "rgba(255,255,255,0.15)",
                            borderRadius: 6,
                            padding: "6px 12px",
                            border: "1px solid rgba(255,255,255,0.3)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            cursor: "pointer",
                            fontSize: 13,
                        }}
                    >
                        <svg width="16" height="16" fill="#fff" viewBox="0 0 24 24">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                        </svg>
                        Chat
                    </button>

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
                                cursor: "pointer",
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

                {/* RIGHT USER DROPDOWN */}
                <div ref={userDropdownRef} style={{ position: "relative" }}>
                    <div
                        onClick={() => setShowUserDropdown(!showUserDropdown)}
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
                            cursor: "pointer",
                            fontWeight: 600,
                        }}
                    >
                        {getUserInitial()}
                    </div>

                    {showUserDropdown && (
                        <div
                            style={{
                                position: "absolute",
                                top: "100%",
                                right: 0,
                                marginTop: 8,
                                background: "#fff",
                                borderRadius: 8,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                minWidth: 200,
                                zIndex: 100,
                                overflow: "hidden",
                            }}
                        >
                            {/* User Info */}
                            <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f2f5" }}>
                                <div style={{ fontWeight: 600, color: "#333", marginBottom: 4 }}>
                                    {user?.name || "User"}
                                </div>
                                <div style={{ fontSize: 12, color: "#666" }}>
                                    {user?.email || ""}
                                </div>
                            </div>

                            {/* Back to Chat */}
                            <div
                                onClick={handleGoToChat}
                                style={{
                                    padding: "12px 16px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    borderBottom: "1px solid #f0f2f5",
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "#f5f6f6"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                            >
                                <svg width="18" height="18" fill="#54656f" viewBox="0 0 24 24">
                                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                                </svg>
                                <span style={{ color: "#333" }}>Back to Chat</span>
                            </div>

                            {/* Logout */}
                            <div
                                onClick={handleLogout}
                                style={{
                                    padding: "12px 16px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    color: "#e53935",
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "#fff5f5"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                            >
                                <svg width="18" height="18" fill="#e53935" viewBox="0 0 24 24">
                                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                </svg>
                                <span>Logout</span>
                            </div>
                        </div>
                    )}
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
