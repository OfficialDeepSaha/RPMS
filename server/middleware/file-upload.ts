import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_CONFIG, formatS3Url } from '../config/aws-config';

// Ensure uploads directory exists for local fallback
const uploadDir = path.join(process.cwd(), 'uploads', 'profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure disk storage as a fallback
const diskStorage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb) {
    cb(null, uploadDir);
  },
  filename: function (req: Request, file: Express.Multer.File, cb) {
    // Generate unique file name with original extension
    const uniqueFileName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFileName);
  }
});

// For S3, we'll use memory storage
const memoryStorage = multer.memoryStorage();

// Determine which storage to use based on environment
const areAwsCredentialsConfigured = !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY;
const storage = areAwsCredentialsConfigured ? memoryStorage : diskStorage;

console.log(`Using ${areAwsCredentialsConfigured ? 'S3' : 'local'} storage for file uploads`);
// Upload function that tries S3 first, falls back to local if necessary
export const uploadToS3 = async (file: Express.Multer.File): Promise<{url: string, key: string, filename: string}> => {
  // If we're using disk storage as a fallback, the file is already saved locally
  if (!file.buffer && file.filename) {
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    // Make sure the URL format is correct
    const localUrl = `${baseUrl}/uploads/profiles/${file.filename}`;
    console.log('Using local storage, file path:', localUrl);
    return {
      url: localUrl,
      key: `uploads/profiles/${file.filename}`,
      filename: file.filename
    };
  }
  
  try {
    // Check if AWS credentials are configured
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials are not configured');
    }
    
    if (!file || !file.buffer) {
      throw new Error('Invalid file object or missing buffer');
    }

    // Get file extension or default to .jpg
    const fileExt = file.originalname ? path.extname(file.originalname) : '.jpg';
    
    // Generate unique filename
    const uniqueFileName = `${uuidv4()}${fileExt}`;
    const key = `${S3_CONFIG.basePath}${uniqueFileName}`;
    
    console.log('Uploading to S3:', {
      bucketName: S3_CONFIG.bucketName,
      key: key,
      contentType: file.mimetype,
      originalName: file.originalname,
      bufferLength: file.buffer.length
    });
    
    // Upload to S3
    const params = {
      Bucket: S3_CONFIG.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || 'image/jpeg'
    };
    
    await s3Client.send(new PutObjectCommand(params));
    
    // Return the full S3 URL to the uploaded image along with the key and filename
    // Use the formatting function to ensure proper URL structure
    const s3Url = formatS3Url(S3_CONFIG.baseUrl, key);
    console.log('Successfully uploaded to S3, URL:', s3Url);
    
    return {
      url: s3Url,
      key: key,
      filename: uniqueFileName
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    
    // If S3 upload failed but we have a file saved locally (disk storage was used)
    if (file.filename) {
      console.log('Falling back to local storage');
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      // Ensure proper URL formatting
      const localUrl = `${baseUrl}/uploads/profiles/${file.filename}`;
      
      return {
        url: localUrl,
        key: `uploads/profiles/${file.filename}`,
        filename: file.filename
      };
    }
    
    // If we're using memory storage but S3 upload failed, save file locally as fallback
    if (file.buffer) {
      console.log('S3 upload failed, saving file locally as fallback');
      const uniqueFileName = `${uuidv4()}${file.originalname ? path.extname(file.originalname) : '.jpg'}`;
      const filePath = path.join(uploadDir, uniqueFileName);
      
      try {
        fs.writeFileSync(filePath, file.buffer);
        console.log('Saved file locally at:', filePath);
        
        const baseUrl = process.env.APP_URL || 'http://localhost:3000';
        // Ensure proper URL formatting
        const localUrl = `${baseUrl}/uploads/profiles/${uniqueFileName}`;
        
        return {
          url: localUrl,
          key: `uploads/profiles/${uniqueFileName}`,
          filename: uniqueFileName
        };
      } catch (fsError) {
        console.error('Error saving file locally:', fsError);
        throw error; // Throw the original S3 error if local save also fails
      }
    }
    
    throw error;
  }
};

// Filter function to only allow certain file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Only accept images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    // Pass null as first argument for error
    cb(null, false);
    // You can also use next(new Error()) if you want to stop the request with an error
  }
};

// Configure multer for memory storage (we'll upload to S3 after multer processes)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // limit to 5MB
  }
});

export default upload;
