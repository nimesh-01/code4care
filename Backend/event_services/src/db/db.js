const mongoose = require('mongoose');

async function connectDb() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Event Service DB connected successfully");
    } catch (err) {
        console.error("Event Service DB connection failed", err);
    }
}

module.exports = connectDb;
