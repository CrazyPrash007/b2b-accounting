// src/utils/chatInvitation.js
// Utility to handle chat invitations for customers/vendors

const { getChatStarterConnection } = require('../db/mongo');
const { lookupChatUserByPhone } = require('./chatUserLookup');
const mongoose = require('mongoose');
const axios = require('axios');

const CHAT_API_URL = process.env.CHAT_API_URL || 'http://localhost:5000/api';

// Define schemas for chat system models
const MessageSchema = new mongoose.Schema({
    conversationId: { type: mongoose.Schema.Types.ObjectId, required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId },
    content: { type: String, required: true },
    contentType: { type: String, default: 'text' },
    attachmentUrl: { type: String },
    attachmentName: { type: String },
    tempId: { type: String },
    status: { type: String, default: 'sent' },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const ConversationSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    canonicalKey: { type: String, required: true, unique: true },
    messages: { type: Array, default: [] },
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const ManualContactSchema = new mongoose.Schema({
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, trim: true, required: true },
    companyName: { type: String, trim: true, default: '' },
    phoneNumbers: [{ type: String, trim: true }],
    welcomeMessage: { type: String, trim: true, default: '' }
}, { timestamps: true });

let ChatMessage = null;
let ChatConversation = null;
let ChatManualContact = null;

/**
 * Get or create chat models using the chat-starter connection
 */
function getChatModels() {
    try {
        const connection = getChatStarterConnection();
        
        if (!ChatMessage) {
            ChatMessage = connection.models['Message'] || connection.model('Message', MessageSchema);
        }
        if (!ChatConversation) {
            ChatConversation = connection.models['Conversation'] || connection.model('Conversation', ConversationSchema);
        }
        if (!ChatManualContact) {
            ChatManualContact = connection.models['ManualContact'] || connection.model('ManualContact', ManualContactSchema);
        }
        
        return { ChatMessage, ChatConversation, ChatManualContact };
    } catch (err) {
        console.error('[chatInvitation] Failed to get chat models:', err.message);
        return { ChatMessage: null, ChatConversation: null, ChatManualContact: null };
    }
}

/**
 * Handle chat invitation/message when adding a customer/vendor
 * 
 * @param {Object} options
 * @param {string} options.phoneNumber - Phone number of customer/vendor
 * @param {string} options.name - Name of customer/vendor
 * @param {string} options.companyName - Company name of customer/vendor
 * @param {string} options.ownerId - ID of the owner (inviter) from accounting system
 * @param {string} options.ownerName - Name of the owner
 * @param {string} options.type - Type: 'customer' or 'vendor'
 * @returns {Promise<{chatUserId: string|null, action: string, conversationId: string|null}>}
 */
async function handleChatInvitation({ phoneNumber, name, companyName, ownerId, ownerName, type = 'customer' }) {
    if (!phoneNumber) {
        return { chatUserId: null, action: 'no_phone', conversationId: null };
    }

    try {
        // Step 1: Check if the phone number is already registered in chat system
        const chatUser = await lookupChatUserByPhone(phoneNumber);
        
        if (chatUser) {
            // User is registered - DO NOT create manual contact invite
            console.log(`[chatInvitation] User with phone ${phoneNumber} is already registered (ID: ${chatUser.userId}), skipping manual contact creation`);
            
            // Return the chatUserId so the customer/vendor can be linked
            return {
                chatUserId: chatUser.userId,
                action: 'user_registered',
                conversationId: null
            };
        } else {
            // User is not registered - create manual contact (invitee)
            console.log(`[chatInvitation] User with phone ${phoneNumber} is not registered, creating invitee`);
            
            try {
                const result = await createInvitee({
                    ownerChatUserId: ownerId,
                    name,
                    companyName,
                    phoneNumber,
                    ownerName: ownerName || 'A business contact',
                    type
                });
                
                return {
                    chatUserId: null,
                    action: 'invitee_created',
                    conversationId: null
                };
            } catch (invErr) {
                console.error('[chatInvitation] Failed to create invitee:', invErr.message);
                return {
                    chatUserId: null,
                    action: 'invitee_failed',
                    conversationId: null
                };
            }
        }
    } catch (err) {
        console.error('[chatInvitation] Error handling chat invitation:', err.message);
        return {
            chatUserId: null,
            action: 'error',
            conversationId: null
        };
    }
}

/**
 * Send a message to a registered user notifying them they've been added
 */
async function sendAddedMessage({ ownerChatUserId, recipientChatUserId, ownerName, type }) {
    // Create message content
    const messageContent = "hii";

    try {
        // Call the chat API to send the message (this will handle socket emissions automatically)
        const response = await axios.post(`${CHAT_API_URL}/chat/messages`, {
            userId: ownerChatUserId,
            recipient_id: recipientChatUserId,
            content: messageContent,
            content_type: 'text'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': ownerChatUserId
            },
            timeout: 10000 // 10 second timeout
        });

        if (response.data && response.data.conversation) {
            console.log(`[chatInvitation] Sent message via API to ${recipientChatUserId}: "${messageContent}"`);
            return {
                conversationId: String(response.data.conversation.id),
                messageId: response.data.message?.id ? String(response.data.message.id) : null
            };
        }

        throw new Error('Invalid response from chat API');
    } catch (error) {
        console.error('[chatInvitation] Failed to send message via API:', error.message);
        
        // Fallback to direct database operation if API call fails
        console.log('[chatInvitation] Attempting fallback to direct database operation...');
        return await sendAddedMessageDirect({ ownerChatUserId, recipientChatUserId, ownerName, type });
    }
}

