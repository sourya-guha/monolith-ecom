const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Trying to connect with:', process.env.MONGO_URI); // add this
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Full error:', err.message); // change this
    process.exit(1);
  }
};

module.exports = connectDB;