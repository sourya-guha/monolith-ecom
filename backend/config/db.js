const mongoose = require('mongoose');
const { logDependencyError } = require('../utils/dependency-logger');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    const error = new Error('MONGO_URI is not configured');
    error.code = 'MONGO_URI_MISSING';
    logDependencyError('mongodb', 'startup', error);
    throw error;
  }

  mongoose.connection.on('connected', () => {
    console.info('[mongodb] connection established');
  });
  mongoose.connection.on('disconnected', () => {
    console.error('[mongodb] connection lost; database-backed requests will return 503');
  });
  mongoose.connection.on('error', (error) => {
    logDependencyError('mongodb', 'connection', error);
  });

  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.info('[mongodb] startup connection established');
  } catch (error) {
    logDependencyError('mongodb', 'startup', error);
    throw error;
  }
};

module.exports = connectDB;