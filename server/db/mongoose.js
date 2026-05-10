const mongoose = require('mongoose');

let mongoURI = process.env.MONGODB_URI;

const getURI = async () => {
    if (!mongoURI) {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        mongoURI = mongoServer.getUri();
        console.log('📦 Using In-Memory MongoDB');
    }
    return mongoURI;
};

const connectDB = async (uri) => {
    try {
        const conn = await mongoose.connect(uri);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    }
};

module.exports = { connectDB, getURI };
