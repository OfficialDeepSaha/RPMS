// Configuration file for server environment variables
import 'dotenv/config';

// Server configuration
export const PORT = process.env.PORT || 3000;

// MongoDB configuration
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rolesphere';

// Email configuration
export const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
export const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
export const EMAIL_USER = process.env.EMAIL_USER || '';
export const EMAIL_PASS = process.env.EMAIL_PASS || '';
export const EMAIL_FROM = process.env.EMAIL_FROM || 'admin@rolesphere.com';
export const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Other configurations can be added here as needed
export const NODE_ENV = process.env.NODE_ENV || 'development';
