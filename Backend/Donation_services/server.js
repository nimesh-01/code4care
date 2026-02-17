const app = require('./src/app');
const connectDB = require('./src/config/db');
require('dotenv').config();

const PORT = process.env.PORT || 3006;

// Connect to MongoDB
connectDB();

app.listen(PORT, () => {
    console.log(`💰 Donation & Payment Service running on port ${PORT}`);
});
