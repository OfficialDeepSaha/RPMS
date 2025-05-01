#!/bin/bash
# Render deployment script

# Exit on any error
set -e

# Display Node and npm versions
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Print current directory
echo "Current directory: $(pwd)"
echo "Listing directories:"
ls -la

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install client dependencies and build client
echo "Installing and building client..."
cd client
npm install
cd ..

# Build the application with vite and the server
echo "Building client and server with vite..."
npm run build

# Check client build outputs
echo "Checking for client build output..."
echo "Looking in client/dist:"
ls -la client/dist || echo "⚠️ client/dist not found"
echo "Looking in dist/public:"
ls -la dist/public || echo "⚠️ dist/public not found"

# Make sure build output is available in both possible locations
# Copy from dist/public to client/dist if needed
if [ ! -d "client/dist" ] && [ -d "dist/public" ]; then
  echo "Copying build from dist/public to client/dist..."
  mkdir -p client/dist
  cp -r dist/public/* client/dist/ || echo "⚠️ Failed to copy to client/dist"
fi

# Copy from client/dist to dist/public if needed
if [ ! -d "dist/public" ] && [ -d "client/dist" ]; then
  echo "Copying build from client/dist to dist/public..."
  mkdir -p dist/public
  cp -r client/dist/* dist/public/ || echo "⚠️ Failed to copy to dist/public"
fi

# Also make a backup copy in dist/client
echo "Creating backup copy in dist/client..."
mkdir -p dist/client

# Copy from either source that exists
if [ -d "client/dist" ]; then
  cp -r client/dist/* dist/client/ || echo "⚠️ Failed to copy backup from client/dist"
elif [ -d "dist/public" ]; then
  cp -r dist/public/* dist/client/ || echo "⚠️ Failed to copy backup from dist/public"
else
  echo "⚠️ WARNING: No build output found to copy to dist/client"
fi

# Check final structure
echo "Final directory structure:"
echo "Root directory:"
ls -la
echo "dist directory:"
ls -la dist || echo "dist not found"
echo "client directory:"
ls -la client || echo "client not found"

# Log completion
echo "Build completed successfully!" 