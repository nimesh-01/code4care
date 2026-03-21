const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authroutes = require('./routes/auth.routes');
const superadminRoutes = require('./routes/superadmin.routes');
const cookieParser = require('cookie-parser');

const app = express();

// ✅ Convert env string → array safely
const allowedOrigins = [
  "https://agentic-ai-01.onrender.com",
  "https://agenticais.netlify.app",
  "http://localhost:5173",
  process.env.FRONTEND_URL
].filter(Boolean);

// ✅ CORS config
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));


app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Auth service is running' });
});

app.use('/auth', authroutes);
app.use('/superadmin', superadminRoutes);

module.exports = app;