// src/layouts/TopBar.jsx
import React, { useState, useRef, useEffect } from "react";

/**
 * TopBar - Consistent navigation bar across all accounting pages
 * Matches the style from the main B2B dashboard
 */
export default function TopBar() {
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const profileDropdownRef = useRef(null);

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
    );
}
