import mongoose from 'mongoose';
import { log } from '../vite';
import { MONGODB_URI } from '../config';

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Try connecting to the MongoDB instance
    await mongoose.connect(MONGODB_URI);
    log('Connected to MongoDB at ' + MONGODB_URI, 'mongodb');
    
    // Set up connection error handler
    mongoose.connection.on('error', (err) => {
      log('MongoDB connection error', 'mongodb');
    });
    
    // Set up disconnection handler
    mongoose.connection.on('disconnected', () => {
      log('MongoDB disconnected. You may experience limited functionality.', 'mongodb');
    });
    
    return mongoose.connection;
  } catch (error) {
    log('Could not connect to MongoDB', 'mongodb');
    log('The application will continue but database operations may fail', 'mongodb');
    
    // Create a simple mock for the storage methods to prevent crashing
    // This only helps the app to start, but won't provide actual functionality
    return mongoose.connection;
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      log('MongoDB connection closed', 'mongodb');
    }
  } catch (err) {
    log('Error while closing MongoDB connection', 'mongodb');
  }
  process.exit(0);
});

export default connectDB;
