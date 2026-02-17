const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helpRequestRoutes = require('./routes/helpRequest.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use('/help', helpRequestRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
