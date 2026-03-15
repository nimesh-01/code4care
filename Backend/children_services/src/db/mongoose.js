const mongoose = require('mongoose');

async function connectDb() {
  if (!process.env.MONGO_URL) {
    throw new Error('MONGO_URL env variable is missing');
  }

  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB for children_services');
  } catch (err) {
    console.error('MongoDB connection error (children_services):', err.message);
    throw err;
  }
}

module.exports = connectDb;
