const app = require('./src/app');
const connectDB = require('./src/config/db');
const { connect: connectRabbit } = require('./src/broker/broker');
require('dotenv').config();

const PORT = process.env.PORT || 3006;

async function start() {
    try {
        await Promise.all([connectDB(), connectRabbit()]);
        app.listen(PORT, () => {
            console.log(`💰 Donation & Payment Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to initialize Donation Service', error);
        process.exit(1);
    }
}

start();
