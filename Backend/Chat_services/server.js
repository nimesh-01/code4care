const http = require('http');
const app = require('./src/app');
const { initializeSocket } = require('./src/socket/socket');
const connectDb = require('./src/db/db');
require('dotenv').config();

const PORT = process.env.PORT || 3004;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// Connect to database and start server
connectDb().then(() => {
    server.listen(PORT, () => {
        console.log(`Chat Service running on port ${PORT}`);
        console.log(`WebSocket server ready for connections`);
    });
}).catch((err) => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
