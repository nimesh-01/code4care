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

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use('/appointment', appointmentRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
