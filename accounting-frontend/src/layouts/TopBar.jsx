// src/layouts/TopBar.jsx
import React, { useState, useRef, useEffect } from "react";

// Lazy import for AddCompanyForm - only loaded when needed
let AddCompanyForm = null;
const loadAddCompanyForm = async () => {
    if (AddCompanyForm) return AddCompanyForm;
    try {
        const module = await import("src/features/company/components/AddCompanyForm");
        AddCompanyForm = module.default;
        return AddCompanyForm;
    } catch {
        return null;
    }
};

// Optional company API import - fails gracefully if not available
let companyApi = null;
try {
    companyApi = require("src/features/company/api/company.api").default;
} catch {
    companyApi = null;
}

/**
 * TopBar - Consistent navigation bar across all accounting pages
 * Matches the style from the main B2B dashboard
 */
export default function TopBar() {
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const profileDropdownRef = useRef(null);

    // Company dropdown state - isolated within TopBar
    const [companies, setCompanies] = useState(null);
    const [activeCompany, setActiveCompany] = useState(null);
    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
    const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
    const [AddCompanyFormComponent, setAddCompanyFormComponent] = useState(null);
    const companyDropdownRef = useRef(null);

    // Load companies on mount - guarded and non-blocking
    useEffect(() => {
        let cancelled = false;
        const loadCompanies = async () => {
            if (!companyApi?.fetchCompanies) {
                // No API available - use mock data for UI
                if (!cancelled) {
                    setCompanies([]);
                    setActiveCompany(null);
                }
                return;
            }
            try {
                const list = await companyApi.fetchCompanies();
                if (!cancelled && Array.isArray(list)) {
                    setCompanies(list);
                    // Try to get active company
                    if (companyApi.getActiveCompany) {
                        try {
                            const active = await companyApi.getActiveCompany();
                            if (!cancelled && active) {
                                setActiveCompany(active);
                            } else if (!cancelled && list.length > 0) {
                                setActiveCompany(list[0]);
                            }
                        } catch {
                            // Swallow - use first company as fallback
                            if (!cancelled && list.length > 0) {
                                setActiveCompany(list[0]);
                            }
                        }
                    } else if (list.length > 0) {
                        setActiveCompany(list[0]);
                    }
                } else {
                    // API returned null or non-array - use empty state
                    if (!cancelled) {
                        setCompanies([]);
                        setActiveCompany(null);
                    }
                }
            } catch {
                // Swallow error - use empty state
                if (!cancelled) {
                    setCompanies([]);
                    setActiveCompany(null);
                }
            }
        };
        loadCompanies();
        return () => { cancelled = true; };
    }, []);

    // Close company dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
                setShowCompanyDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle company switch - guarded
    const handleSwitchCompany = async (company) => {
        if (!company) return;
        setShowCompanyDropdown(false);
        if (companyApi?.switchCompany) {
            try {
                await companyApi.switchCompany(company.id || company._id);
            } catch {
                // Swallow - still update local state
            }
        }
        setActiveCompany(company);
    };

    // Handle opening Add Company modal
    const handleOpenAddCompany = async () => {
        setShowCompanyDropdown(false);
        // Lazy load the form component
        const FormComponent = await loadAddCompanyForm();
        if (FormComponent) {
            setAddCompanyFormComponent(() => FormComponent);
            setIsAddCompanyOpen(true);
        }
    };

    // Handle company creation callback
    const handleCompanyCreated = (newCompany, activeCompanyId) => {
        setIsAddCompanyOpen(false);
        setAddCompanyFormComponent(null);
        if (newCompany && typeof newCompany === "object") {
            setCompanies((prev) => {
                const list = Array.isArray(prev) ? prev : [];
                return [...list, newCompany];
            });
            setActiveCompany(newCompany);
        }
    };

    // Handle cancel Add Company
    const handleCancelAddCompany = () => {
        setIsAddCompanyOpen(false);
        setAddCompanyFormComponent(null);
    };

    // Navigate to main dashboard (chat)
    const handleGoToChat = () => {
        // Navigate to the main B2B app dashboard
        window.location.href = "/dashboard";
    };

    // Handle logout
    const handleLogout = () => {
        // Clear any stored auth data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    // Get user initial from localStorage or default
    const getUserInitial = () => {
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            return user?.name ? user.name.slice(0, 1).toUpperCase() : "U";
        } catch {
            return "U";
        }
    };

    return (
        <>
        <div
            style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                padding: "8px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                height: 50,
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                flexShrink: 0,
            }}
        >
            {/* Left: Logo and Menu Items */}
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                {/* Logo - Click to go to Chat */}
                <img
                    src="/assets/jpg/logo.jpg"
                    alt="B2B Logo"
                    style={{ height: 34, borderRadius: 4, cursor: "pointer" }}
                    onClick={handleGoToChat}
                    onError={(e) => {
                        e.target.style.display = "none";
                    }}
                />

                {/* Menu Items */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Accounting Button (Active) */}
                    <button
                        style={{
                            background: "rgba(255,255,255,0.3)",
                            border: "none",
                            borderRadius: 6,
                            padding: "8px 16px",
                            color: "#fff",
                            fontWeight: 500,
                            fontSize: 14,
                            cursor: "default",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"></path>
                        </svg>
                        Accounting
                    </button>

                    {/* Company Dropdown - Always visible */}
                    <div style={{ position: "relative" }} ref={companyDropdownRef}>
                        <button
                            onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                            style={{
                                background: "rgba(255,255,255,0.15)",
                                border: "1px solid rgba(255,255,255,0.3)",
                                borderRadius: 6,
                                padding: "6px 12px",
                                color: "#fff",
                                fontSize: 13,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                minWidth: 120,
                                maxWidth: 200,
                            }}
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff">
                                <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"></path>
                            </svg>
                            <span style={{ 
                                overflow: "hidden", 
                                textOverflow: "ellipsis", 
                                whiteSpace: "nowrap",
                                flex: 1,
                                textAlign: "left"
                            }}>
                                {activeCompany?.companyName || activeCompany?.name || "Select Company"}
                            </span>
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="#fff" style={{ flexShrink: 0 }}>
                                <path d="M7 10l5 5 5-5z"></path>
                            </svg>
                        </button>

                        {/* Company Dropdown Menu */}
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
                                    minWidth: 200,
                                    maxWidth: 280,
                                    zIndex: 100,
                                    overflow: "hidden",
                                }}
                            >
                                {/* Company List */}
                                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                                    {Array.isArray(companies) && companies.length > 0 ? (
                                        companies.map((company) => {
                                            const companyId = company?.id || company?._id;
                                            const companyName = company?.companyName || company?.name || "Unnamed";
                                            const isActive = activeCompany && 
                                                (activeCompany.id === companyId || activeCompany._id === companyId);
                                            return (
                                                <div
                                                    key={companyId || companyName}
                                                    onClick={() => handleSwitchCompany(company)}
                                                    style={{
                                                        padding: "10px 16px",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 10,
                                                        background: isActive ? "#f0f4ff" : "#fff",
                                                        borderLeft: isActive ? "3px solid #667eea" : "3px solid transparent",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isActive) e.currentTarget.style.background = "#f5f6f6";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = isActive ? "#f0f4ff" : "#fff";
                                                    }}
                                                >
                                                    <span style={{ 
                                                        color: "#3b4a54", 
                                                        fontSize: 13,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}>
                                                        {companyName}
                                                    </span>
                                                    {isActive && (
                                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="#667eea" style={{ marginLeft: "auto", flexShrink: 0 }}>
                                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
                                                        </svg>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ padding: "12px 16px", color: "#8696a0", fontSize: 13 }}>
                                            No companies available
                                        </div>
                                    )}
                                </div>

                                {/* Divider */}
                                <div style={{ borderTop: "1px solid #e9edef" }}></div>

                                {/* Add Company Option */}
                                <div
                                    onClick={handleOpenAddCompany}
                                    style={{
                                        padding: "12px 16px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        background: "#fff",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f6f6")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                                >
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="#667eea">
                                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path>
                                    </svg>
                                    <span style={{ color: "#667eea", fontSize: 13, fontWeight: 500 }}>
                                        Add Company
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Profile Icon */}
            <div style={{ position: "relative" }} ref={profileDropdownRef}>
                <div
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.2)",
                        border: "2px solid rgba(255,255,255,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#fff",
                    }}
                >
                    {getUserInitial()}
                </div>

                {/* Dropdown Menu */}
                {showProfileDropdown && (
                    <div
                        style={{
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            marginTop: 8,
                            background: "#fff",
                            borderRadius: 8,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            minWidth: 180,
                            zIndex: 100,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            onClick={() => {
                                setShowProfileDropdown(false);
                                // Navigate to profile in main app
                                window.location.href = "/dashboard";
                            }}
                            style={{
                                padding: "14px 20px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                borderBottom: "1px solid #f0f2f5",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f6f6")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="#54656f">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                            </svg>
                            <span style={{ color: "#3b4a54", fontSize: 14 }}>My Profile</span>
                        </div>
                        <div
                            onClick={handleLogout}
                            style={{
                                padding: "14px 20px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f6f6")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="#54656f">
                                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"></path>
                            </svg>
                            <span style={{ color: "#3b4a54", fontSize: 14 }}>Logout</span>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Add Company Modal - Lazy loaded, only renders when open */}
        {isAddCompanyOpen && AddCompanyFormComponent && (
            <AddCompanyFormComponent
                onCreated={handleCompanyCreated}
                onCancel={handleCancelAddCompany}
                createCompanyFn={companyApi?.createCompany}
            />
        )}
        </>
    );
}
