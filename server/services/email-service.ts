import nodemailer from 'nodemailer';
import { log } from '../vite';

// Email configuration with defaults for development
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.ethereal.email';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'admin@rolesphere.com';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Create a transporter object
const createTransporter = () => {
  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
};

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email using nodemailer
 * @param options Email options (to, subject, text/html content)
 * @returns Promise that resolves when email is sent
 */
export const sendEmail = async (options: SendEmailOptions): Promise<boolean> => {
  try {
    // If no email configuration provided, log the email instead of sending it
    if (!EMAIL_USER || !EMAIL_PASS) {
      log(`[EMAIL NOT SENT - NO CREDENTIALS] To: ${options.to}, Subject: ${options.subject}`, 'email');
      log(`[EMAIL CONTENT] ${options.text || options.html}`, 'email');
      return true;
    }

    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    
    log(`Email sent to: ${options.to}`, 'email');
    return true;
  } catch (error) {
    log(`Error sending email: ${error}`, 'email');
    return false;
  }
};

/**
 * Send a welcome email to a new user
 * @param username User's username
 * @param email User's email address
 * @param password User's initial password (if applicable)
 * @param name User's full name
 * @returns Promise that resolves when email is sent
 */
export const sendWelcomeEmail = async (
  username: string,
  email: string,
  password: string | null,
  name: string
): Promise<boolean> => {
  const subject = 'Welcome to RoleSphere - Account Created';
  
  const text = `
Hello ${name},

An administrator has created an account for you in the RoleSphere system.

Your account details:
Username: ${username}
${password ? `Initial Password: ${password} (Please change this on first login)` : 'Your administrator has set your password.'}

You can access the system at: ${APP_URL}

If you have any questions, please contact your system administrator.

Regards,
The RoleSphere Team
  `;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to RoleSphere</title>
  <style>
    /* Professional styling with enterprise design elements */
    :root {
      color-scheme: light;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #1a202c;
      background-color: #f7fafc;
      margin: 0;
      padding: 0;
    }
    
    .email-wrapper {
      background-color: #f7fafc;
      padding: 30px 10px;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.03);
    }
    
    .email-header {
      position: relative;
      padding: 30px 0;
      text-align: center;
      background-color: #2a3f5f;
      background-image: linear-gradient(135deg, #3b5998 0%, #2a3f5f 100%);
    }
    
    .logo-container {
      margin-bottom: 15px;
    }
    
    .logo {
      display: inline-block;
      font-size: 28px;
      font-weight: 700;
      color: white;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    
    .welcome-text {
      font-size: 20px;
      font-weight: 300;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 5px;
    }
    
    .email-body {
      padding: 40px;
      color: #4a5568;
    }
    
    .email-body p {
      margin-bottom: 20px;
      font-size: 16px;
    }
    
    .greeting {
      font-size: 20px;
      color: #2a3f5f;
      font-weight: 500;
      margin-bottom: 25px;
    }
    
    .credentials-container {
      background-color: #f8fafc;
      border-left: 4px solid #3b5998;
      padding: 25px;
      border-radius: 6px;
      margin: 30px 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    
    .credential-title {
      font-weight: 600;
      color: #2a3f5f;
      margin-bottom: 15px;
      font-size: 16px;
    }
    
    .credential-item {
      margin-bottom: 12px;
      font-size: 15px;
    }
    
    .credential-label {
      font-weight: 600;
      display: inline-block;
      min-width: 100px;
      color: #4a5568;
    }
    
    .credential-value {
      font-weight: 500;
      color: #2a3f5f;
      background-color: #edf2f7;
      padding: 3px 8px;
      border-radius: 4px;
    }
    
    .password-notice {
      font-style: italic;
      font-size: 14px;
      color: #718096;
      margin-top: 12px;
      padding-left: 5px;
      border-left: 2px solid #e2e8f0;
    }
    
    .login-button-container {
      text-align: center;
      margin: 35px 0;
    }
    
    .login-button {
      display: inline-block;
      background-color: #3b5998;
      color: white;
      text-decoration: none;
      padding: 12px 35px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }
    
    .login-button:hover {
      background-color: #2a3f5f;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    .divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 30px 0;
    }
    
    .info-section {
      display: flex;
      align-items: flex-start;
      background-color: #f8fafc;
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 30px;
    }
    
    .info-icon {
      margin-right: 15px;
      color: #3b5998;
      font-size: 20px;
    }
    
    .info-content {
      flex: 1;
    }
    
    .info-title {
      font-weight: 600;
      color: #2a3f5f;
      margin-bottom: 8px;
      font-size: 16px;
    }
    
    .note {
      font-size: 14px;
      color: #718096;
      margin-top: 25px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    
    .email-footer {
      background-color: #f8fafc;
      padding: 30px;
      text-align: center;
      color: #718096;
      font-size: 13px;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer-logo {
      color: #2a3f5f;
      font-weight: 600;
      font-size: 16px;
      letter-spacing: 1px;
      margin-bottom: 15px;
    }
    
    .company-info {
      margin-bottom: 15px;
    }
    
    .footer-links {
      margin: 15px 0;
    }
    
    .footer-link {
      color: #3b5998;
      text-decoration: none;
      margin: 0 10px;
    }
    
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 10px 5px;
      }
      
      .email-container {
        width: 100%;
        border-radius: 0;
      }
      
      .email-body {
        padding: 25px 20px;
      }
      
      .email-header, .email-footer {
        padding: 20px;
      }
      
      .credentials-container {
        padding: 20px 15px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="logo-container">
          <span class="logo">ROLESPHERE</span>
        </div>
        <div class="welcome-text">Welcome to Your New Account</div>
      </div>
      
      <div class="email-body">
        <p class="greeting">Hello ${name},</p>
        
        <p>Your account has been created in the RoleSphere system. We're excited to have you join our platform for efficient role-based access management.</p>
        
        <div class="credentials-container">
          <div class="credential-title">Your Secure Login Credentials</div>
          <div class="credential-item">
            <span class="credential-label">Username:</span>
            <span class="credential-value">${username}</span>
          </div>
          ${password ? `
          <div class="credential-item">
            <span class="credential-label">Password:</span>
            <span class="credential-value">${password}</span>
          </div>
          <p class="password-notice">For security reasons, please change your password immediately after your first login.</p>
          ` : '<p class="password-notice">Your administrator has set your password.</p>'}
        </div>
        
        <div class="login-button-container">
          <a href="${APP_URL}" class="login-button">Access Your Account</a>
        </div>
        
        <div class="divider"></div>
        
        <div class="info-section">
          <div class="info-icon">ℹ️</div>
          <div class="info-content">
            <div class="info-title">About RoleSphere</div>
            <p>RoleSphere is an enterprise-grade role-based access control system designed to help organizations efficiently manage user permissions, roles, and system access.</p>
          </div>
        </div>
        
        <p class="note">If you have any questions or need assistance, please contact your system administrator or support team.</p>
      </div>
      
      <div class="email-footer">
        <div class="footer-logo">ROLESPHERE</div>
        <div class="company-info">RoleSphere &copy; ${new Date().getFullYear()} | All Rights Reserved</div>
        <div class="footer-links">
          <a href="${APP_URL}/help" class="footer-link">Help</a>
          <a href="${APP_URL}/privacy" class="footer-link">Privacy Policy</a>
          <a href="${APP_URL}/terms" class="footer-link">Terms of Service</a>
        </div>
        <div>This is an automated message, please do not reply to this email.</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  
  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
};
