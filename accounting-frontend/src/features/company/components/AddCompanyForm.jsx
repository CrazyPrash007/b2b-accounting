// src/features/company/components/AddCompanyForm.jsx
import React, { useState, useRef, useEffect } from "react";

/**
 * AddCompanyForm - Self-contained form for creating a new company
 * 
 * @param {Object} props
 * @param {Function} props.onCreated - Callback when company is successfully created: (newCompany, activeCompanyId) => void
 * @param {Function} props.onCancel - Callback to close the form/modal
 * @param {Function} [props.createCompanyFn] - Optional API function to create company. If not provided, form submission is a no-op.
 */
export default function AddCompanyForm({ onCreated, onCancel, createCompanyFn }) {
    const [formData, setFormData] = useState({
        companyName: "",
        businessType: "",
        industryType: "",
        registrationType: "regular",
        gstin: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
        mobile: "",
        email: "",
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [pincodeLoading, setPincodeLoading] = useState(false);
    const [pincodeError, setPincodeError] = useState("");

    const refsOrder = useRef([]);
    const setRef = (idx) => (el) => (refsOrder.current[idx] = el);

    const businessTypes = [
        { value: "proprietorship", label: "Proprietorship" },
        { value: "partnership", label: "Partnership" },
        { value: "private_ltd", label: "Private Limited" },
        { value: "llp", label: "LLP" },
    ];

    const industries = [
        { value: "it", label: "IT & Software" },
        { value: "manufacturing", label: "Manufacturing" },
        { value: "retail", label: "Retail" },
        { value: "services", label: "Services" },
        { value: "trading", label: "Trading" },
        { value: "other", label: "Other" },
    ];

    const registrationOptions = [
        { value: "regular", label: "Regular" },
        { value: "composition", label: "Composition" },
        { value: "unregistered", label: "Unregistered" },
    ];

    // Focus first input on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            refsOrder.current[0]?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const handleChange = (k) => (e) => {
        const v = e?.target?.value ?? e;
        setFormData((s) => ({ ...s, [k]: v }));
        setErrors((x) => ({ ...x, [k]: undefined }));
        if (submitError) setSubmitError("");
    };

    // Pincode lookup to auto-fill city and state
    const handlePincodeChange = async (e) => {
        const pincode = e.target.value.replace(/\D/g, ""); // Only digits
        setFormData((s) => ({ ...s, pincode }));
        setErrors((x) => ({ ...x, pincode: undefined }));
        setPincodeError("");

        if (pincode.length === 6) {
            setPincodeLoading(true);
            try {
                const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
                const data = await response.json();

                if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
                    const postOffice = data[0].PostOffice[0];
                    const state = postOffice.State ? postOffice.State.toUpperCase() : "";
                    const district = postOffice.District ? postOffice.District.toUpperCase() : "";

                    setFormData((s) => ({
                        ...s,
                        state: state,
                        city: district,
                    }));
                    setPincodeError("");
                } else {
                    setPincodeError("Invalid pincode or location not found");
                }
            } catch (err) {
                console.error("Pincode lookup error:", err);
                setPincodeError("Failed to lookup pincode. Please enter manually.");
            } finally {
                setPincodeLoading(false);
            }
        } else if (pincode.length > 0 && pincode.length < 6) {
            setFormData((s) => ({ ...s, state: "", city: "" }));
        }
    };

    const focusNext = (idx) => {
        const next = refsOrder.current[idx + 1];
        if (next && typeof next.focus === "function") next.focus();
    };

    const handleKeyDownGeneric = (e, idx) => {
        if (e.key === "Enter") {
            e.preventDefault();
            focusNext(idx);
        }
    };

    const validate = () => {
        const newErrors = {};
        const trimmedName = (formData.companyName || "").trim();
        if (!trimmedName) {
            newErrors.companyName = "Company name is required";
        }
        if (!formData.businessType) {
            newErrors.businessType = "Business type is required";
        }
        // GSTIN validation (optional, but if provided should be 15 chars)
        // Skip validation if registration type is unregistered
        const gstin = (formData.gstin || "").trim();
        if (formData.registrationType !== "unregistered" && gstin && gstin.length !== 15) {
            newErrors.gstin = "GSTIN must be 15 characters";
        }
        if (!formData.addressLine1.trim()) {
            newErrors.addressLine1 = "Address is required";
        }
        if (!formData.pincode.trim()) {
            newErrors.pincode = "Pincode is required";
        }
        if (formData.pincode.trim() && formData.pincode.trim().length !== 6) {
            newErrors.pincode = "Pincode must be 6 digits";
        }
        if (!formData.state) {
            newErrors.state = "State is required";
        }
        if (!formData.city) {
            newErrors.city = "City is required";
        }
        if (!formData.mobile.trim()) {
            newErrors.mobile = "Mobile number is required";
        }
        if (formData.mobile.trim() && !/^[6-9]\d{9}$/.test(formData.mobile.trim())) {
            newErrors.mobile = "Enter a valid 10-digit mobile number";
        }
        // Email validation (optional)
        const email = (formData.email || "").trim();
        if (email && !/^\S+@\S+\.\S+$/.test(email)) {
            newErrors.email = "Invalid email format";
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e?.preventDefault?.();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            refsOrder.current[0]?.focus();
            return;
        }

        // If no createCompanyFn provided, just call onCreated with mock data
        if (typeof createCompanyFn !== "function") {
            const mockCompany = {
                id: `local_${Date.now()}`,
                ...formData,
                companyName: formData.companyName.trim(),
            };
            try {
                onCreated?.(mockCompany, null);
            } catch {
                // Swallow callback errors
            }
            return;
        }

        setIsSubmitting(true);
        setSubmitError("");

        try {
            const payload = {
                companyName: formData.companyName.trim(),
                businessType: formData.businessType || undefined,
                industryType: formData.industryType || undefined,
                registrationType: formData.registrationType || "unregistered",
                gstin: formData.gstin.trim() || undefined,
                addressLine1: formData.addressLine1.trim() || undefined,
                addressLine2: formData.addressLine2.trim() || undefined,
                city: formData.city.trim() || undefined,
                state: formData.state.trim() || undefined,
                pincode: formData.pincode.trim() || undefined,
                country: formData.country || "India",
                mobile: formData.mobile.trim() || undefined,
                email: formData.email.trim() || undefined,
            };

            const result = await createCompanyFn(payload);

            if (result && typeof result === "object") {
                try {
                    onCreated?.(result, result.id || null);
                } catch {
                    // Swallow callback errors
                }
            } else {
                setSubmitError("Failed to create company. Please try again.");
            }
        } catch (err) {
            const message = err?.message || "An error occurred while creating the company.";
            setSubmitError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            companyName: "",
            businessType: "",
            industryType: "",
            registrationType: "regular",
            gstin: "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            pincode: "",
            country: "India",
            mobile: "",
            email: "",
        });
        setErrors({});
        setSubmitError("");
        refsOrder.current[0]?.focus();
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onCancel?.();
        }
    };

    function CustomSelect({ placeholder, options = [], value, onChange, inputRef, onEnterNext, name }) {
        const [open, setOpen] = useState(false);
        const [highlight, setHighlight] = useState(0);
        const containerRef = useRef(null);

        useEffect(() => {
            if (!open) setHighlight(0);
        }, [open]);

        useEffect(() => {
            function handleClick(e) {
                if (!containerRef.current) return;
                if (!containerRef.current.contains(e.target)) setOpen(false);
            }
            document.addEventListener("mousedown", handleClick);
            return () => document.removeEventListener("mousedown", handleClick);
        }, []);

        function handleKeyDown(e) {
            if (e.key === " ") {
                e.preventDefault();
                setOpen(true);
                return;
            }
            if (e.key === "Enter") {
                e.preventDefault();
                if (open && options.length) {
                    const opt = options[highlight];
                    onChange(opt.value);
                    setOpen(false);
                    if (onEnterNext) onEnterNext();
                    return;
                } else {
                    if (onEnterNext) onEnterNext();
                }
            }
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setOpen(true);
                setHighlight((h) => Math.min(h + 1, options.length - 1));
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setOpen(true);
                setHighlight((h) => Math.max(h - 1, 0));
            }
        }

        return (
            <div className="relative" ref={containerRef}>
                <div
                    ref={inputRef}
                    tabIndex={0}
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={`${name}-listbox`}
                    onKeyDown={handleKeyDown}
                    onClick={() => setOpen((v) => !v)}
                    className={`w-full px-3 py-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                        open
                            ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                            : "border-slate-200 bg-white hover:border-slate-300"
                    } focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100`}
                >
                    <div className={`text-sm ${value ? "text-slate-900" : "text-slate-400"}`}>
                        {value ? options.find((o) => o.value === value)?.label || value : placeholder}
                    </div>
                    <svg
                        className={`w-4 h-4 transition-transform ${
                            open ? "rotate-180 text-indigo-500" : "text-slate-400"
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <path
                            d="M6 9l6 6 6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>

                {open && (
                    <ul
                        id={`${name}-listbox`}
                        role="listbox"
                        className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-auto"
                    >
                        {options.map((opt, i) => (
                            <li
                                key={opt.value}
                                role="option"
                                aria-selected={value === opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setOpen(false);
                                    if (onEnterNext) onEnterNext();
                                }}
                                onMouseEnter={() => setHighlight(i)}
                                className={`px-3 py-2 cursor-pointer text-sm transition-colors ${
                                    highlight === i ? "bg-indigo-50 text-indigo-700" : "bg-white text-slate-700"
                                } ${value === opt.value ? "font-medium bg-indigo-100" : ""}`}
                            >
                                {opt.label}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-9999 flex items-start justify-center bg-black/50 overflow-auto py-4" onClick={handleBackdropClick}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4">
                {/* Header */}
                <div className="bg-linear-to-r from-indigo-600 to-blue-600 px-5 py-5 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-white">Add Company</h1>
                                <p className="text-indigo-100 text-sm">Set up your business profile</p>
                            </div>
                        </div>
                        <button onClick={onCancel} className="text-white/80 hover:text-white transition-colors" type="button">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Required Fields Notice */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 px-1">
                        <span className="text-red-500">*</span>
                        <span>indicates required fields</span>
                    </div>

                    {/* Basic Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="px-4 py-3 bg-linear-to-r from-slate-50 to-white border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800">Basic Information</h3>
                                    <p className="text-xs text-slate-500">Essential details about your company</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="lg:col-span-2">
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                        Company Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        ref={setRef(0)}
                                        value={formData.companyName}
                                        onChange={handleChange("companyName")}
                                        onKeyDown={(e) => handleKeyDownGeneric(e, 0)}
                                        placeholder="Enter your company name"
                                        className={`w-full px-3 py-2 rounded-lg border transition-all text-sm ${errors.companyName ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-indigo-500"} focus:outline-none focus:ring-2 focus:ring-indigo-100`}
                                    />
                                    {errors.companyName && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{errors.companyName}</p>}
                                </div>
                                <div className="relative z-30">
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                        Business Type <span className="text-red-500">*</span>
                                    </label>
                                    <CustomSelect
                                        name="businessType"
                                        options={businessTypes}
                                        value={formData.businessType}
                                        onChange={(v) => handleChange("businessType")({ target: { value: v } })}
                                        inputRef={setRef(1)}
                                        onEnterNext={() => focusNext(1)}
                                        placeholder="Select type"
                                    />
                                    {errors.businessType && <p className="text-xs text-red-600 mt-1">{errors.businessType}</p>}
                                </div>
                                <div className="relative z-20">
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Industry Type</label>
                                    <CustomSelect
                                        name="industryType"
                                        options={industries}
                                        value={formData.industryType}
                                        onChange={(v) => handleChange("industryType")({ target: { value: v } })}
                                        inputRef={setRef(2)}
                                        onEnterNext={() => focusNext(2)}
                                        placeholder="Select industry"
                                    />
                                </div>
                                <div className="relative z-10">
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Registration Type</label>
                                    <CustomSelect
                                        name="registrationType"
                                        options={registrationOptions}
                                        value={formData.registrationType}
                                        onChange={(v) => handleChange("registrationType")({ target: { value: v } })}
                                        inputRef={setRef(3)}
                                        onEnterNext={() => focusNext(3)}
                                        placeholder="Select registration"
                                    />
                                </div>
                                {formData.registrationType !== "unregistered" && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1.5">GSTIN</label>
                                        <input
                                            ref={setRef(4)}
                                            type="text"
                                            value={formData.gstin}
                                            onChange={(e) => handleChange("gstin")({ target: { value: e.target.value.toUpperCase() } })}
                                            onKeyDown={(e) => handleKeyDownGeneric(e, 4)}
                                            placeholder="15-digit GSTIN"
                                            maxLength={15}
                                            className={`w-full px-3 py-2 rounded-lg border transition-all text-sm font-mono tracking-wider uppercase ${errors.gstin ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-indigo-500"} focus:outline-none focus:ring-2 focus:ring-indigo-100`}
                                        />
                                        {errors.gstin && <p className="text-xs text-red-600 mt-1">{errors.gstin}</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Address Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="px-4 py-3 bg-linear-to-r from-slate-50 to-white border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800">Address Information</h3>
                                    <p className="text-xs text-slate-500">Business location and mailing address</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                        Address Line 1 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        ref={setRef(5)}
                                        value={formData.addressLine1}
                                        onChange={handleChange("addressLine1")}
                                        onKeyDown={(e) => handleKeyDownGeneric(e, 5)}
                                        placeholder="Building, Street, Area"
                                        className={`w-full px-3 py-2 rounded-lg border transition-all text-sm ${errors.addressLine1 ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-indigo-500"} focus:outline-none focus:ring-2 focus:ring-indigo-100`}
                                    />
                                    {errors.addressLine1 && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{errors.addressLine1}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Address Line 2</label>
                                    <input
                                        ref={setRef(6)}
                                        value={formData.addressLine2}
                                        onChange={handleChange("addressLine2")}
                                        onKeyDown={(e) => handleKeyDownGeneric(e, 6)}
                                        placeholder="Landmark, Sub-district (Optional)"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                        Pincode <span className="text-red-500">*</span>
                                        {pincodeLoading && <span className="ml-2 text-indigo-500 font-normal">Looking up...</span>}
                                    </label>
                                    <div className="relative">
                                        <input
                                            ref={setRef(7)}
                                            value={formData.pincode}
                                            onChange={handlePincodeChange}
                                            onKeyDown={(e) => handleKeyDownGeneric(e, 7)}
                                            maxLength={6}
                                            placeholder="Enter 6-digit pincode"
                                            className={`w-full px-3 py-2 rounded-lg border transition-all text-sm ${errors.pincode || pincodeError ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-indigo-500"} focus:outline-none focus:ring-2 focus:ring-indigo-100`}
                                        />
                                        {pincodeLoading && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <svg className="animate-spin h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            </div>
                                        )}
                                        {formData.pincode.length === 6 && !pincodeLoading && !pincodeError && formData.state && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    {errors.pincode && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{errors.pincode}</p>}
                                    {pincodeError && <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{pincodeError}</p>}
                                    {formData.pincode.length === 6 && !pincodeLoading && !pincodeError && formData.state && (
                                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Location auto-filled
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                        State <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        ref={setRef(8)}
                                        value={formData.state}
                                        onChange={handleChange("state")}
                                        onKeyDown={(e) => handleKeyDownGeneric(e, 8)}
                                        placeholder={pincodeLoading ? "Loading..." : "Auto-filled from pincode"}
                                        readOnly={pincodeLoading}
                                        className={`w-full px-3 py-2 rounded-lg border transition-all text-sm ${errors.state ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-indigo-500"} ${pincodeLoading ? "bg-slate-50 text-slate-400" : "bg-white"} focus:outline-none focus:ring-2 focus:ring-indigo-100`}
                                    />
                                    {errors.state && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{errors.state}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                        City/District <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        ref={setRef(9)}
                                        value={formData.city}
                                        onChange={handleChange("city")}
                                        onKeyDown={(e) => handleKeyDownGeneric(e, 9)}
                                        placeholder={pincodeLoading ? "Loading..." : "Auto-filled from pincode"}
                                        readOnly={pincodeLoading}
                                        className={`w-full px-3 py-2 rounded-lg border transition-all text-sm ${errors.city ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-indigo-500"} ${pincodeLoading ? "bg-slate-50 text-slate-400" : "bg-white"} focus:outline-none focus:ring-2 focus:ring-indigo-100`}
                                    />
                                    {errors.city && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{errors.city}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="px-4 py-3 bg-linear-to-r from-slate-50 to-white border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800">Contact Details</h3>
                                    <p className="text-xs text-slate-500">How customers can reach you</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                        Mobile Number <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">+91</span>
                                        <input
                                            ref={setRef(10)}
                                            value={formData.mobile}
                                            onChange={handleChange("mobile")}
                                            onKeyDown={(e) => handleKeyDownGeneric(e, 10)}
                                            placeholder="Enter 10-digit mobile"
                                            maxLength={10}
                                            className={`w-full pl-11 pr-3 py-2 rounded-lg border transition-all text-sm ${errors.mobile ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-indigo-500"} focus:outline-none focus:ring-2 focus:ring-indigo-100`}
                                        />
                                    </div>
                                    {errors.mobile && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{errors.mobile}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Business Email</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </span>
                                        <input
                                            ref={setRef(11)}
                                            value={formData.email}
                                            onChange={handleChange("email")}
                                            onKeyDown={(e) => handleKeyDownGeneric(e, 11)}
                                            placeholder="company@example.com"
                                            className={`w-full pl-10 pr-3 py-2 rounded-lg border transition-all text-sm ${errors.email ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-indigo-500"} focus:outline-none focus:ring-2 focus:ring-indigo-100`}
                                        />
                                    </div>
                                    {errors.email && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{errors.email}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Error */}
                    {submitError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{submitError}</span>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="w-full sm:w-auto px-5 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 hover:border-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-slate-100"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Reset Form
                            </span>
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || pincodeLoading}
                            className="w-full sm:w-auto px-6 py-2 rounded-lg bg-linear-to-r from-indigo-600 to-blue-600 text-white text-sm font-medium shadow hover:from-indigo-700 hover:to-blue-700 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        >
                            <span className="flex items-center justify-center gap-2">
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Company...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Create Company
                                    </>
                                )}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
