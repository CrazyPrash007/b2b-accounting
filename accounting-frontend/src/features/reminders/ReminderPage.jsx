// src/features/reminders/ReminderPage.jsx
import React, { useState, useContext } from "react";
import useReminder from "./hooks/useReminder";
import ReminderModal from "./components/ReminderModal";
import { CompanyContext } from "src/App";
import apiClient from "src/services/apiClient";

// Category colors
const CATEGORY_COLORS = {
    Payment: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", badge: "bg-green-100 text-green-800" },
    Logistics: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-800" },
    Service: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", badge: "bg-orange-100 text-orange-800" },
    Expenses: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-800" },
    General: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", badge: "bg-purple-100 text-purple-800" }
};

const PRIORITY_STYLES = {
    high: { dot: "bg-red-500", text: "text-red-600" },
    medium: { dot: "bg-yellow-500", text: "text-yellow-600" },
    low: { dot: "bg-green-500", text: "text-green-600" }
};

const STATUS_STYLES = {
    pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
    in_progress: { bg: "bg-blue-100", text: "text-blue-800" },
    completed: { bg: "bg-green-100", text: "text-green-800" },
    cancelled: { bg: "bg-gray-100", text: "text-gray-800" }
};

function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function isOverdue(dateStr, status) {
    if (status === "completed" || status === "cancelled") return false;
    return new Date(dateStr) < new Date();
}

function formatAmount(amount, amountType) {
    if (amountType === "no_amount" || !amount) return null;
    const formatted = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
    return { value: formatted, type: amountType === "receivable" ? "Receivable" : "Payable" };
}

