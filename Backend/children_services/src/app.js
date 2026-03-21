const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");

// connect to DB (side-effect)
require('./db/mongoose');

const childrenRouter = require('./routes/children.routes');

const app = express();

// CORS configuration
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    process.env.FRONTEND_URL,
    ...(process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : [])
].filter(Boolean);

const corsOptions = {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
};

app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'children_services' }));

app.use('/api', childrenRouter);

module.exports = app;
