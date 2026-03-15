require('dotenv').config();
const app = require('./src/app');
const connectDb = require('./src/db/db');
const { connect: connectBroker } = require('./src/broker/broker');

const PORT = process.env.PORT || 3002;

async function start() {
  try {
    await Promise.all([connectDb(), connectBroker()]);
    app.listen(PORT, () => {
      console.log(`Appointment Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize Appointment Service', error);
    process.exit(1);
  }
}

start();