export default function ReminderPage() {
    const context = useContext(CompanyContext);
    const selectedCompany = context?.selectedCompany || "";
    const { rows: reminders = [], meta = {}, reload, create, update, remove } = useReminder();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReminder, setEditingReminder] = useState(null);
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    const handleOpenModal = (reminder = null) => {
        setEditingReminder(reminder);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingReminder(null);
    };

    const handleSaveReminder = async (data, isEdit) => {
        if (isEdit) {
            await update(data.id, data);
        } else {
            await create(data);
        }
        reload();
    };

    const handleDeleteReminder = async (id) => {
        if (window.confirm("Are you sure you want to delete this reminder?")) {
            await remove(id);
            reload();
        }
    };

    const handleToggleStatus = async (reminder, newStatus) => {
        try {
            await apiClient.patch(`/api/reminders/${reminder._id || reminder.id}/status`, {
                accountCompanyName: selectedCompany,
                status: newStatus
            });
            reload();
        } catch (err) {
            console.error("Failed to update status:", err);
        }
    };

    // Feedback modal state
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [feedbackReminder, setFeedbackReminder] = useState(null);
    const [feedbackText, setFeedbackText] = useState("");
    const [savingFeedback, setSavingFeedback] = useState(false);

    const handleOpenFeedback = (reminder) => {
        setFeedbackReminder(reminder);
        setFeedbackText(reminder.latestFeedback || "");
        setFeedbackModalOpen(true);
    };

    const handleSaveFeedback = async () => {
        if (!feedbackReminder || !feedbackText.trim()) return;
        setSavingFeedback(true);
        try {
            await apiClient.patch(`/api/reminders/${feedbackReminder._id || feedbackReminder.id}/feedback`, {
                accountCompanyName: selectedCompany,
                feedback: feedbackText.trim()
            });
            reload();
            setFeedbackModalOpen(false);
            setFeedbackReminder(null);
            setFeedbackText("");
        } catch (err) {
            console.error("Failed to save feedback:", err);
        } finally {
            setSavingFeedback(false);
        }
    };

    // Filter reminders
    const filteredReminders = reminders.filter((r) => {
        if (filterCategory !== "all" && r.category !== filterCategory) return false;
        if (filterStatus !== "all" && r.status !== filterStatus) return false;
        if (searchTerm && !r.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    // Group by status for display
    const overdueReminders = filteredReminders.filter(r => isOverdue(r.dueDate, r.status));
    const pendingReminders = filteredReminders.filter(r => r.status === "pending" && !isOverdue(r.dueDate, r.status));
    const inProgressReminders = filteredReminders.filter(r => r.status === "in_progress");
    const completedReminders = filteredReminders.filter(r => r.status === "completed");

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Reminders</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage your tasks, follow-ups, and scheduled activities
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                    <span className="text-xl leading-none">+</span>
                    Add Reminder
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-gray-800">{meta.total || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
                    <p className="text-sm text-gray-500">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">{meta.overdue || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{meta.pending || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
                    <p className="text-sm text-gray-500">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{meta.inProgress || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{meta.completed || 0}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Search reminders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[200px]"
                />
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                    <option value="all">All Categories</option>
                    <option value="Payment">Payment</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Service">Service</option>
                    <option value="Expenses">Expenses</option>
                    <option value="General">General</option>
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {/* Reminders Grid */}
            {filteredReminders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-medium text-gray-700">No reminders found</h3>
                    <p className="text-gray-500 mt-1">Create your first reminder to get started</p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Add Reminder
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Overdue Section */}
                    {overdueReminders.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
                                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                                Overdue ({overdueReminders.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {overdueReminders.map((reminder) => (
                                    <ReminderCard
                                        key={reminder._id || reminder.id}
                                        reminder={reminder}
                                        onEdit={() => handleOpenModal(reminder)}
                                        onDelete={() => handleDeleteReminder(reminder._id || reminder.id)}
                                        onStatusChange={(status) => handleToggleStatus(reminder, status)}
                                        onFeedback={() => handleOpenFeedback(reminder)}
                                        isOverdue={true}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pending Section */}
                    {pendingReminders.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-yellow-600 mb-3">
                                Pending ({pendingReminders.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pendingReminders.map((reminder) => (
                                    <ReminderCard
                                        key={reminder._id || reminder.id}
                                        reminder={reminder}
                                        onEdit={() => handleOpenModal(reminder)}
                                        onDelete={() => handleDeleteReminder(reminder._id || reminder.id)}
                                        onStatusChange={(status) => handleToggleStatus(reminder, status)}
                                        onFeedback={() => handleOpenFeedback(reminder)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* In Progress Section */}
                    {inProgressReminders.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-blue-600 mb-3">
                                In Progress ({inProgressReminders.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {inProgressReminders.map((reminder) => (
                                    <ReminderCard
                                        key={reminder._id || reminder.id}
                                        reminder={reminder}
                                        onEdit={() => handleOpenModal(reminder)}
                                        onDelete={() => handleDeleteReminder(reminder._id || reminder.id)}
                                        onStatusChange={(status) => handleToggleStatus(reminder, status)}
                                        onFeedback={() => handleOpenFeedback(reminder)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Completed Section */}
                    {completedReminders.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-green-600 mb-3">
                                Completed ({completedReminders.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {completedReminders.map((reminder) => (
                                    <ReminderCard
                                        key={reminder._id || reminder.id}
                                        reminder={reminder}
                                        onEdit={() => handleOpenModal(reminder)}
                                        onDelete={() => handleDeleteReminder(reminder._id || reminder.id)}
                                        onStatusChange={(status) => handleToggleStatus(reminder, status)}
                                        onFeedback={() => handleOpenFeedback(reminder)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            <ReminderModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveReminder}
                editData={editingReminder}
            />

            {/* Feedback Modal */}
            {feedbackModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h2 className="text-lg font-semibold text-purple-700">
                                Add Feedback
                            </h2>
                            <button
                                onClick={() => setFeedbackModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-500 mb-2">
                                Reminder: <span className="font-medium text-gray-700">{feedbackReminder?.title}</span>
                            </p>
                            <textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Enter your latest feedback or update..."
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setFeedbackModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveFeedback}
                                    disabled={savingFeedback || !feedbackText.trim()}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {savingFeedback ? "Saving..." : "Save Feedback"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ============ Reminder Card Component ============ */
function ReminderCard({ reminder, onEdit, onDelete, onStatusChange, onFeedback, isOverdue }) {
    const colors = CATEGORY_COLORS[reminder.category] || CATEGORY_COLORS.General;
    const priorityStyle = PRIORITY_STYLES[reminder.priority] || PRIORITY_STYLES.medium;
    const statusStyle = STATUS_STYLES[reminder.status] || STATUS_STYLES.pending;
    const amountInfo = formatAmount(reminder.amount, reminder.amountType);

    return (
        <div className={`rounded-xl shadow-sm border-2 overflow-hidden transition-all hover:shadow-md ${isOverdue ? "border-red-300 bg-red-50" : `${colors.border} ${colors.bg}`
            }`}>
            {/* Card Header */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className={`font-semibold text-gray-800 line-clamp-2 ${reminder.status === "completed" ? "line-through opacity-60" : ""}`}>
                        {reminder.title}
                    </h3>
                    <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${priorityStyle.dot}`} title={`${reminder.priority} priority`}></span>
                    </div>
                </div>

                {reminder.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{reminder.description}</p>
                )}

                {/* Category & Subcategory */}
                <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                        {reminder.category}
                    </span>
                    {reminder.subCategory && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {reminder.subCategory}
                        </span>
                    )}
                </div>

                {/* Due Date */}
                <div className={`flex items-center gap-2 text-sm ${isOverdue ? "text-red-600 font-medium" : "text-gray-600"}`}>
                    <span>📅</span>
                    <span>{formatDate(reminder.dueDate)}</span>
                    {isOverdue && <span className="text-xs">(Overdue)</span>}
                </div>

                {/* Assigned To */}
                {reminder.assignedTo && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <span>👤</span>
                        <span>{reminder.assignedTo}</span>
                    </div>
                )}

                {/* Amount */}
                {amountInfo && (
                    <div className={`flex items-center gap-2 text-sm mt-2 font-medium ${reminder.amountType === "receivable" ? "text-green-600" : "text-red-600"
                        }`}>
                        <span>💰</span>
                        <span>{amountInfo.value} ({amountInfo.type})</span>
                    </div>
                )}

                {/* Latest Feedback */}
                {reminder.latestFeedback && (
                    <div className="mt-3 p-2 bg-white/70 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-1 text-xs text-purple-600 font-medium mb-1">
                            <span>💬</span>
                            <span>Latest Feedback</span>
                            {reminder.feedbackUpdatedAt && (
                                <span className="text-gray-400 font-normal">
                                    • {formatDate(reminder.feedbackUpdatedAt)}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{reminder.latestFeedback}</p>
                    </div>
                )}
            </div>

            {/* Card Footer */}
            <div className="px-4 py-3 bg-white/50 border-t flex items-center justify-between">
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                    {reminder.status.replace("_", " ").toUpperCase()}
                </span>
                <div className="flex items-center gap-2">
                    {reminder.status !== "completed" && (
                        <button
                            onClick={() => onStatusChange("completed")}
                            className="text-green-600 hover:text-green-700 text-sm"
                            title="Mark as completed"
                        >
                            ✓
                        </button>
                    )}
                    {reminder.status === "pending" && (
                        <button
                            onClick={() => onStatusChange("in_progress")}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                            title="Start working"
                        >
                            ▶
                        </button>
                    )}
                    <button
                        onClick={onFeedback}
                        className="text-purple-500 hover:text-purple-700 text-sm"
                        title="Add Feedback"
                    >
                        💬
                    </button>
                    <button
                        onClick={onEdit}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                        title="Edit"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={onDelete}
                        className="text-red-500 hover:text-red-700 text-sm"
                        title="Delete"
                    >
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    );
}
