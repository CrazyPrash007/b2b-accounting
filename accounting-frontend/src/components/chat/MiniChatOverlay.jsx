// MiniChatOverlay.jsx - A compact chat overlay that appears on the right side
import React, { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

// Chat backend URL (b2b-fullstack backend)
const CHAT_API_BASE = import.meta.env.VITE_CHAT_API_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

// Default user avatar
const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

/**
 * Get current user's chat token from localStorage
 * Format: "proto-token:<userId>"
 */
function getChatToken() {
    try {
        return localStorage.getItem("chatToken") || localStorage.getItem("token") || null;
    } catch {
        return null;
    }
}

/**
 * Extract userId from token
 */
function extractUserId(token) {
    if (!token) return null;
    const match = String(token).match(/proto-token:([0-9a-fA-F]{24})$/);
    return match ? match[1] : null;
}

/**
 * Build headers for chat API requests
 */
function buildChatHeaders() {
    const token = getChatToken();
    const headers = { "Content-Type": "application/json" };
    if (token) {
        headers["Authorization"] = token;
        const userId = extractUserId(token);
        if (userId) {
            headers["X-User-Id"] = userId;
            headers["user-id"] = userId;
        }
    }
    return headers;
}

/**
 * Normalize message to consistent shape
 */
function normalizeMessage(m, currentUserId) {
    if (!m) return null;
    
    const id = m._id || m.id || String(Date.now());
    const senderId = m.senderId || m.sender?._id || m.sender?.id || m.sender || null;
    const createdAt = m.createdAt || m.created_at || new Date().toISOString();
    const text = m.body || m.text || m.content || "";
    
    return {
        id,
        body: text,
        text,
        senderId: String(senderId),
        from: String(senderId) === String(currentUserId) ? "me" : "them",
        createdAt,
        time: new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: m.status || "sent",
        readAt: m.readAt || null,
    };
}

/**
 * MiniChatOverlay Component
 * A compact chat window that appears anchored to the top-right corner
 */
export default function MiniChatOverlay({ 
    isOpen, 
    onClose, 
    partnerId,       // Chat user ID of the partner
    partnerName,     // Display name
    partnerAvatar,   // Avatar URL (optional)
    conversationId,  // Pre-existing conversation ID (optional)
}) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [chatId, setChatId] = useState(conversationId || null);
    
    const scrollRef = useRef(null);
    const socketRef = useRef(null);
    const overlayRef = useRef(null);
    
    const currentUserId = extractUserId(getChatToken());
    
    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        
        function handleClickOutside(e) {
            if (overlayRef.current && !overlayRef.current.contains(e.target)) {
                onClose();
            }
        }
        
        // Small delay to prevent immediate close on open
        const timer = setTimeout(() => {
            document.addEventListener("mousedown", handleClickOutside);
        }, 100);
        
        return () => {
            clearTimeout(timer);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);
    
    // Scroll to bottom helper
    const scrollToBottom = useCallback((behavior = "auto") => {
        requestAnimationFrame(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
            }
        });
    }, []);
    
    // Initialize socket connection
    useEffect(() => {
        if (!isOpen || !currentUserId) return;
        
        const token = getChatToken();
        if (!token) return;
        
        const socket = io(SOCKET_URL, {
            autoConnect: false,
            transports: ["websocket"],
        });
        
        socketRef.current = socket;
        
        socket.on("connect", () => {
            console.log("[MiniChat] Socket connected");
            socket.emit("identify", currentUserId);
        });
        
        socket.on("message:new", (payload) => {
            if (!payload || !chatId) return;
            const msgChatId = payload.conversation?.id || payload.chatId;
            if (String(msgChatId) !== String(chatId)) return;
            
            const normalized = normalizeMessage(payload.message, currentUserId);
            if (!normalized) return;
            
            setMessages((prev) => {
                if (prev.some((m) => String(m.id) === String(normalized.id))) return prev;
                return [...prev, normalized].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            });
            scrollToBottom("smooth");
        });
        
        socket.on("message:ack", (payload) => {
            if (!payload || !chatId) return;
            const msgChatId = payload.conversation?.id || payload.chatId;
            if (String(msgChatId) !== String(chatId)) return;
            
            const normalized = normalizeMessage(payload.message, currentUserId);
            const tempId = payload.tempId;
            
            if (tempId) {
                setMessages((prev) => 
                    prev.map((m) => m.id === tempId ? { ...normalized, id: normalized.id } : m)
                );
            }
        });
        
        socket.on("message:read", (payload) => {
            if (!payload || !chatId) return;
            if (String(payload.chatId) !== String(chatId)) return;
            
            setMessages((prev) =>
                prev.map((m) => {
                    if (payload.messageIds?.includes(m.id)) {
                        return { ...m, status: "read" };
                    }
                    return m;
                })
            );
        });
        
        socket.connect();
        
        return () => {
            socket.removeAllListeners();
            socket.disconnect();
            socketRef.current = null;
        };
    }, [isOpen, currentUserId, chatId, scrollToBottom]);
    
    // Fetch or create conversation and load messages
    useEffect(() => {
        if (!isOpen || !partnerId || !currentUserId) return;
        
        let mounted = true;
        
        async function loadChat() {
            setLoading(true);
            setError(null);
            
            try {
                // First, try to open/ensure the conversation
                const openRes = await fetch(`${CHAT_API_BASE}/conversations/open`, {
                    method: "POST",
                    headers: buildChatHeaders(),
                    body: JSON.stringify({ partnerId }),
                });
                
                if (!openRes.ok) {
                    // Fallback: try to find existing conversation via contacts
                    const contactsRes = await fetch(`${CHAT_API_BASE}/contacts?userId=${currentUserId}`, {
                        headers: buildChatHeaders(),
                    });
                    
                    if (contactsRes.ok) {
                        const contactsData = await contactsRes.json();
                        const existingContact = (contactsData.contacts || []).find(
                            (c) => String(c.id) === String(partnerId)
                        );
                        
                        if (existingContact?.conversationId) {
                            if (!mounted) return;
                            setChatId(existingContact.conversationId);
                            
                            // Fetch messages for existing conversation
                            const msgRes = await fetch(`${CHAT_API_BASE}/conversations/${existingContact.conversationId}`, {
                                headers: buildChatHeaders(),
                            });
                            
                            if (msgRes.ok) {
                                const msgData = await msgRes.json();
                                if (!mounted) return;
                                const normalized = (msgData.messages || [])
                                    .map((m) => normalizeMessage(m, currentUserId))
                                    .filter(Boolean)
                                    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                                setMessages(normalized);
                                scrollToBottom();
                            }
                        } else {
                            // No existing conversation, prepare for first message
                            if (!mounted) return;
                            setMessages([]);
                        }
                    }
                } else {
                    const data = await openRes.json();
                    if (!mounted) return;
                    
                    setChatId(data.conversation?.id || data.conversationId);
                    
                    const normalized = (data.messages || [])
                        .map((m) => normalizeMessage(m, currentUserId))
                        .filter(Boolean)
                        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                    setMessages(normalized);
                    scrollToBottom();
                }
            } catch (err) {
                console.error("[MiniChat] Load error:", err);
                if (!mounted) return;
                setError("Failed to load chat");
            } finally {
                if (mounted) setLoading(false);
            }
        }
        
        loadChat();
        
        return () => { mounted = false; };
    }, [isOpen, partnerId, currentUserId, scrollToBottom]);
    
    // Send message
    async function handleSend(e) {
        if (e) e.preventDefault();
        const trimmed = (text || "").trim();
        if (!trimmed || !partnerId) return;
        
        const tempId = `temp-${Date.now()}`;
        const optimistic = {
            id: tempId,
            body: trimmed,
            text: trimmed,
            senderId: currentUserId,
            from: "me",
            createdAt: new Date().toISOString(),
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: "sending",
        };
        
        setMessages((prev) => [...prev, optimistic]);
        setText("");
        scrollToBottom("smooth");
        
        try {
            const payload = {
                content: trimmed,
                content_type: "text",
                temp_id: tempId,
            };
            
            if (chatId) {
                payload.conversation_id = chatId;
            } else {
                payload.recipient_id = partnerId;
            }
            
            const res = await fetch(`${CHAT_API_BASE}/chat/messages`, {
                method: "POST",
                headers: buildChatHeaders(),
                body: JSON.stringify(payload),
            });
            
            if (!res.ok) {
                throw new Error("Failed to send message");
            }
            
            const data = await res.json();
            
            // Update chatId if this was the first message
            if (!chatId && data.conversation?.id) {
                setChatId(data.conversation.id);
            }
            
            // Replace temp message with server response
            const serverMsg = normalizeMessage(data.message, currentUserId);
            setMessages((prev) => 
                prev.map((m) => m.id === tempId ? serverMsg : m)
            );
            
        } catch (err) {
            console.error("[MiniChat] Send error:", err);
            setMessages((prev) => 
                prev.map((m) => m.id === tempId ? { ...m, status: "failed" } : m)
            );
        }
    }
    
    // Status icon component
    function StatusIcon({ status }) {
        if (status === "sending") return <span className="text-xs opacity-60">…</span>;
        if (status === "failed") return <span className="text-xs text-red-500">!</span>;
        if (status === "sent") return <span className="text-xs">✓</span>;
        if (status === "delivered") return <span className="text-xs">✓✓</span>;
        return <span className="text-xs text-sky-500">✓✓</span>; // read
    }
    
    if (!isOpen) return null;
    
    return (
        <>
            {/* Backdrop for click-outside detection */}
            <div className="fixed inset-0 z-40" onClick={onClose} />
            
            {/* Chat overlay panel - positioned at top-right */}
            <div
                ref={overlayRef}
                className="fixed z-50 bg-white shadow-2xl rounded-xl border border-gray-200 flex flex-col overflow-hidden"
                style={{
                    top: 60,
                    right: 24,
                    width: "min(50vw, 480px)",
                    height: "min(50vh, 500px)",
                    minWidth: 320,
                    minHeight: 350,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
                    <img
                        src={partnerAvatar || DEFAULT_AVATAR}
                        alt={partnerName || "User"}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                    />
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                            {partnerName || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500">Chat</div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                        title="Close"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                {/* Messages area */}
                <div 
                    ref={scrollRef} 
                    className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50"
                >
                    {loading && (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                        </div>
                    )}
                    
                    {error && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-red-500 text-sm">{error}</div>
                        </div>
                    )}
                    
                    {!loading && !error && messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="text-sm">No messages yet</span>
                            <span className="text-xs mt-1">Send a message to start the conversation</span>
                        </div>
                    )}
                    
                    {!loading && !error && messages.map((m) => {
                        const isMe = m.from === "me" || String(m.senderId) === String(currentUserId);
                        
                        return (
                            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] flex ${isMe ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>
                                    <div
                                        className={`inline-block px-3 py-2 rounded-2xl text-sm ${
                                            isMe 
                                                ? "bg-indigo-600 text-white rounded-br-md" 
                                                : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
                                        }`}
                                    >
                                        {m.text || m.body}
                                    </div>
                                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                        <div className="text-[10px] text-gray-400 whitespace-nowrap flex items-center gap-0.5">
                                            <span>{m.time}</span>
                                            {isMe && <StatusIcon status={m.status} />}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* Composer */}
                <form onSubmit={handleSend} className="px-3 py-2 border-t border-gray-100 bg-white flex items-center gap-2">
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 rounded-full px-4 py-2 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!text.trim()}
                        className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Send
                    </button>
                </form>
            </div>
        </>
    );
}
