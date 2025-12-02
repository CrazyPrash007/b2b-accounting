// src/db/mongo.js
const mongoose = require('mongoose');

async function connect(uri) {
    if (!uri) throw new Error('MONGO_URI not provided');
    await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
}

function getSession() {
    return mongoose.startSession();
}

module.exports = { connect, getSession, mongoose };
