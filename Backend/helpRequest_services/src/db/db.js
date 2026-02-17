const mongoose = require('mongoose');

async function connectDb() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("DB connected successfully");
    } catch (err) {
        console.error("DB connection failed", err);
    }
}

module.exports = connectDb;
