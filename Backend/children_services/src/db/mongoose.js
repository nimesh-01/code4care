const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGO_URL;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB for children_services');
  })
  .catch((err) => {
    console.error('MongoDB connection error (children_services):', err.message);
  });

module.exports = mongoose;
