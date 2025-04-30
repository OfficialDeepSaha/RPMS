import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create and export S3 client
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// S3 bucket configuration
export const S3_CONFIG = {
  bucketName: process.env.AWS_S3_BUCKET_NAME || 'rolesphere-profile-images',
  basePath: 'uploads/profiles/',
  baseUrl: process.env.AWS_S3_BASE_URL || `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/`
};

// Helper to ensure proper URL formatting
export function formatS3Url(baseUrl: string, key: string): string {
  // Make sure the base URL ends with a slash
  const baseWithSlash = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  // Make sure the key doesn't start with a slash to avoid double slashes
  const keyWithoutSlash = key.startsWith('/') ? key.substring(1) : key;
  
  return baseWithSlash + keyWithoutSlash;
}
