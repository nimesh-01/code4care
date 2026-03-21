const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const appointmentRoutes = require('./routes/appointment.routes');
const { connect } = require('./broker/broker');

const app = express();

// Connect to RabbitMQ
connect().then(() => {
  console.log('Broker connected for appointment service');
}).catch(err => {
  console.error('Failed to connect to broker:', err);
});

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : [])
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use('/appointment', appointmentRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
