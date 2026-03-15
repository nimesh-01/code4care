const mongoose = require('mongoose');

async function connectDb() {
    if (!process.env.MONGO_URL) {
        throw new Error('MONGO_URL env variable is missing');
    }

    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Event Service DB connected successfully');
    } catch (err) {
        console.error('Event Service DB connection failed', err);
        throw err;
    }
}

module.exports = connectDb;