/**
 * Fallback method: Send message directly to database (without socket emissions)
 * This is used if the HTTP API call fails
 */
async function sendAddedMessageDirect({ ownerChatUserId, recipientChatUserId, ownerName, type }) {
    const { ChatMessage, ChatConversation } = getChatModels();
    
    if (!ChatMessage || !ChatConversation) {
        throw new Error('Chat models not available');
    }

    // Create conversation key
    const ids = [String(ownerChatUserId), String(recipientChatUserId)].sort();
    const canonicalKey = ids.join(':');

    // Create message content
    const messageContent = "hii";

    // Find or create conversation
    let conversation = await ChatConversation.findOne({ canonicalKey });
    
    if (!conversation) {
        const participantObjectIds = ids.map((id) => 
            /^[0-9a-fA-F]{24}$/.test(id) ? new mongoose.Types.ObjectId(id) : id
        );
        
        conversation = await ChatConversation.create({
            canonicalKey,
            participants: participantObjectIds,
            messages: [],
            updatedAt: new Date(),
        });
    }

    // Create message document
    const message = await ChatMessage.create({
        conversationId: conversation._id,
        sender: ownerChatUserId,
        recipient: recipientChatUserId,
        content: messageContent,
        contentType: 'text',
        status: 'sent',
    });

    // Update conversation with message
    const RECENT_KEEP = 20;
    const messageToPush = {
        _id: message._id,
        sender: message.sender,
        content: message.content,
        contentType: message.contentType,
        createdAt: message.createdAt,
        status: 'sent',
    };

    await ChatConversation.findByIdAndUpdate(conversation._id, {
        $set: { 
            lastMessage: message.content, 
            lastMessageAt: message.createdAt, 
            updatedAt: message.createdAt 
        },
        $push: { messages: { $each: [messageToPush], $slice: -RECENT_KEEP } }
    });

    console.log(`[chatInvitation] Sent message (fallback) to ${recipientChatUserId}: "${messageContent}"`);

    return {
        conversationId: String(conversation._id),
        messageId: String(message._id)
    };
}

/**
 * Create a manual contact (invitee) for unregistered user
 */
async function createInvitee({ ownerChatUserId, name, companyName, phoneNumber, ownerName, type }) {
    const { ChatManualContact } = getChatModels();
    
    if (!ChatManualContact) {
        throw new Error('ManualContact model not available');
    }

    // Create welcome message for when they join
    const welcomeMessage = `Welcome to our B2B platform! ${ownerName} has added you as a ${type}. Feel free to reach out anytime.`;

    // Check if this contact already exists
    const existing = await ChatManualContact.findOne({
        addedBy: ownerChatUserId,
        phoneNumbers: phoneNumber
    });

    if (existing) {
        console.log(`[chatInvitation] Manual contact already exists for ${phoneNumber}`);
        return {
            contactId: String(existing._id),
            isNew: false
        };
    }

    // Create new manual contact
    const contact = await ChatManualContact.create({
        addedBy: ownerChatUserId,
        name: name || 'Unknown',
        companyName: companyName || '',
        phoneNumbers: [phoneNumber],
        welcomeMessage
    });

    console.log(`[chatInvitation] Created manual contact for ${phoneNumber} (ID: ${contact._id})`);

    return {
        contactId: String(contact._id),
        isNew: true
    };
}

module.exports = {
    handleChatInvitation,
    sendAddedMessage,
    createInvitee
};
