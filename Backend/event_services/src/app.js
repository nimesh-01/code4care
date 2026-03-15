const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const eventRoutes = require('./routes/event.routes');

const app = express();

const allowedOrigins = (() => {
  if (process.env.CORS_ALLOWED_ORIGINS === '*') return '*';
  if (process.env.CORS_ALLOWED_ORIGINS) {
    return process.env.CORS_ALLOWED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }
  const fallbacks = [process.env.FRONTEND_URL, process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'];
  return [...new Set(fallbacks.filter(Boolean).map((origin) => origin.trim()))];
})();

const corsOptions = {
  origin: allowedOrigins === '*'
    ? true
    : (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('CORS policy: This origin is not allowed'));
      },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'event_services' }));

app.use('/event', eventRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
