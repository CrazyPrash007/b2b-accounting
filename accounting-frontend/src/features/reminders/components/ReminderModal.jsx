// src/features/reminders/components/ReminderModal.jsx
import React, { useState, useEffect, useContext } from "react";
import { CompanyContext } from "src/App";
import { staffApi } from "../../staff/staff.api";

// Category and subcategory mapping
const CATEGORY_SUBCATEGORIES = {
    Payment: ["Collection from Customers", "Payments to Suppliers"],
    Logistics: ["Order Receiving", "Order Delivery/Giving"],
    Service: ["Product Service/Maintenance", "Customer Follow-up Call"],
    Expenses: ["Staff Salary", "General Office Expenses"],
    General: ["Custom Tasks", "Inventory Check", "Supplier Meeting", "Staff Meeting"]
};

const CATEGORIES = Object.keys(CATEGORY_SUBCATEGORIES);

const AMOUNT_TYPES = [
    { value: "no_amount", label: "No Amount" },
    { value: "receivable", label: "Amount Receivable" },
    { value: "payable", label: "Amount Payable" }
];

const PRIORITIES = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" }
];

export default function ReminderModal({ isOpen, onClose, onSave, editData }) {
    const { selectedCompany } = useContext(CompanyContext);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("General");
    const [subCategory, setSubCategory] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [amountType, setAmountType] = useState("no_amount");
    const [amount, setAmount] = useState(0);
    const [priority, setPriority] = useState("medium");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [staffList, setStaffList] = useState([]);
    const [loadingStaff, setLoadingStaff] = useState(false);

    // Fetch staff list when modal opens
    useEffect(() => {
        if (isOpen && selectedCompany) {
            setLoadingStaff(true);
            staffApi.getActiveList({ accountCompanyName: selectedCompany })
                .then((response) => {
                    if (response.success) {
                        setStaffList(response.data);
                    }
                })
                .catch((err) => {
                    console.error("Error fetching staff list:", err);
                })
                .finally(() => {
                    setLoadingStaff(false);
                });
        }
    }, [isOpen, selectedCompany?.name]);

    // Reset form when modal opens/closes or editData changes
    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setTitle(editData.title || "");
                setDescription(editData.description || "");
                setCategory(editData.category || "General");
                setSubCategory(editData.subCategory || "");
                setDueDate(editData.dueDate ? new Date(editData.dueDate).toISOString().split('T')[0] : "");
                setAssignedTo(editData.assignedTo || "");
                setAmountType(editData.amountType || "no_amount");
                setAmount(editData.amount || 0);
                setPriority(editData.priority || "medium");
            } else {
                // Reset for new reminder
                setTitle("");
                setDescription("");
                setCategory("General");
                setSubCategory("");
                setDueDate(new Date().toISOString().split('T')[0]);
                setAssignedTo("");
                setAmountType("no_amount");
                setAmount(0);
                setPriority("medium");
            }
            setError("");
        }
    }, [isOpen, editData]);

    // Update subcategory options when category changes
    useEffect(() => {
        const subcategories = CATEGORY_SUBCATEGORIES[category] || [];
        if (!subcategories.includes(subCategory)) {
            setSubCategory(subcategories[0] || "");
        }
    }, [category]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!title.trim()) {
            setError("Reminder Title: Please enter a title.");
            return;
        }

        if (!dueDate) {
            setError("Due Date: Please select a due date.");
            return;
        }

        setSaving(true);

        try {
            const payload = {
                title: title.trim(),
                description: description.trim(),
                category,
                subCategory,
                dueDate: new Date(dueDate).toISOString(),
                assignedTo,
                amountType,
                amount: amountType === "no_amount" ? 0 : Number(amount) || 0,
                priority
            };

            if (editData) {
                payload.id = editData.id || editData._id;
            }

            await onSave(payload, !!editData);
            onClose();
        } catch (err) {
            const fields = err?.response?.data?.error?.fields;
            if (fields && Array.isArray(fields) && fields.length > 0) {
                setError(fields.map(f => `${f.field}: ${f.message}`).join("\n"));
            } else {
                setError(err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || "Failed to save reminder. Please check all required fields and try again.");
            }
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const subcategories = CATEGORY_SUBCATEGORIES[category] || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-xl font-semibold text-purple-700">
                        {editData ? "Edit Reminder" : "Add New Reminder"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm" role="alert">
                            {error.includes("\n") ? (
                                <ul className="list-disc pl-4 space-y-0.5">
                                    {error.split("\n").map((msg, i) => <li key={i}>{msg}</li>)}
                                </ul>
                            ) : (
                                error
                            )}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reminder Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Collect payment from ABC Suppliers"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description (Optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add details about this reminder..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                    </div>

                    {/* Category and Subcategory */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subcategory
                            </label>
                            <select
                                value={subCategory}
                                onChange={(e) => setSubCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            >
                                {subcategories.map((sub) => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Due Date and Assigned To */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Due Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Assign to Staff
                            </label>
                            <select
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                                disabled={loadingStaff}
                            >
                                <option value="">
                                    {loadingStaff ? "Loading staff..." : "-- Select Staff --"}
                                </option>
                                {staffList.map((staff) => (
                                    <option key={staff._id} value={staff.name}>
                                        {staff.name}{staff.designation ? ` (${staff.designation})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Amount Type and Amount */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount Type
                            </label>
                            <select
                                value={amountType}
                                onChange={(e) => setAmountType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            >
                                {AMOUNT_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount (₹)
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="0"
                                step="0.01"
                                disabled={amountType === "no_amount"}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${amountType === "no_amount" ? "bg-gray-100 cursor-not-allowed" : ""}`}
                            />
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Priority
                        </label>
                        <div className="flex gap-4">
                            {PRIORITIES.map((p) => (
                                <label key={p.value} className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="priority"
                                        value={p.value}
                                        checked={priority === p.value}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="mr-2"
                                    />
                                    <span className={`text-sm ${p.value === "high" ? "text-red-600" :
                                        p.value === "medium" ? "text-yellow-600" :
                                            "text-green-600"
                                        }`}>
                                        {p.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : (editData ? "Update Reminder" : "Add Reminder")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
