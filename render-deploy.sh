#!/bin/bash
# Render deployment script

# Exit on any error
set -e

# Display Node and npm versions
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building client and server..."
npm run build

# Log completion
echo "Build completed successfully!" 