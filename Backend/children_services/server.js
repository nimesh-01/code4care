require('dotenv').config();
const app = require('./src/app');
const connectDb = require('./src/db/mongoose');

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`Children service listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize children service', error);
    process.exit(1);
  }
}

start();
