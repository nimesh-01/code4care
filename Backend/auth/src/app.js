const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authroutes = require('./routes/auth.routes');
const superadminRoutes = require('./routes/superadmin.routes');
const cookieParser = require('cookie-parser');

const app = express();

// ✅ Convert env string → array safely
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [process.env.FRONTEND_URL || 'http://localhost:5173'];

console.log("✅ Allowed Origins:", allowedOrigins);

// ✅ CORS config (FIXED)
const corsOptions = {
  origin: (origin, callback) => {
    // ✅ allow requests like Postman / mobile apps
    if (!origin) return callback(null, true);

    // ✅ check allowed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error("❌ Blocked by CORS:", origin);
    return callback(new Error('CORS policy: This origin is not allowed'));
  },
  credentials: true,
};

// ✅ Apply CORS BEFORE routes
app.use(cors(corsOptions));


app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Auth service is running' });
});

app.use('/auth', authroutes);
app.use('/superadmin', superadminRoutes);

module.exports = app;