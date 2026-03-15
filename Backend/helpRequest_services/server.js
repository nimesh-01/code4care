require('dotenv').config();
const app = require('./src/app');
const connectDb = require('./src/db/db');
const { connect: connectRabbit } = require('./src/broker/broker');

const PORT = process.env.PORT || 3003;

async function start() {
  try {
    await Promise.all([connectDb(), connectRabbit()]);
    app.listen(PORT, () => {
      console.log(`Help Request Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize Help Request Service', error);
    process.exit(1);
  }
}

start();
