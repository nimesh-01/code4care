const app = require('./src/app');
const connectDB = require('./src/config/db');
const { connect: connectRabbit } = require('./src/broker/broker');
require('dotenv').config();

const PORT = process.env.PORT || 3006;

// Connect to MongoDB and RabbitMQ
connectDB();
connectRabbit();

app.listen(PORT, () => {
    console.log(`💰 Donation & Payment Service running on port ${PORT}`);
});
