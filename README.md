# RoleSphere - Advanced Role and Permission Management System

RoleSphere is a full-featured role and permission management system built with React, Node.js, Express, and MongoDB.

## Features

### Admin Panel:
- Create and manage permissions (e.g., "View Dashboard", "Manage Users", etc.)
- Create and manage roles with multiple permissions
- Create and manage users with multiple assigned roles
- Set login credentials for users

### User Panel:
- User login with credentials created by the admin
- Sidebar menu showing all permissions assigned to the logged-in user
- Clicking on any permission takes the user to a placeholder page

## Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **Authentication**: Passport.js with Local Strategy

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- MongoDB (Local or Atlas)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/rolesphere.git
   cd rolesphere
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   MONGODB_URI=mongodb://127.0.0.1:27017/rolesphere
   SESSION_SECRET=your-secret-key-change-me
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000 in your browser

### Default Login

A default admin user is created on first run:
- Username: admin
- Password: admin

## Usage

### Admin Workflow

1. Log in as admin
2. Create permissions that represent system capabilities
3. Create roles and assign permissions to each role
4. Create users and assign roles to users
5. Provide login credentials to users

### User Workflow

1. Log in with credentials provided by admin
2. View the sidebar with all assigned permissions
3. Click on a permission to access the corresponding feature (placeholder page in this demo)

## Project Structure

- `/client`: Frontend React application
  - `/src/components`: Reusable UI components
  - `/src/pages`: Page components for different routes
  - `/src/hooks`: Custom React hooks
  - `/src/lib`: Utility functions and configurations

- `/server`: Backend Express application
  - `/db`: MongoDB connection and models
  - `/routes.ts`: API routes
  - `/auth.ts`: Authentication logic
  - `/storage-mongo.ts`: MongoDB data access layer

## Key Security Features

- Password hashing using scrypt
- Session-based authentication
- Route protection for authenticated users
- Role-based access control

## License

MIT 