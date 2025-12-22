// src/models/UserSchema.js
// User schema definition for the chat-starter database
// This is a minimal schema used just for auth purposes

const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
    name: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, required: true, unique: true },
    phone: { type: String, trim: true, default: '' },
    password: { type: String, required: true },
    isOnline: { type: Boolean, default: false },
    lastSeenAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = UserSchema;
