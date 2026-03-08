const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const eventRoutes = require('./routes/event.routes');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'event_services' }));

app.use('/event', eventRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
