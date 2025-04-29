import mongoose from 'mongoose';

const connectToDatabase = async () => {
  try {
    // Default to localhost connection if no MongoDB URI provided
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rolesphere';
    
    console.log('Connecting to MongoDB...');
    
    // Add connection options to avoid deprecation warnings
    await mongoose.connect(uri, {
      autoCreate: true, // Create the DB if it doesn't exist
    });
    
    console.log('Connected to MongoDB successfully');
    
    // Add connection error handler
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    // Listen to disconnection
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
    // Add graceful shutdown for Node process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
    return mongoose.connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

export default connectToDatabase; 