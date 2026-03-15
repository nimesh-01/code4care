const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI env variable is missing');
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        throw error;
    }
};

module.exports = connectDB;
