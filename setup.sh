#!/bin/bash

# Exit on error
set -e

# Clean install
echo "Cleaning previous installation..."
rm -rf node_modules dist
npm cache clean --force

# Install dependencies
echo "Installing dependencies..."
npm install

# Build for production
echo "Building for production..."
npm run build

echo "Setup complete! You can now run:"
echo "npm run dev    # for development"
echo "npm start      # for production" 