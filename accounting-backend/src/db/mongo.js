// src/db/mongo.js
const mongoose = require("mongoose");

let accountingConnection = null;
let chatStarterConnection = null;

async function connect(uri) {
    if (!uri) throw new Error("MONGO_URI not provided");

    accountingConnection = await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    console.log("Accounting DB connected");
}

/**
 * Initialize Chat-Starter DB connection
 */
async function connectChatStarter(uri) {
    if (!uri) throw new Error("CHAT_STARTER_MONGO_URI not provided");

    if (chatStarterConnection) return chatStarterConnection;

    chatStarterConnection = await mongoose.createConnection(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    console.log("Chat-Starter DB connected");

    return chatStarterConnection;
}

/**
 * Safely provide Chat-Starter connection when models request it
 */
function getChatStarterConnection() {
    if (!chatStarterConnection) {
        throw new Error("❌ chatStarterConnection not initialized. Call connectChatStarter() first.");
    }
    return chatStarterConnection;
}

function getSession() {
    return mongoose.startSession();
}

module.exports = {
    connect,
    connectChatStarter,
    getChatStarterConnection,
    getSession,
    mongoose,
};
