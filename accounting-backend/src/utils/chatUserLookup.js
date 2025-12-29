// src/utils/chatUserLookup.js
// Utility to lookup users from the chat-starter database by phone number

const { getChatStarterConnection } = require('../db/mongo');
const mongoose = require('mongoose');

// Define the User schema (mirror of chat-starter's User model)
const ChatUserSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    avatar: String,
}, { collection: 'users' });

let ChatUserModel = null;

/**
 * Get or create the ChatUser model using the chat-starter connection
 */
function getChatUserModel() {
    if (ChatUserModel) return ChatUserModel;
    
    try {
        const connection = getChatStarterConnection();
        // Check if model already exists to avoid OverwriteModelError
        ChatUserModel = connection.models['ChatUser'] || connection.model('ChatUser', ChatUserSchema);
        return ChatUserModel;
    } catch (err) {
        console.error('[chatUserLookup] Failed to get ChatUser model:', err.message);
        return null;
    }
}

/**
 * Normalize phone number for comparison
 * Removes spaces, dashes, and handles country codes
 */
function normalizePhone(phone) {
    if (!phone) return null;
    // Remove all non-digit characters except leading +
    let normalized = String(phone).trim().replace(/[^\d+]/g, '');
    // Remove leading + if present
    if (normalized.startsWith('+')) {
        normalized = normalized.slice(1);
    }
    // Remove country code if starts with 91 (India) and has 12+ digits
    if (normalized.startsWith('91') && normalized.length >= 12) {
        normalized = normalized.slice(2);
    }
    // Return last 10 digits for Indian numbers
    if (normalized.length >= 10) {
        return normalized.slice(-10);
    }
    return normalized;
}

/**
 * Lookup a user in the chat-starter database by phone number
 * @param {string} phoneNumber - The phone number to search for
 * @returns {Promise<{userId: string, name: string, email: string} | null>}
 */
async function lookupChatUserByPhone(phoneNumber) {
    if (!phoneNumber) return null;
    
    const normalizedInput = normalizePhone(phoneNumber);
    if (!normalizedInput || normalizedInput.length < 10) return null;
    
    try {
        const ChatUser = getChatUserModel();
        if (!ChatUser) {
            console.warn('[chatUserLookup] ChatUser model not available');
            return null;
        }
        
        // Search for user with matching phone (try multiple formats)
        const searchPatterns = [
            phoneNumber,                          // Exact match
            normalizedInput,                      // Normalized (10 digits)
            `+91${normalizedInput}`,              // With India country code
            `91${normalizedInput}`,               // With country code no +
        ];
        
        const user = await ChatUser.findOne({
            $or: searchPatterns.map(p => ({ phone: p }))
        }).select('_id name email phone avatar').lean();
        
        if (user) {
            console.log(`[chatUserLookup] Found registered user for phone ${phoneNumber}: ${user._id}`);
            return {
                userId: String(user._id),
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                avatar: user.avatar || null,
            };
        }
        
        // Also try regex match for last 10 digits
        const regexUser = await ChatUser.findOne({
            phone: { $regex: normalizedInput + '$' }
        }).select('_id name email phone avatar').lean();
        
        if (regexUser) {
            console.log(`[chatUserLookup] Found registered user (regex) for phone ${phoneNumber}: ${regexUser._id}`);
            return {
                userId: String(regexUser._id),
                name: regexUser.name || '',
                email: regexUser.email || '',
                phone: regexUser.phone || '',
                avatar: regexUser.avatar || null,
            };
        }
        
        console.log(`[chatUserLookup] No registered user found for phone ${phoneNumber}`);
        return null;
    } catch (err) {
        console.error('[chatUserLookup] Error looking up user:', err.message);
        return null;
    }
}

/**
 * Lookup multiple users by phone numbers (batch operation)
 * @param {string[]} phoneNumbers - Array of phone numbers
 * @returns {Promise<Map<string, {userId: string, name: string}>>} - Map of phone -> user info
 */
async function lookupChatUsersByPhones(phoneNumbers) {
    const results = new Map();
    
    if (!phoneNumbers || phoneNumbers.length === 0) return results;
    
    try {
        const ChatUser = getChatUserModel();
        if (!ChatUser) return results;
        
        // Build all possible search patterns
        const allPatterns = [];
        const phoneToNormalized = new Map();
        
        for (const phone of phoneNumbers) {
            const normalized = normalizePhone(phone);
            if (normalized && normalized.length >= 10) {
                phoneToNormalized.set(phone, normalized);
                allPatterns.push(
                    { phone },
                    { phone: normalized },
                    { phone: `+91${normalized}` },
                    { phone: `91${normalized}` },
                    { phone: { $regex: normalized + '$' } }
                );
            }
        }
        
        if (allPatterns.length === 0) return results;
        
        const users = await ChatUser.find({
            $or: allPatterns
        }).select('_id name email phone avatar').lean();
        
        // Map found users back to original phone numbers
        for (const user of users) {
            const userPhoneNorm = normalizePhone(user.phone);
            
            for (const [originalPhone, normalized] of phoneToNormalized.entries()) {
                if (userPhoneNorm === normalized) {
                    results.set(originalPhone, {
                        userId: String(user._id),
                        name: user.name || '',
                        email: user.email || '',
                        phone: user.phone || '',
                        avatar: user.avatar || null,
                    });
                    break;
                }
            }
        }
        
        return results;
    } catch (err) {
        console.error('[chatUserLookup] Error in batch lookup:', err.message);
        return results;
    }
}

module.exports = {
    lookupChatUserByPhone,
    lookupChatUsersByPhones,
    normalizePhone,
};
