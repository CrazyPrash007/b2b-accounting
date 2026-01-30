// src/models/Reminder.js
const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
    // Owner of this reminder
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    // Account company context
    accountCompanyName: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },

    // Reminder details
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },

    // Category and subcategory
    category: {
        type: String,
        enum: ['Payment', 'Logistics', 'Service', 'Expenses', 'General'],
        required: true,
        index: true
    },
    subCategory: { type: String, trim: true, default: '' },

    // Due date
    dueDate: { type: Date, required: true, index: true },

    // Staff assignment
    assignedTo: { type: String, trim: true, default: '' },

    // Amount details
    amountType: {
        type: String,
        enum: ['no_amount', 'receivable', 'payable'],
        default: 'no_amount'
    },
    amount: { type: Number, default: 0 },

    // Status
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
        default: 'pending',
        index: true
    },

    // Priority
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },

    // Completion tracking
    completedAt: { type: Date },
    completedBy: { type: mongoose.Schema.Types.ObjectId },

    // Notes/Comments when completing
    completionNote: { type: String, trim: true, default: '' },

    // Latest feedback - user can add updates/notes anytime
    latestFeedback: { type: String, trim: true, default: '' },
    feedbackUpdatedAt: { type: Date },
    feedbackUpdatedBy: { type: mongoose.Schema.Types.ObjectId },

    // Meta fields
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId },
    updatedBy: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

// Compound indexes
ReminderSchema.index({ ownerId: 1, accountCompanyName: 1, isDeleted: 1 });
ReminderSchema.index({ ownerId: 1, dueDate: 1, status: 1 });
ReminderSchema.index({ ownerId: 1, category: 1, status: 1 });

module.exports = mongoose.model('Reminder', ReminderSchema);
