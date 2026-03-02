// SearchSelect.jsx — Reusable search-and-select multi-select dropdown
import React, { useState, useRef, useEffect, useMemo } from "react";

/**
 * A search-and-select dropdown component that replaces checkbox grids.
 *
 * Props:
 *   options       - Array of strings (option labels)
 *   selected      - Array of currently selected strings
 *   onChange       - (newSelected: string[]) => void
 *   placeholder    - Input placeholder text (default: "Search and select...")
 *   label          - Label text (optional)
 *   maxHeight      - Max height of dropdown list (default: 200)
 */
export default function SearchSelect({
    options = [],
    selected = [],
    onChange,
    placeholder = "Search and select...",
    label = "",
    maxHeight = 200,
}) {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filtered = useMemo(() => {
        if (!query.trim()) return options;
        const q = query.toLowerCase();
        return options.filter((opt) => opt.toLowerCase().includes(q));
    }, [options, query]);

    const toggleOption = (opt) => {
        if (selected.includes(opt)) {
            onChange(selected.filter((s) => s !== opt));
        } else {
            onChange([...selected, opt]);
        }
    };

    const removeTag = (opt) => {
        onChange(selected.filter((s) => s !== opt));
    };

    const selectAll = () => onChange([...options]);
    const clearAll = () => onChange([]);

    return (
        <div ref={containerRef} style={{ position: "relative" }}>
            {label && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                        {label} {selected.length > 0 && <span style={{ fontWeight: 400, color: "#6b7280" }}>({selected.length} selected)</span>}
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button type="button" onClick={selectAll} style={{ fontSize: "12px", color: "#3b82f6", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                            Select All
                        </button>
                        <button type="button" onClick={clearAll} style={{ fontSize: "12px", color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* Selected tags */}
            {selected.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "6px" }}>
                    {selected.map((item) => (
                        <span
                            key={item}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "2px 8px",
                                fontSize: "12px",
                                background: "#dbeafe",
                                color: "#1e40af",
                                borderRadius: "12px",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {item}
                            <button
                                type="button"
                                onClick={() => removeTag(item)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "0",
                                    fontSize: "14px",
                                    lineHeight: 1,
                                    color: "#3b82f6",
                                }}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Search input */}
            <input
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    if (!isOpen) setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
                style={{
                    width: "100%",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                }}
            />

            {/* Dropdown list */}
            {isOpen && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 50,
                        background: "#fff",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        marginTop: "4px",
                        maxHeight: `${maxHeight}px`,
                        overflowY: "auto",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    }}
                >
                    {filtered.length === 0 ? (
                        <div style={{ padding: "10px 12px", fontSize: "13px", color: "#9ca3af", textAlign: "center" }}>
                            No options match "{query}"
                        </div>
                    ) : (
                        filtered.map((opt) => {
                            const isSelected = selected.includes(opt);
                            return (
                                <div
                                    key={opt}
                                    onClick={() => toggleOption(opt)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "8px 12px",
                                        fontSize: "13px",
                                        cursor: "pointer",
                                        background: isSelected ? "#eff6ff" : "transparent",
                                        borderBottom: "1px solid #f3f4f6",
                                        transition: "background 0.15s",
                                    }}
                                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f9fafb"; }}
                                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                                >
                                    <span style={{
                                        width: "16px", height: "16px", borderRadius: "3px",
                                        border: isSelected ? "none" : "1.5px solid #d1d5db",
                                        background: isSelected ? "#3b82f6" : "#fff",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0, fontSize: "11px", color: "#fff",
                                    }}>
                                        {isSelected && "✓"}
                                    </span>
                                    <span style={{ color: "#374151" }}>{opt}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
