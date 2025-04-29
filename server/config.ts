// Configuration file for server environment variables
import 'dotenv/config';

// Server configuration
export const PORT = process.env.PORT || 3000;

// MongoDB configuration
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rolesphere';

// Other configurations can be added here as needed
export const NODE_ENV = process.env.NODE_ENV || 'development';
