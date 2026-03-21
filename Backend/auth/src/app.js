const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authroutes = require('./routes/auth.routes');
const superadminRoutes = require('./routes/superadmin.routes');
const cookieParser = require('cookie-parser');

const app = express();

// Trust the proxy (Render/Heroku/Nginx) to ensure secure cookies work
app.set('trust proxy', 1);

// ✅ Convert env string → array safely
const allowedOrigins = [
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