import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables for security
dotenv.config();

// AWS Configuration - for security in a production environment, 
// these values should be stored in environment variables
// rather than hardcoded in the source code
const AWS_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "AKIAZ3MGM2F433VXTV7T",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "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",
  region: process.env.AWS_REGION || "us-east-1"
};

// Create S3 service object directly with config
const s3 = new AWS.S3(AWS_CONFIG);

export const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "ultimate-connector-bucket";
export default s3;
