const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");

// connect to DB (side-effect)
require('./db/mongoose');

const childrenRouter = require('./routes/children.routes');

const app = express();

app.use(cookieParser());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'children_services' }));

app.use('/api', childrenRouter);

module.exports = app;
